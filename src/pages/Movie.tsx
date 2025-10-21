import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { supabase } from "../lib/supabaseClient";
import {
  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
  ensureTrailerExists,
  type CommentRow,
} from "../lib/data";
import { getMovieById, type Trailer } from "../lib/trailers";

// ---- Types ----
type RouteState = { title?: string; year?: string; poster?: string; rank?: number } | null;
type DisplayComment = CommentRow & { commenterUsername?: string | null; _unsynced?: boolean; _error?: string | null; };
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

  useEffect(() => {
    if (user) {
      console.log("Logged-in user ID:", user.id);
      console.log("Logged-in user email:", user.email);
    }
  }, [user]);

  const videoId = id || "";
  const location = useLocation();
  const routeState = (location.state as RouteState) ?? null;

  const [movieData, setMovieData] = useState<Trailer | null>(null);


  useEffect(() => {
    async function loadMovie() {
      if (videoId) {
        console.log('🎬 Movie page loadMovie called with videoId:', videoId);
        try {
          console.log('🔍 About to call getMovieById with:', videoId);
          const data = await getMovieById(videoId);
          console.log('📊 getMovieById returned:', data);
          
          if (data && data.youtube_id) {
            // We found valid trailer data with YouTube ID - use it!
            console.log('✅ Using trailer data with YouTube ID:', data.youtube_id);
            setMovieData(data);
            console.log('🎬 setMovieData called with trailer data:', data);
            return; // Exit early - don't run fallback code
          }
          
          console.log('⚠️ No trailer data found, falling back to movies table');
          setMovieData(data); // This will be null
          
          if (!data) {
            console.warn("Movie not found in trailers table for ID:", videoId);
            // For coming soon movies, we might not have trailer data yet
            // Let's check if this ID exists in other movie tables
            try {
              // Try to parse the videoId as a number for the movies table
              const numericId = parseInt(videoId);
              if (isNaN(numericId)) {
                console.warn("Invalid numeric ID for movies table:", videoId);
                return;
              }
              
              // Check multiple tables: movies, upcoming_movies, new_releases
              const [moviesResult, upcomingResult, newReleasesResult] = await Promise.all([
                supabase.from('movies').select('*').eq('id', numericId).maybeSingle(),
                supabase.from('upcoming_movies').select('*').eq('id', numericId).maybeSingle(),
                supabase.from('new_releases').select('*').eq('id', numericId).maybeSingle()
              ]);
              
              // Use the first result we find
              const movieRow = moviesResult.data || upcomingResult.data || newReleasesResult.data;
              
              if (movieRow) {
                console.log("Found movie data in database:", movieRow);
                const tableName = moviesResult.data ? 'movies' : upcomingResult.data ? 'upcoming_movies' : 'new_releases';
                console.log("Found in table:", tableName);
                
                // Create a temporary trailer object from movie data
                const tempTrailer = {
                  id: videoId,
                  title: movieRow.title || "Coming Soon Movie",
                  youtube_id: videoId, // Use the ID as youtube_id for now
                  category: movieRow.genre || "Coming Soon",
                  poster_url: movieRow.poster_url || "https://via.placeholder.com/360x540/374151/FFFFFF?text=Coming+Soon"
                };
                setMovieData(tempTrailer);
              } else {
                console.warn("Movie not found in any table for ID:", videoId);
              }
            } catch (movieError) {
              console.error("Failed to load from movies table:", movieError);
            }
          }
        } catch (error) {
          console.error("Failed to load movie:", error);
        }
      }
    }
    loadMovie();
  }, [videoId]);

  const trailer = useMemo(() => {
    console.log('🎬 Creating trailer object. movieData:', movieData);
    
    // Prioritize trailer data over movie data
    const result = {
      id: movieData?.id || videoId,
      title: routeState?.title || movieData?.title || "Coming Soon Movie",
      year: routeState?.year || "2025",
      ranking: routeState?.rank || Math.floor(Math.random() * 100),
      youtube_id: movieData?.youtube_id || videoId, // This should come from trailers table
      category: movieData?.category || "Coming Soon",
      poster_url: routeState?.poster || movieData?.poster_url || "https://via.placeholder.com/360x540/374151/FFFFFF?text=Coming+Soon",
      summary: "This movie is coming soon. Check back later for more details!",
    };
    
    console.log('🎬 Final trailer object:', result);
    console.log('🎬 YouTube URL will be:', `https://www.youtube.com/embed/${result.youtube_id}`);
    
    return result;
  }, [movieData, videoId, routeState]);

  // TEMPORARY: Force the correct YouTube ID for testing
  const finalYouTubeId = videoId === "1" ? "FK1aFyCbbBM" : trailer.youtube_id;
  const src = `https://www.youtube.com/embed/${finalYouTubeId}?autoplay=0&rel=0&modestbranding=1`;
  
  console.log('🎬 FINAL YouTube URL:', src);
  console.log('🎬 trailer.youtube_id:', trailer.youtube_id);
  console.log('🎬 finalYouTubeId (forced):', finalYouTubeId);

  const [isFav, setIsFav] = useState(false);
  const [inList, setInList] = useState(false);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [newComment, setNewComment] = useState("");


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

  // --- Fix fetchComments typing and useCallback ---

  const fetchComments = useCallback(async (): Promise<DisplayComment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, likes, commenter:profiles(username)")
      .eq("trailer_id", videoId)
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data ?? []).map((r: SupabaseComment) => {
      let commenterUsername: string | null = null;

      if (Array.isArray(r.commenter) && r.commenter.length > 0) {
        commenterUsername = r.commenter[0]?.username ?? null;
      } else if (isProfile(r.commenter)) {
        commenterUsername = (r.commenter as { username: string | null }).username ?? null;
      }

      return { ...r, commenterUsername, _unsynced: false, _error: null } as DisplayComment;
    });
  }, [videoId]);

  useEffect(() => {
    fetchComments().then(setComments);
  }, [videoId, fetchComments]);


  // Type guard for joined commenter shape
  const isProfile = (val: any): val is { username: string | null } => {
    return !!val && typeof val === "object" && !Array.isArray(val) && ("username" in val);
  };

  // Ensure a profile row exists for a user
  async function ensureProfile(userId: string) {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!data) {
      await supabase.from("profiles").insert({ id: userId, username: null });
    }
  }

  async function addComment(userId: string, trailerIdentifier: string, content: string) {
    try {
      await ensureProfile(userId);
      
      // Ensure the trailer exists in the trailers table before commenting
      const trailerData = {
        id: trailerIdentifier,
        title: trailer.title,
        youtube_id: trailer.youtube_id,
        category: trailer.category,
        poster_url: trailer.poster_url
      };
      
      console.log('🎬 Ensuring trailer exists for comments:', trailerData);
      
      try {
        const trailerEnsured = await ensureTrailerExists(trailerData);
        console.log('✅ Trailer ensured result:', trailerEnsured);
        
        if (!trailerEnsured) {
          throw new Error('Failed to create trailer record for comments');
        }
      } catch (trailerError) {
        console.error('❌ Error ensuring trailer exists:', trailerError);
        const errorMessage = trailerError instanceof Error ? trailerError.message : 'Unknown error';
        throw new Error('Failed to prepare trailer for comments: ' + errorMessage);
      }
      
      // Double-check that the trailer now exists
      const { data: existingTrailer, error: checkError } = await supabase
        .from('trailers')
        .select('id')
        .eq('id', trailerIdentifier)
        .maybeSingle();
        
      if (checkError) {
        console.error('❌ Error checking trailer existence:', checkError);
        throw new Error('Failed to verify trailer exists');
      }
      
      if (!existingTrailer) {
        console.error('❌ Trailer still does not exist after ensureTrailerExists');
        throw new Error('Trailer record was not created successfully');
      }
      
      console.log('✅ Trailer confirmed to exist, proceeding with comment insertion');
      
      const { data, error } = await supabase
        .from("comments")
        .insert([{ user_id: userId, trailer_id: trailerIdentifier, content }])
        .select("id, user_id, trailer_id, content, created_at, likes, commenter:profiles(username)");
      if (error) throw error;
      const r = (data?.[0] ?? {}) as SupabaseComment;

      let commenterUsername: string | null = null;
      if (Array.isArray(r.commenter) && r.commenter.length > 0) commenterUsername = r.commenter[0]?.username ?? null;
      else if (isProfile(r.commenter)) commenterUsername = r.commenter.username ?? null;

      return { ...r, commenterUsername, _unsynced: false, _error: null } as DisplayComment;
    } catch (e) {
      console.error("Failed to add comment", e);
      throw e;
    }
  }


  async function toggleLikeComment(commentId: string) {
    const { data: existing } = await supabase.from("comments").select("likes").eq("id", commentId).maybeSingle();
    const current = (existing?.likes ?? 0) as number;
    await supabase.from("comments").update({ likes: current + 1 }).eq("id", commentId);
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


  // ---- JSX ----
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#151336" }}>
      <div className="max-w-[1200px] mx-auto p-6 flex gap-8">
        {/* Left column */}
        <div className="w-[360px] flex-shrink-0">
          <img src={trailer.poster_url} alt={trailer.title} className="rounded-lg shadow-2xl w-full h-[540px] object-cover" />
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
              {isFav ? "Favorited ❤️" : "Add to Favorites"}
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
              {inList ? "In Watchlist 🎬" : "Add to Watchlist"}
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

        {/* Right column */}
        <div className="flex-1">
          <header className="mb-4"><h1 className="text-4xl font-extrabold">{trailer.title}</h1></header>
          <div className="rounded-lg overflow-hidden shadow-2xl bg-black h-[400px] mb-4">
            <iframe src={src} title={`${trailer.title} trailer`} allowFullScreen className="w-full h-full" />
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
                className="flex-1 px-4 py-2 rounded-lg text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg font-semibold text-white"
              >
                Post
              </button>
            </form>

            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">{(c.commenterUsername ?? c.user_id).slice(0,1).toUpperCase()}</div>
                      <div>
                        <div className="font-semibold text-purple-200">{c.commenterUsername ?? c.user_id}</div>
                        <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-sm text-pink-400 font-semibold">❤️ {c.likes ?? 0}</div>
                  </div>
                  <p className="text-gray-100">{c.content}</p>
                  <button
                    className="mt-2 text-xs bg-pink-700 hover:bg-pink-600 px-3 py-1 rounded font-semibold text-white"
                    onClick={() => toggleLikeComment(c.id)}
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
