import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Movie = Record<string, unknown>;

export function useMovie(movieId: number) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;

    const fetchMovie = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();

      if (error) console.error("Error fetching movie:", error.message);
      else setMovie(data);

      setLoading(false);
    };

    fetchMovie();
  }, [movieId]);

  return { movie, loading };
}
