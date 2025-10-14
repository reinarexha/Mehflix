import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import {
  getTrailerById,
  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
  type CommentRow,
} from "../lib/data";

// --- Types ---
interface DisplayComment extends CommentRow {
  commenterUsername?: string | null;
  _unsynced?: boolean;
  _error?: string;
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const videoId = id || "";
  const { user } = useUser();

  const trailer = useMemo(
    () =>
      getTrailerById(videoId) ?? {
        id: videoId,
        title: "Unknown Movie",
        youtube_id: videoId,
        category: "Unknown",
        poster_url: "",
      },
    [videoId]
  );

  const src = `https://www.youtube.com/embed/${trailer.youtube_id}?autoplay=0&rel=0&modestbranding=1`;

  const [isFav, setIsFav] = useState(false);
  const [inList, setInList] = useState(false);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [newComment, setNewComment] = useState("");

  // ---------- FETCH COMMENTS ----------
  useEffect(() => {
    const run = async () => {
      if (!videoId) return;
      try {
        const rows = await fetchComments(videoId);
        setComments(rows);
      } catch (e) {
        console.warn("Failed to load comments", e);
      }
    };
    run();
  }, [videoId]);

  // ---------- FAVORITE + WATCHLIST STATUS ----------
  useEffect(() => {
    async function loadStatus() {
      if (!user || !videoId) return;
      try {
        const favs = await fetchFavorites(user.id);
        const wls = await fetchWatchlist(user.id);
        setIsFav(favs.some((t) => t.youtube_id === trailer.youtube_id));
        setInList(wls.some((t) => t.youtube_id === trailer.youtube_id));
      } catch (e) {
        console.error("Failed to load favorite/watchlist status", e);
      }
    }
    loadStatus();
  }, [user, videoId, trailer.youtube_id]);

  // ---------- COMMENT HELPERS ----------
  async function fetchComments(trailerIdentifier: string): Promise<DisplayComment[]> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, user_id, trailer_id, movie_id, content, created_at, likes, commenter:profiles(username)"
        )
        .or(`trailer_id.eq.${trailerIdentifier},movie_id.eq.${trailerIdentifier}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fix fetchComments mapping
      return (data ?? []).map((r) => {
        let commenterUsername: string | null = null;
        if (Array.isArray(r.commenter) && r.commenter.length > 0 && typeof r.commenter[0] === 'object') {
          commenterUsername = (r.commenter[0] as { username: string | null }).username ?? null;
        } else if (r.commenter && typeof r.commenter === 'object' && !Array.isArray(r.commenter)) {
          commenterUsername = (r.commenter as { username: string | null }).username ?? null;
        }
        return { ...r, commenterUsername };
      }) as DisplayComment[];
    } catch (e) {
      console.warn("Failed to fetch comments", e);
      return [];
    }
  }

  async function addComment(userId: string, trailerIdentifier: string, content: string) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([{ user_id: userId, trailer_id: trailerIdentifier, content }])
        .select("id, user_id, trailer_id, content, created_at, likes, commenter:profiles(username)");

      if (error) throw error;

      const r = data?.[0];
      const commenterUsername = Array.isArray(r.commenter)
        ? r.commenter[0]?.username ?? null
        : (r.commenter && typeof r.commenter === 'object' && !Array.isArray(r.commenter))
          ? (r.commenter as { username: string | null }).username ?? null
          : null;
      return { ...r, commenterUsername };
    } catch (e) {
      console.error("Failed to add comment", e);
      throw e;
    }
  }

  async function toggleLikeComment(commentId: string) {
    const { data: existing, error: e } = await supabase
      .from("comments")
      .select("likes")
      .eq("id", commentId)
      .maybeSingle();
    if (e) throw e;
    const current = (existing?.likes ?? 0) as number;
    const { error } = await supabase
      .from("comments")
      .update({ likes: current + 1 })
      .eq("id", commentId);
    if (error) throw error;
  }

  // ---------- JSX ----------
  return (
    <div className="movie-detail-page p-6 text-white bg-gray-900 min-h-screen">
      {/* --- HEADER --- */}
      <header className="movie-header mb-4 text-center">
        <h1 className="movie-title text-4xl font-bold mb-2">{trailer.title}</h1>
        <div className="movie-meta text-gray-400 space-x-3">
          <span>{trailer.category}</span>
          <span>• Trailer ID: {trailer.youtube_id}</span>
        </div>
      </header>

      {/* --- MEDIA SECTION --- */}
      <section className="media-section flex flex-col lg:flex-row gap-6 mb-6">
        <img
          className="poster-lg rounded shadow-lg w-full lg:w-1/3 object-cover"
          src={trailer.poster_url || "https://via.placeholder.com/300x450"}
          alt={trailer.title}
        />
        <div className="flex-1">
          <div className="trailer-wrapper mb-4 aspect-video">
            <iframe
              src={src}
              title={`${trailer.title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>

          <p className="summary text-gray-300">
            Enjoy the trailer and join the discussion below!
          </p>
        </div>
      </section>

      {/* --- ACTIONS ROW --- */}
      <section className="actions-row flex flex-wrap gap-3 justify-center mb-8">
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
          className={`px-4 py-2 rounded bg-purple-600 font-semibold ${
            isFav ? "opacity-100" : "opacity-70 hover:opacity-100"
          }`}
        >
          {isFav ? "Favorited ❤️" : "Favorite"}
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
          className={`px-4 py-2 rounded bg-indigo-600 font-semibold ${
            inList ? "opacity-100" : "opacity-70 hover:opacity-100"
          }`}
        >
          {inList ? "In Watchlist 🎬" : "Add to Watchlist"}
        </button>
      </section>

      {/* --- COMMENTS --- */}
      <section className="comments-section max-w-3xl mx-auto mb-10">
        <h3 className="text-2xl font-bold mb-4 text-center">Comments</h3>

        {/* --- Improved comment input --- */}
        <form
          className="flex gap-2 mb-4 items-center bg-gray-800 p-3 rounded-lg shadow"
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
              _error: undefined,
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
            className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg font-semibold text-white shadow transition-colors"
          >
            Post
          </button>
        </form>

        {/* --- Improved Comments UI --- */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">
                    {c.commenterUsername ? c.commenterUsername[0]?.toUpperCase() : c.user_id[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-purple-200">
                      {c.commenterUsername ?? c.user_id}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-pink-400 font-semibold flex items-center gap-1">
                  <span>❤️</span> <span>{c.likes ?? 0}</span>
                </div>
              </div>
              <p className="text-gray-200 mb-2 whitespace-pre-line">{c.content}</p>
              {c._unsynced && (
                <div className="mt-2 text-sm text-yellow-300 flex justify-between items-center">
                  <span>Not saved: {c._error}</span>
                  <button
                    className="underline text-yellow-400 hover:text-yellow-200"
                    onClick={() => addComment(user!.id, videoId, c.content)}
                  >
                    Retry
                  </button>
                </div>
              )}
              <button
                className="mt-2 text-xs bg-pink-700 hover:bg-pink-600 px-3 py-1 rounded font-semibold text-white transition-colors"
                onClick={async () => {
                  if (!user) return alert("Please sign in to like comments");
                  setComments((prev) =>
                    prev.map((x) =>
                      x.id === c.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x
                    )
                  );
                  try {
                    await toggleLikeComment(c.id);
                  } catch {
                    setComments((prev) =>
                      prev.map((x) =>
                        x.id === c.id
                          ? { ...x, likes: Math.max(0, (x.likes ?? 1) - 1) }
                          : x
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
  );
}
