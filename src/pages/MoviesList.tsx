import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Movie = {
  id: number;
  title: string;
  description: string;
  category: string;
  poster_url: string;
};

export default function MoviesList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      const { data, error } = await supabase.from("movies").select("*");
      if (error) {
        alert(error.message);
      } else {
        setMovies(data);
      }
      setLoading(false);
    }
    fetchMovies();
  }, []);

  if (loading) return <div className="p-4">Loading movies...</div>;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Movies</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {movies.map((movie) => (
          <div key={movie.id} className="border rounded p-2">
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-48 object-cover rounded"
            />
            <h2 className="font-semibold mt-2">{movie.title}</h2>
            <p className="text-sm">{movie.description}</p>
            <p className="text-xs text-gray-500 mt-1">{movie.category}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
