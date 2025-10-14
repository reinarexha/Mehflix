import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Comment = {
  id: string;
  trailer_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  likes?: number;
  commenterUsername?: string | null;
  _unsynced?: boolean;
  _error?: string | null;
};

type Props = { movieId: string; userId: string };

export default function CommentSection({ movieId, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // 1️⃣ Fetch comments
  useEffect(() => {
    async function loadComments() {
      // Try join; if relationship missing, fallback to no-join and map usernames
      try {
        const res = await supabase
          .from('comments')
          .select('id, movie_id, user_id, content, created_at, commenter:profiles(username)')
          .eq('movie_id', movieId)
          .order('created_at', { ascending: true })
        if (!res.error && res.data) {
          const rows = (res.data as any[]).map((r) => ({
            ...r,
            commenterUsername: Array.isArray(r.commenter) ? (r.commenter[0]?.username ?? null) : (r.commenter?.username ?? null)
          }))
          setComments(rows as Comment[])
          return
        }

        const relErrMsg = 'Could not find a relationship'
        if (res.error && String(res.error.message || res.error).includes(relErrMsg)) {
          // fallback: fetch comments without join and then fetch usernames
          const { data: rowsData, error: rowsErr } = await supabase
            .from('comments')
            .select('id, movie_id, user_id, content, created_at, likes')
            .eq('movie_id', movieId)
            .order('created_at', { ascending: true })
          if (rowsErr) throw rowsErr
          const rows = (rowsData ?? []) as any[]
          const uids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))
          let profilesMap = new Map()
          if (uids.length) {
            const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', uids)
            profilesMap = new Map((profiles ?? []).map((p: any) => [p.id, p.username]))
          }
          setComments(rows.map(r => ({ ...r, commenterUsername: profilesMap.get(r.user_id) ?? null })) as Comment[])
          return
        }
      } catch (e) {
        console.warn('Failed to load comments', e)
      }
    }
    loadComments();
  }, [movieId]);

  // 2️⃣ Add a new comment
  async function addComment() {
    if (!newComment) return;
    // optimistic comment (string id so it can be filtered later)
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      trailer_id: movieId,
      user_id: userId,
      content: newComment,
      created_at: new Date().toISOString(),
      commenterUsername: null,
      likes: 0,
    }
    setComments(prev => [optimistic, ...prev])

    const attempt = async () => {
      const { data, error } = await supabase
        .from("comments")
        .insert([{ trailer_id: movieId, user_id: userId, content: newComment }])
        .select('id, trailer_id, user_id, content, created_at, likes, commenter:profiles(username)');

      // if trailer_id column missing, try movie_id fallback
      if (error && String(error.message || error).includes('trailer_id')) {
        const { data: fbData, error: fbErr } = await supabase
          .from('comments')
          .insert([{ movie_id: movieId, user_id: userId, content: newComment }])
          .select('id, trailer_id, movie_id, user_id, content, created_at, likes, commenter:profiles(username)')
        if (!fbErr && fbData) {
          const r = fbData[0]
          const commenterUsername = Array.isArray(r.commenter) ? (r.commenter[0]?.username ?? null) : (r.commenter?.username ?? null)
          setComments(prev => [ { ...r, commenterUsername }, ...prev.filter(c => !c.id.toString().startsWith('temp-')) ])
          setNewComment("")
          return true
        }
        setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, _unsynced: true, _error: (fbErr?.message ?? error?.message ?? 'Failed to save') } : c))
        return false
      }

      if (!error && data) {
        const r = data[0]
        const commenterUsername = Array.isArray(r.commenter) ? (r.commenter[0]?.username ?? null) : (r.commenter?.username ?? null)
        // Replace optimistic with real row
        setComments(prev => [
          { ...r, commenterUsername },
          ...prev.filter(c => !c.id.toString().startsWith('temp-'))
        ])
        setNewComment("");
        return true
      }

      // mark optimistic as unsynced with error
      setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, _unsynced: true, _error: error?.message ?? 'Failed to save' } : c))
      return false
    }

    try {
      await attempt()
    } catch (e:any) {
      // mark unsynced and show error
      setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, _unsynced: true, _error: e?.message ?? 'Failed to save' } : c))
    }
  }

  // Retry saving an optimistic comment
  async function retrySaveComment(comment: Comment) {
    // clear error while retrying
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, _unsynced: false, _error: null } : c))
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ trailer_id: comment.trailer_id, user_id: comment.user_id, content: comment.content }])
        .select('id, trailer_id, user_id, content, created_at, likes, commenter:profiles(username)')
      if (error && String(error.message || error).includes('trailer_id')) {
        const { data: fbData, error: fbErr } = await supabase
          .from('comments')
          .insert([{ movie_id: comment.trailer_id, user_id: comment.user_id, content: comment.content }])
          .select('id, trailer_id, movie_id, user_id, content, created_at, likes, commenter:profiles(username)')
        if (!fbErr && fbData) {
          const r = fbData[0]
          const commenterUsername = Array.isArray(r.commenter) ? (r.commenter[0]?.username ?? null) : (r.commenter?.username ?? null)
          setComments(prev => [ { ...r, commenterUsername }, ...prev.filter(c => c.id !== comment.id) ])
          return
        }
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, _unsynced: true, _error: (fbErr?.message ?? error?.message ?? 'Failed to save') } : c))
        return
      }

      if (!error && data) {
        const r = data[0]
        const commenterUsername = Array.isArray(r.commenter) ? (r.commenter[0]?.username ?? null) : (r.commenter?.username ?? null)
        setComments(prev => [ { ...r, commenterUsername }, ...prev.filter(c => c.id !== comment.id) ])
      } else {
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, _unsynced: true, _error: error?.message ?? 'Failed to save' } : c))
      }
    } catch (e:any) {
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, _unsynced: true, _error: e?.message ?? 'Failed to save' } : c))
    }
  }

  // 3️⃣ Delete a comment
  async function deleteComment(id: string) {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments(comments.filter((c) => c.id !== id));
  }

  // 4️⃣ Update a comment
  async function updateComment(id: string, content: string) {
    const { data, error } = await supabase
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (!error && data) {
      setComments(
        comments.map((c) => (c.id === id ? { ...c, content: data[0].content } : c))
      );
    }
  }

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded text-white">
      <h4 className="font-semibold mb-2">Comments</h4>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="p-2 rounded w-full text-black"
        />
        <button onClick={addComment} className="bg-purple-600 px-3 rounded">
          Add
        </button>
      </div>

      {comments.map((c) => (
        <div key={c.id} className="border-b border-gray-600 py-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-semibold text-white">{c.commenterUsername ?? c.user_id}</div>
              <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
            </div>
            {c.user_id === userId && (
              <div className="flex gap-1">
                <button
                  className="text-xs text-yellow-400"
                  onClick={() => {
                    const edited = prompt("Edit comment:", c.content);
                    if (edited) updateComment(c.id, edited);
                  }}
                >
                  Edit
                </button>
                <button
                  className="text-xs text-red-400"
                  onClick={() => deleteComment(c.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-white">{c.content}</div>
          {c._unsynced && (
            <div className="mt-2 text-sm text-yellow-300 flex items-center justify-between">
              <div>Not saved: {c._error}</div>
              <div>
                <button className="text-xs underline" onClick={() => retrySaveComment(c)}>Retry</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
