import { supabase } from "../lib/supabaseClient";
import { useState } from "react";

type Props = {
  movie: any;
  userId: string;
  onRemoveFavorite?: (movieId: number) => void;
  onRemoveWatchlist?: (movieId: number) => void;
};

export default function MovieCard({
  movie,
  userId,
  onRemoveFavorite,
  onRemoveWatchlist,
}: Props) {
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  async function addToWatchlist() {
    if (!userId) return alert("Login required");
    setLoadingWatchlist(true);

    const { error } = await supabase.from("watchlist").insert([
      { user_id: userId, movie_id: movie.id },
    ]);

    setLoadingWatchlist(false);
    if (error) alert(error.message);
    else alert("Added to Watchlist ✅");
  }

  async function addToFavorites() {
    if (!userId) return alert("Login required");
    setLoadingFavorite(true);

    const { error } = await supabase.from("favorites").insert([
      { user_id: userId, movie_id: movie.id },
    ]);

    setLoadingFavorite(false);
    if (error) alert(error.message);
    else alert("Added to Favorites ❤️");
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg bg-gray-900 text-white">
      <img
        src={movie.poster_url}
        alt={movie.title}
        className="h-64 w-full object-cover"
      />
      <div className="p-3">
        <h3 className="font-semibold text-lg">{movie.title}</h3>
        <p className="text-sm text-gray-300">{movie.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          Released {new Date(movie.release_date).toLocaleDateString()}
        </p>

        {/* Add buttons */}
        {!onRemoveFavorite && (
          <div className="flex gap-2 mt-3">
            <button
              className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700 transition"
              onClick={addToWatchlist}
              disabled={loadingWatchlist}
            >
              {loadingWatchlist ? "Adding..." : "+ Watchlist"}
            </button>
            <button
              className="px-3 py-1 bg-pink-600 rounded hover:bg-pink-700 transition"
              onClick={addToFavorites}
              disabled={loadingFavorite}
            >
              {loadingFavorite ? "Adding..." : "❤️ Favorite"}
            </button>
          </div>
        )}

        {onRemoveFavorite && (
          <button
            className="mt-2 text-red-500 hover:underline"
            onClick={() => onRemoveFavorite(movie.id)}
          >
            Remove from Favorites
          </button>
        )}

        {onRemoveWatchlist && (
          <button
            className="mt-2 text-yellow-500 hover:underline"
            onClick={() => onRemoveWatchlist(movie.id)}
          >
            Remove from Watchlist
          </button>
        )}
      </div>
    </div>
  );
}
