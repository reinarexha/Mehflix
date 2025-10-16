import { useEffect, useState } from "react";
import { getMovieById, toggleFavorite, fetchFavorites } from "../lib/data";
import type { Trailer } from "../lib/data";

export default function FavoritesPage({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      const data = await fetchFavorites(userId);
      setFavorites(data);
      setLoading(false);
    }
    loadFavorites();
  }, [userId]);

  const handleToggleFavorite = async (trailer: Trailer) => {
    await toggleFavorite(userId, trailer);
    const data = await fetchFavorites(userId);
    setFavorites(data);
  };

  if (loading) return <p>Loading favorites...</p>;

  if (favorites.length === 0) return <p>You have no favorite trailers.</p>;

  return (
    <div>
      {favorites.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img src={t.poster_url} alt={t.title} width={100} height={150} />
          <div style={{ marginLeft: 10 }}>
            <h3>{t.title}</h3>
            <button onClick={() => handleToggleFavorite(t)}>Toggle Favorite</button>
          </div>
        </div>
      ))}
    </div>
  );
}
