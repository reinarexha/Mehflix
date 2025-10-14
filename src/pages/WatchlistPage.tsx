// src/pages/WatchlistPage.tsx
import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import MovieCard from "../components/MovieCard";
import { getMovieById } from "../lib/data";

type MinimalUser = {
  id: string;
  watchlist?: Array<string | number>;
};

const WatchlistPage: React.FC = () => {
  const { user } = useUser();
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = user as MinimalUser | null;

    if (!u || !u.watchlist || u.watchlist.length === 0) {
      setWatchlistData([]);
      setLoading(false);
      return;
    }

    const ids = Array.from(new Set(u.watchlist.map((id) => String(id))));

    const fetchMovies = async () => {
      try {
        const movies = await Promise.all(
          ids.map(async (id) => {
            try {
              return await getMovieById(id);
            } catch (err) {
              console.error("Error fetching movie", id, err);
              return null;
            }
          })
        );
        setWatchlistData(movies.filter(Boolean));
      } catch (err) {
        console.error("Failed to load watchlist", err);
        setWatchlistData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [user]);

  if (loading)
    return (
      <div className="text-white text-center mt-20">
        Loading your watchlist...
      </div>
    );

  if (!watchlistData.length)
    return (
      <div className="text-white text-center mt-20">
        Your Watchlist is empty.
      </div>
    );

  const userId = (user as MinimalUser)?.id ?? "";

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        Your Watchlist
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {watchlistData.map((movie) => (
          <MovieCard key={movie.id} movie={movie} userId={userId} />
        ))}
      </div>
    </div>
  );
};

export default WatchlistPage;
