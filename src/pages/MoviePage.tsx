import { useEffect, useMemo, useState } from "react";
import Movie from "../components/Movie";
import { useMovie } from "../hooks/useMovie";
import { useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import {
  getTrailerById,
  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
  type Trailer,
} from "../lib/data";

export default function MoviePage() {
  const { id } = useParams();
  const movieId = Number(id);
  const { user } = useUser();
  const userId = user?.id ?? "";

  const { movie, loading } = useMovie(movieId);

  // Derive display fields and trailer from movie/local data
  const trailer: Trailer | null = useMemo(() => {
    if (!movie) return null;
    const baseId = String(movie.id ?? id ?? "");
    const local = getTrailerById(baseId);
    const youtube_id = local?.youtube_id || baseId;
    const category: string = (movie.genre || movie.category || local?.category || "Unknown").toString();
    return {
      id: baseId,
      title: movie.title || local?.title || "Untitled Movie",
      youtube_id,
      category,
      poster_url: movie.poster_url || local?.poster_url || "",
    };
  }, [movie, id]);

  // Favorite / Watchlist state
  const [isFav, setIsFav] = useState(false);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!user || !trailer?.id) return;
      try {
        const [favs, wls] = await Promise.all([
          fetchFavorites(user.id),
          fetchWatchlist(user.id),
        ]);
        if (!mounted) return;
        setIsFav(favs.some((t) => t.id === trailer.id));
        setInList(wls.some((t) => t.id === trailer.id));
      } catch {
        // ignore
      }
    }
    init();
    return () => { mounted = false };
  }, [user, trailer?.id]);

  if (!id || Number.isNaN(movieId)) return <p>Invalid movie id.</p>;
  if (loading) return <p>Loading movie from database...</p>;
  if (!movie || !trailer) return <p>Movie not found!</p>;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "";
  const rank = Math.max(1, (movie.popularity ? Math.round(100 - Math.min(99, movie.popularity % 100)) : 5));
  const youtubeSrc = `https://www.youtube.com/embed/${trailer.youtube_id}?autoplay=0&rel=0&modestbranding=1`;

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: "#1B1942" }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title and meta */}
        <h1 className="text-4xl font-bold mb-2">{trailer.title}</h1>
        <div className="text-white/70 mb-6 space-x-3">
          {year && <span>{year}</span>}
          {trailer.category && <span>{trailer.category}</span>}
          <span>Rank #{rank}</span>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Poster */}
          <div className="col-span-12 md:col-span-4">
            {trailer.poster_url ? (
              <img
                src={trailer.poster_url}
                alt={trailer.title}
                className="rounded-lg w-full object-cover shadow-xl"
                style={{ maxHeight: 540 }}
              />
            ) : (
              <div className="bg-white/10 rounded-lg h-[540px]" />
            )}
          </div>

          {/* Video + Overview */}
          <div className="col-span-12 md:col-span-8">
            <div className="w-full aspect-video bg-black/40 rounded-lg overflow-hidden shadow-lg">
              <iframe
                className="w-full h-full"
                src={youtubeSrc}
                title={trailer.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Overview */}
            <div className="mt-4 bg-[#2A2660] text-white/90 rounded-lg px-4 py-3">
              <p>{movie.overview || movie.description || "A retired operative returns for one last mission."}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg">Rate</button>
          <button className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg">Comment</button>
          <button
            className={`font-medium px-4 py-2 rounded-lg ${
              isFav ? 'bg-purple-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            onClick={async () => {
              if (!user) return alert("Please sign in to favorite");
              setIsFav((v) => !v);
              try { await toggleFavorite(user.id, trailer); } catch { setIsFav((v) => !v); }
            }}
          >
            {isFav ? "Favorited" : "Add to favorites"}
          </button>
          <button
            className={`font-medium px-4 py-2 rounded-lg ${
              inList ? 'bg-indigo-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            onClick={async () => {
              if (!user) return alert("Please sign in to add to watch list");
              setInList((v) => !v);
              try { await toggleWatchlist(user.id, trailer); } catch { setInList((v) => !v); }
            }}
          >
            {inList ? "In watchlist" : "Add to watch list"}
          </button>
        </div>

        {/* Keep existing comments UI */}
        <div className="mt-8">
          <Movie movie={movie} userId={userId} />
        </div>
      </div>
    </main>
  );
}
