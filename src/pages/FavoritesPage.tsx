// src/pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getTrailerById, type Trailer, toggleFavorite } from '../lib/data';
import MovieCard from '../components/MovieCard';
import { Link } from 'react-router-dom';

type FavoriteItem = {
  id: string;
  trailer_id: string;
  user_id: string;
  created_at: string;
};

type Props = {
  userId: string;
};

export default function FavoritesPage({ userId }: Props) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleRemove = async (favId: string, trailerId: string) => {
    if (!userId) return
    try {
      const trailer = getTrailerById(trailerId)
      if (trailer) {
        await toggleFavorite(userId, trailer)
      } else {
        const minimal: Trailer = {
          id: trailerId,
          title: 'Unavailable',
          youtube_id: trailerId,
          category: 'Unknown',
          poster_url: '/posters/placeholder.jpg',
        }
        await toggleFavorite(userId, minimal)
      }
      setFavorites(prev => prev.filter(f => f.id !== favId))
    } catch (e) {
      console.error('Failed to remove favorite', e)
    }
  }

  useEffect(() => {
    if (!userId) return;

    async function fetchFavorites() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFavorites(data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [userId]);

  if (!userId) return <p>Please log in to see your favorites.</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Your Favorites</h2>
      {favorites.length === 0 ? (
        <p>No favorite trailers yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map((item) => {
            const trailer: Trailer | undefined = getTrailerById(item.trailer_id)
            if (!trailer) {
              return (
                <div key={item.id} className="p-3 bg-surface border border-white/10 rounded flex flex-col items-center">
                  <div className="text-sm mb-2">Unavailable item</div>
                  <div className="text-xs mb-3 break-all">ID: {item.trailer_id}</div>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    onClick={() => handleRemove(item.id, item.trailer_id)}
                  >
                    Remove
                  </button>
                </div>
              )
            }
            return (
              <Link key={item.id} to={`/movie/${trailer.youtube_id}`} className="no-underline text-inherit">
                <MovieCard
                  trailer={trailer}
                  onRemoveFavorite={async () => {
                    try {
                      await toggleFavorite(userId, trailer)
                      // refresh list
                      setFavorites(prev => prev.filter(f => f.id !== item.id))
                    } catch (e) {
                      console.error('Failed to remove favorite', e)
                    }
                  }}
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
