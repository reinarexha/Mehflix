import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MovieCard from "./MovieCard";

type Props = { userId: string };

export default function Watchlist({ userId }: Props) {
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    async function loadWatchlist() {
      const { data, error } = await supabase
        .from("watchlist")
        .select("movies(*)")
        .eq("user_id", userId);

      if (error) {
        alert(error.message);
        return;
      }

      setMovies(data.map((item: any) => item.movies));
    }

    loadWatchlist();
  }, [userId]);

  async function handleRemoveWatchlist(movieId: number) {
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) {
      alert(error.message);
      return;
    }

    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  }

  if (!movies.length) return <p className="p-4">No movies in watchlist.</p>;

  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 p-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          userId={userId}
          onRemoveWatchlist={handleRemoveWatchlist}
        />
      ))}
    </div>
  );
}
