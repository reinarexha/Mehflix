// src/pages/Watchlist.tsx
import { useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import MovieCard from '../components/MovieCard'; // the same card you use on Home
import { getMovieById } from '../lib/data'; // a function to get movie/trailer data by ID

const Watchlist: React.FC = () => {
  const { user } = useUser();
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (user as any).watchlist) {
      const fetchData = async () => {
        const ids: number[] = (user as any).watchlist; // your array of IDs
        const movies = await Promise.all(ids.map(id => getMovieById(id)));
        setWatchlistData(movies);
        setLoading(false);
      };
      fetchData();
    } else {
      setWatchlistData([]);
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="text-white text-center mt-20">Loading watchlist...</div>;

  if (!watchlistData.length)
    return <div className="text-white text-center mt-20">Your Watchlist is empty</div>;

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Your Watchlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {watchlistData.map(movie => (
          <MovieCard key={movie.id} movie={movie} userId={(user as any).id} />
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
