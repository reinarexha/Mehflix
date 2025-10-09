import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MovieCard from "./MovieCard";

type Props = { userId: string };

export default function FavoritesList({ userId }: Props) {
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    async function loadFavorites() {
      const { data, error } = await supabase
        .from("favorites")
        .select("movies(*)")
        .eq("user_id", userId);

      if (error) {
        alert(error.message);
        return;
      }

      setMovies(data.map((item: any) => item.movies));
    }

    loadFavorites();
  }, [userId]);

  async function handleRemoveFavorite(movieId: number) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) {
      alert(error.message);
      return;
    }

    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  }

  if (!movies.length) return <p className="p-4">No favorites yet.</p>;

  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 p-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          userId={userId}
          onRemoveFavorite={handleRemoveFavorite}
        />
      ))}
    </div>
  );
}
