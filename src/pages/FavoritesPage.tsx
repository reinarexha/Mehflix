// src/pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
        <ul>
          {favorites.map((item) => (
            <li key={item.id}>Trailer ID: {item.trailer_id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
