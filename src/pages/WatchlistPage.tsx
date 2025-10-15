import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import MovieCard from "../components/MovieCard";
import { getMovieById, type Trailer } from "../lib/data";
import { supabase } from "../lib/supabaseClient";

const WatchlistPage: React.FC = () => {
  const { user } = useUser();
  const [watchlistData, setWatchlistData] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setWatchlistData([]);
        setLoading(false);
        return;
      }

      try {
        // ✅ Fetch all watchlist rows for this user
        const { data: watchlistRows, error } = await supabase
          .from("watchlist")
          .select("trailer_id")
          .eq("user_id", user.id);

        if (error) throw error;
        if (!watchlistRows || watchlistRows.length === 0) {
          setWatchlistData([]);
          return;
        }

        // ✅ Get all trailers by ID
        const trailerIds = watchlistRows.map((row) => String(row.trailer_id));
        const movies = await Promise.all(trailerIds.map((id) => getMovieById(id)));
        const validMovies = movies.filter((m): m is Trailer => !!m && !!m.id && !!m.title);
        setWatchlistData(validMovies);

      } catch (err) {
        console.error("Error fetching watchlist:", err);
        setWatchlistData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  if (loading)
    return (
      <div className="text-white text-center mt-20">
        Loading watchlist...
      </div>
    );

  if (!watchlistData.length)
    return (
      <div className="text-white text-center mt-20">
        Your Watchlist is empty
      </div>
    );

  const userId = user?.id ?? "";

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
