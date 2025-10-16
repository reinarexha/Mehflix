import { useEffect, useState } from "react";
import { fetchWatchlist, toggleWatchlist, removeWatchlistRow } from "../lib/data";
import type { Trailer } from "../lib/data";

export default function Watchlist({ userId }: { userId: string }) {
  const [watchlist, setWatchlist] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlist() {
      setLoading(true);
      const data = await fetchWatchlist(userId);
      setWatchlist(data);
      setLoading(false);
    }
    loadWatchlist();
  }, [userId]);

  const handleRemove = async (rowId: string) => {
    await removeWatchlistRow(rowId);
    setWatchlist((prev) => prev.filter((t) => t.id !== rowId));
  };

  const handleToggle = async (trailer: Trailer) => {
    await toggleWatchlist(userId, trailer);
    // Refresh watchlist
    const data = await fetchWatchlist(userId);
    setWatchlist(data);
  };

  if (loading) return <p>Loading watchlist...</p>;

  if (watchlist.length === 0) return <p>Your watchlist is empty.</p>;

  return (
    <div>
      {watchlist.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img src={t.poster_url} alt={t.title} width={100} height={150} />
          <div style={{ marginLeft: 10 }}>
            <h3>{t.title}</h3>
            <button onClick={() => handleToggle(t)}>Toggle Watchlist</button>
            <button onClick={() => handleRemove(t.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
