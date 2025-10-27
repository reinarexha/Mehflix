import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Movie from "../components/Movie";

export default function MoviesFeed() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "123"; // your logged-in user ID

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("id", { ascending: true }) // optional

      if (error) console.error("Error fetching movies:", error.message);
      else setMovies(data || []);

      setLoading(false);
    };

    fetchMovies();
  }, []);

  if (loading) return <p>Loading movies...</p>;
  if (!movies.length) return <p>No movies found in Supabase.</p>;

  return (
    <div className="space-y-6">
      {movies.map((movie) => (
        <Movie key={movie.id} movie={movie} userId={userId} />
      ))}
    </div>
  );
}
