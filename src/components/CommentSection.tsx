import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import { supabase } from "../lib/supabaseClient";
import { toggleLikeComment } from "../lib/data";

type Profile = { username: string };
type Movie = { title: string };

type Comment = {
  id: string;
  movie_id?: string | null;
  user_id: string;
  content: string;
  created_at: string;
  likes?: number;
  commenter?: Profile[]; // Supabase returns array for joins
  movie?: Movie[];
  commenterUsername?: string | null;
  movieTitle?: string | null;
  _unsynced?: boolean;
  _error?: string | null;
};

type Props = { movieId: string; userId?: string | null };

export default function CommentSection({ movieId, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const { user } = useUser()
  // Prefer the authenticated user's id from context but allow an override prop
  const resolvedUserId = userId ?? user?.id ?? null

  // Load the signed-in user's profile username so optimistic comments show the username
  useEffect(() => {
    let mounted = true;
    async function loadUsername() {
      if (!resolvedUserId) {
        setCurrentUsername(null);
        return;
      }
      try {
        const { data, error } = await supabase.from('profiles').select('username').eq('id', resolvedUserId).single();
        if (!mounted) return;
        if (!error && data) setCurrentUsername(data.username ?? null);
      } catch (e) {
        console.warn('Failed to load current username', e);
      }
    }
    loadUsername();
    return () => {
      mounted = false;
    };
  }, [resolvedUserId]);

  useEffect(() => {
    async function loadComments() {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select(`
            id,
            movie_id,
            user_id,
            content,
            created_at,
            likes,
            commenter:profiles(username),
            movie:movies(title)
          `)
          .eq("movie_id", movieId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Supabase returns joined rows as arrays; TypeScript can infer 'never' for empty [] literals
        // Cast the incoming rows to `any` for safe mapping of joined fields like commenter and movie
        // Keep commenterUsername null when join didn't return a username so we can fetch missing ones
        const mapped = ((data || []) as any[]).map((c: any) => ({
          ...c,
          commenterUsername: Array.isArray(c.commenter)
            ? c.commenter[0]?.username ?? null
            : c.commenter?.[0]?.username ?? null,
          movieTitle: Array.isArray(c.movie)
            ? c.movie[0]?.title ?? "Unknown Movie"
            : c.movie?.[0]?.title ?? "Unknown Movie",
        }));

        setComments(mapped);
        // If some rows lacked commenterUsername (join may have failed), fetch profiles separately
        const missingUserIds = Array.from(
          new Set(
            mapped
              .map((r) => (r.commenterUsername ? null : r.user_id))
              .filter(Boolean) as string[]
          )
        );
        if (missingUserIds.length) {
          try {
            const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', missingUserIds);
            const mapProfiles = new Map((profiles ?? []).map((p: any) => [p.id, p.username]));
            setComments((prev) => prev.map((r) => ({ ...r, commenterUsername: r.commenterUsername ?? mapProfiles.get(r.user_id) ?? r.user_id })));
          } catch (e) {
            // ignore profile fetch errors; we'll keep the user_id fallback
            console.warn('Failed to load missing profile usernames', e);
          }
        }
      } catch (e) {
        console.error("Failed to load comments:", e);
      }
    }

    loadComments();
  }, [movieId]);

  async function addComment() {
    if (!newComment || !resolvedUserId) return;

    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      movie_id: movieId,
      user_id: resolvedUserId as string,
      content: newComment,
      created_at: new Date().toISOString(),
      likes: 0,
      // only set the username if we have it; render will prefix with @ when present
      commenterUsername: currentUsername ?? null,
      movieTitle: null,
      _unsynced: false,
    };
    setComments((prev) => [optimistic, ...prev]);
    setNewComment("");

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([{ movie_id: movieId, user_id: resolvedUserId, content: optimistic.content }])
        .select(`
          id,
          movie_id,
          user_id,
          content,
          created_at,
          likes,
          commenter:profiles(username),
          movie:movies(title)
        `);

      if (error || !data || !data.length) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === optimistic.id ? { ...c, _unsynced: true, _error: error?.message ?? "Failed to save" } : c
          )
        );
        return;
      }

      const c = (data as any[])[0];
      setComments((prev) => [
        {
          ...c,
          commenterUsername: Array.isArray(c.commenter)
            ? c.commenter[0]?.username ?? null
            : c.commenter?.[0]?.username ?? null,
          movieTitle: Array.isArray(c.movie)
            ? c.movie[0]?.title ?? "Unknown Movie"
            : c.movie?.[0]?.title ?? "Unknown Movie",
        },
        ...prev.filter((p) => !p.id.toString().startsWith("temp-")),
      ]);
    } catch (e: any) {
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...c, _unsynced: true, _error: e.message ?? "Failed to save" } : c))
      );
    }
  }

  async function toggleLike(comment: Comment) {
    if (!resolvedUserId) return alert("Please sign in to like comments");
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, likes: (c.likes ?? 0) + 1 } : c)));
    try {
      const res = await toggleLikeComment(resolvedUserId, comment.id);
      if (!res || res.liked === false) {
        setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, likes: Math.max(0, (c.likes ?? 1) - 1) } : c)));
      }
    } catch {
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, likes: Math.max(0, (c.likes ?? 1) - 1) } : c)));
    }
  }

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded text-white">
      <h4 className="font-semibold mb-2">Comments</h4>

      <div className="flex gap-2 mb-3">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="p-2 rounded w-full text-black"
        />
        <button onClick={addComment} className="bg-purple-600 px-3 rounded">
          Add
        </button>
      </div>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="border-b border-gray-600 py-2">
            <div className="text-sm font-semibold">
              {c.commenterUsername ? `@${c.commenterUsername}` : c.user_id} on {c.movieTitle}
            </div>
            <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
            <div className="mt-2 text-white">{c.content}</div>
            <div className="mt-2">
              <button
                onClick={() => toggleLike(c)}
                className="px-2 py-1 rounded-sm border border-white/10 bg-white/5"
              >
                Like {c.likes ?? 0}
              </button>
            </div>
            {c._unsynced && <div className="mt-2 text-sm text-yellow-300">Not saved: {c._error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
