import { useEffect, useState, useMemo } from "react";
import Movie from "../components/Movie";
import { useMovie } from "../hooks/useMovie";
import { useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import {


  toggleFavorite,
  toggleWatchlist,
  fetchFavorites,
  fetchWatchlist,
} from "../lib/data";
import type { Trailer } from "../lib/trailers";

// Extract a YouTube video id from a raw id or any YouTube URL
function extractYoutubeId(value: unknown): string | null {
  if (!value) return null;
  const input = String(value).trim();
  // If it looks like a plain id (11 chars typical), just return it
  if (/^[A-Za-z0-9_-]{6,}$/.test(input) && !input.includes("http")) {
    return input;
  }
  try {
    const url = new URL(input);
    // youtu.be/<id>
    if (url.hostname.endsWith("youtu.be")) {
      const id = url.pathname.replace(/^\//, "");
      return id || null;
    }
    // youtube.com/watch?v=<id>
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // youtube.com/embed/<id> or other path forms
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    // not a URL, ignore
  }
  return null;
}

export default function MoviePage() {
  const { id } = useParams();
  const movieId = Number(id);
  const { user } = useUser();

  const { movie, loading } = useMovie(movieId);

  // Derive display fields and trailer from movie/local data
  const trailer: Trailer | null = useMemo(() => {
    if (!movie) return null;
    const baseId = String((movie as any).id ?? id ?? "");
    const rawTrailer = (movie as any).trailer_id ?? (movie as any).youtube_id ?? baseId;
    const parsedId = extractYoutubeId(rawTrailer) || String(rawTrailer || baseId);
    const youtube_id = parsedId;
    const category: string = String((movie as any).genre ?? (movie as any).category ?? "Unknown");
    return {
      id: baseId,
      title: (movie as any).title ?? "Untitled Movie",
      youtube_id,
      category,
      poster_url: (movie as any).poster_url ?? "",
    };
  }, [movie, id]);


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

  const rd = (movie as any)?.release_date; const year = (typeof rd === "string" || typeof rd === "number") ? (new Date(rd).getFullYear() || "") : "";
  const popRaw = (movie as any)?.popularity; const pop = typeof popRaw === "number" ? popRaw : Number(popRaw ?? 5); const rank = Math.max(1, Math.round(100 - Math.min(99, (isFinite(pop) ? (pop % 100) : 5))));
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

            <div className="mt-4 bg-[#2A2660] text-white/90 rounded-lg px-4 py-3">
              <p>{(movie as any).overview || (movie as any).description || "A retired operative returns for one last mission."}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg">Rate</button>
          <button className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg">Comment</button>
          <button
            className={`font-medium px-4 py-2 rounded-lg ${isFav ? 'bg-purple-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
            onClick={async () => {
              if (!user) return alert("Please sign in to favorite");
              setIsFav((v) => !v);
              try { await toggleFavorite(user.id, trailer); } catch { setIsFav((v) => !v); }
            }}
          >
            {isFav ? "Favorited" : "Add to favorites"}
          </button>
          <button
            className={`font-medium px-4 py-2 rounded-lg ${inList ? 'bg-indigo-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
            onClick={async () => {
              if (!user) return alert("Please sign in to add to watch list");
              setInList((v) => !v);
              try { await toggleWatchlist(user.id, trailer); } catch { setInList((v) => !v); }
            }}
          >
            {inList ? "In watchlist" : "Add to watch list"}
          </button>
        </div>

        <div className="mt-8">
          <Movie movie={movie} userId={user?.id ?? ""} />
        </div>
      </div>
    </main>
  );
}