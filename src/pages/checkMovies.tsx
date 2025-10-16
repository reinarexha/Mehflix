import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CheckMovies() {
  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase.from("movies").select("*");
      if (error) console.error("Error fetching movies:", error.message);
      else console.log("Movies:", data);
    };

    fetchMovies();
  }, []);

  return <p>Check console for movies...</p>;
}
