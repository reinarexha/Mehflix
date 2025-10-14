import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import MovieCard from "../components/MovieCard";
import { getMovieById, type Trailer } from "../lib/data";

type MinimalUser = { id: string; watchlist?: Array<string | number> };

const WatchlistPage: React.FC = () => {
  const { user } = useUser();
  const [watchlistData, setWatchlistData] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = (user ?? null) as MinimalUser | null;
    if (!u || !u.watchlist || u.watchlist.length === 0) {
      setWatchlistData([]);
      setLoading(false);
      return;
    }
    const ids = Array.from(new Set(u.watchlist.map((x) => String(x))));
    (async () => {
      try {
        const movies = await Promise.all(ids.map((id) => getMovieById(id)));
        setWatchlistData((movies.filter(Boolean) as Trailer[]));
      } catch (e) {
        console.error(e);
        setWatchlistData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="text-white text-center mt-20">Loading watchlist...</div>;
  if (!watchlistData.length) return <div className="text-white text-center mt-20">Your Watchlist is empty</div>;

  const userId = (user as MinimalUser)?.id ?? "";

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Your Watchlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {watchlistData.map((movie) => (
          <MovieCard key={movie.id} movie={movie} userId={userId} />
        ))}
      </div>
    </div>
  );
};

export default WatchlistPage;
