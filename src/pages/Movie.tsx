import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { supabase } from "../lib/supabaseClient";
import {
  getMovieById,
  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
  toggleLikeComment,
  type CommentRow,
  type Trailer,
} from "../lib/data";

// ---- Types ----
type RouteState = { title?: string; year?: string; poster?: string; rank?: number } | null;
type DisplayComment = CommentRow & { commenterUsername?: string | null; _unsynced?: boolean; _error?: string | null };
type SupabaseComment = {
  id: string;
  user_id: string;
  trailer_id?: string;
  content: string;
  created_at: string;
  likes?: number;
  commenter?: { username: string | null } | { username: string | null }[] | null;
};

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const videoId = id || "";
  const location = useLocation();
  const routeState = (location.state as RouteState) ?? null;
  const [movieData, setMovieData] = useState<Trailer | null>(null);

  // Load movie from DB for richer details
  useEffect(() => {
    async function loadMovie() {
      try {
        const data = await getMovieById(videoId);
        setMovieData(data);
      } catch (error) {
        console.error("Failed to load movie:", error);
      }
    }
    if (videoId) loadMovie();
  }, [videoId]);

  // Build display trailer with route fallbacks
  const trailer = useMemo(() => ({
    id: movieData?.id || videoId,
    title: routeState?.title || movieData?.title || "Untitled Movie",
    year: routeState?.year || "2023",
    ranking: routeState?.rank || Math.floor(Math.random() * 100),
    youtube_id: movieData?.youtube_id || videoId,
    category: movieData?.category || "Drama",
    poster_url: routeState?.poster || movieData?.poster_url || "https://via.placeholder.com/360x540?text=No+Poster",
    summary: "No summary available for this movie yet.",
  }), [videoId, routeState, movieData]);

  const src = `https://www.youtube.com/embed/${trailer.youtube_id}?autoplay=0&rel=0&modestbranding=1`;

  const [isFav, setIsFav] = useState(false);
  const [inList, setInList] = useState(false);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Load favorite/watchlist state
  useEffect(() => {
    async function loadStatus() {
      if (!user || !videoId) return;
      try {
        const favs = await fetchFavorites(user.id);
        const wls = await fetchWatchlist(user.id);
        setIsFav(favs.some((t) => t.youtube_id === trailer.youtube_id || t.id === trailer.id));
        setInList(wls.some((t) => t.youtube_id === trailer.youtube_id || t.id === trailer.id));
      } catch (e) {
        console.error("Failed to load favorite/watchlist status", e);
      }
    }
    loadStatus();
  }, [user, videoId, trailer.id, trailer.youtube_id]);

  // Fetch comments with joined profile username
  const fetchComments = useCallback(async (): Promise<DisplayComment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, likes, commenter:profiles(username)")
      .eq("trailer_id", videoId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((r: SupabaseComment) => {
      let commenterUsername: string | null = null;
      if (Array.isArray(r.commenter) && r.commenter.length > 0 && typeof r.commenter[0] === 'object') {
        commenterUsername = (r.commenter[0] as { username: string | null }).username ?? null;
      } else if (r.commenter && typeof r.commenter === 'object') {
        commenterUsername = (r.commenter as { username: string | null }).username ?? null;
      }
      return {
        id: r.id,
        user_id: r.user_id,
        trailer_id: r.trailer_id ?? videoId,
        content: r.content,
        created_at: r.created_at,
        likes: r.likes ?? 0,
        commenterUsername,
        _unsynced: false,
        _error: null,
      } as DisplayComment;
    });
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;
    fetchComments().then(setComments);
  }, [videoId, fetchComments]);

  // Add a new comment with optimistic UI
  async function addComment(userId: string, trailerIdentifier: string, content: string) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([{ user_id: userId, trailer_id: trailerIdentifier, content }])
        .select("id, user_id, trailer_id, content, created_at, likes, commenter:profiles(username)");
      if (error) throw error;

      const r = (data?.[0] ?? {}) as SupabaseComment;
      let commenterUsername: string | null = null;
      if (Array.isArray(r.commenter) && r.commenter.length > 0 && typeof r.commenter[0] === 'object') {
        commenterUsername = (r.commenter[0] as { username: string | null }).username ?? null;
      } else if (r.commenter && typeof r.commenter === 'object') {
        commenterUsername = (r.commenter as { username: string | null }).username ?? null;
      }
      return {
        id: r.id,
        user_id: r.user_id,
        trailer_id: r.trailer_id ?? trailerIdentifier,
        content: r.content,
        created_at: r.created_at,
        likes: r.likes ?? 0,
        commenterUsername,
        _unsynced: false,
        _error: null,
      } as DisplayComment;
    } catch (e) {
      console.error("Failed to add comment", e);
      throw e;
    }
  }

  // Placeholder cast and similar
  const cast = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: i % 2 === 0 ? "Reina Holt" : "Aron Vega",
    role: i % 2 === 0 ? "Main Actor" : "Director",
  }));
  const similar = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    title: `Movie ${i + 1}`,
    poster: "https://via.placeholder.com/150x220?text=Movie",
  }));

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#151336" }}>
      <div className="max-w-[1200px] mx-auto p-6 flex gap-8">
        {/* Left column (poster + info) */}
        <div className="w-[360px] flex-shrink-0">
          <img src={trailer.poster_url} alt={trailer.title} className="rounded-lg shadow-2xl w-full h-[540px] object-cover" />

          {/* Favorites & Watchlist buttons */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={async () => {
                if (!user) return alert("Please sign in to favorite");
                setIsFav((v) => !v);
                try {
                  await toggleFavorite(user.id, trailer);
                } catch {
                  setIsFav((v) => !v);
                }
              }}
              className={`px-4 py-2 rounded font-semibold ${
                isFav ? "bg-purple-600" : "bg-white/10 border border-white/10 hover:bg-white/15"
              }`}
            >
              {isFav ? "Favorited" : "Add to Favorites"}
            </button>

            <button
              onClick={async () => {
                if (!user) return alert("Please sign in to use watchlist");
                setInList((v) => !v);
                try {
                  await toggleWatchlist(user.id, trailer);
                } catch {
                  setInList((v) => !v);
                }
              }}
              className={`px-4 py-2 rounded font-semibold ${
                inList ? "bg-indigo-600" : "bg-white/10 border border-white/10 hover:bg-white/15"
              }`}
            >
              {inList ? "In Watchlist" : "Add to Watchlist"}
            </button>
          </div>

          {/* Cast Section */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Cast</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 pb-3">
              {cast.map((c) => (
                <div key={c.id} className="bg-white/5 border border-white/10 p-3 rounded-lg min-w-[120px] flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold mb-2">
                    {c.name[0]}
                  </div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* More Like This */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">More Like This</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 pb-3">
              {similar.map((m) => (
                <a key={m.id} href={`/movie/${m.id}`} className="flex-shrink-0">
                  <img src={m.poster} alt={m.title} className="w-[120px] h-[180px] rounded-lg" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (trailer + summary + comments) */}
        <div className="flex-1">
          <header className="mb-4">
            <h1 className="text-4xl font-extrabold">{trailer.title}</h1>
            <div className="text-gray-300 flex gap-3 text-lg">
              <span>{trailer.year}</span>
              <span className="text-yellow-400 font-bold">Rank: {trailer.ranking}</span>
            </div>
          </header>

          {/* Trailer */}
          <div className="rounded-lg overflow-hidden shadow-2xl bg-black h-[400px] mb-4">
            <iframe
              src={src}
              title={`${trailer.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-gray-100 mb-8">
            <p>{trailer.summary}</p>
          </div>

          {/* Comment Section */}
          <section className="max-w-3xl mx-auto mb-10">
            <h3 className="text-2xl font-bold mb-4">Comments</h3>
            <form
              className="flex gap-2 mb-4 bg-white/5 p-3 rounded-lg border border-white/10"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) return alert("Please sign in to comment");
                const content = newComment.trim();
                if (!content) return;
                const optimistic: DisplayComment = {
                  id: `temp-${Date.now()}`,
                  user_id: user.id,
                  trailer_id: trailer.id,
                  content,
                  created_at: new Date().toISOString(),
                  likes: 0,
                  commenterUsername: user.email || user.id,
                  _unsynced: true,
                  _error: null,
                };
                setComments((prev) => [optimistic, ...prev]);
                setNewComment("");
                try {
                  const saved = await addComment(user.id, videoId, content);
                  if (saved) {
                    setComments((prev) => [
                      saved,
                      ...prev.filter((c) => !c.id.startsWith("temp-")),
                    ]);
                  }
                } catch (err) {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === optimistic.id
                        ? { ...c, _unsynced: true, _error: err instanceof Error ? err.message : "Failed to save" }
                        : c
                    )
                  );
                }
              }}
            >
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-100"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg font-semibold text-white"
              >
                Post
              </button>
            </form>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">
                        {(c.commenterUsername ?? c.user_id).slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-purple-200">
                          {c.commenterUsername ?? c.user_id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-pink-400 font-semibold">❤ {c.likes ?? 0}</div>
                  </div>
                  <p className="text-gray-100">{c.content}</p>
                  <button
                    className="mt-2 text-xs bg-pink-700 hover:bg-pink-600 px-3 py-1 rounded font-semibold text-white"
                    onClick={async () => {
                      if (!user) return alert("Please sign in to like comments");
                      setComments((prev) =>
                        prev.map((x) => (x.id === c.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x))
                      );
                      try {
                        await toggleLikeComment(user!.id, c.id);
                      } catch {
                        setComments((prev) =>
                          prev.map((x) =>
                            x.id === c.id ? { ...x, likes: Math.max(0, (x.likes ?? 1) - 1) } : x
                          )
                        );
                      }
                    }}
                  >
                    Like
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
