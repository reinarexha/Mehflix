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
      
      try {
        console.log(`🔍 Looking for movie ID: ${movieId}`);
        
        // Check all three movie tables: movies, upcoming_movies, new_releases
        const [moviesResult, upcomingResult, newReleasesResult] = await Promise.all([
          supabase.from('movies').select('*').eq('id', movieId).maybeSingle(),
          supabase.from('upcoming_movies').select('*').eq('id', movieId).maybeSingle(),
          supabase.from('new_releases').select('*').eq('id', movieId).maybeSingle()
        ]);

        // Check for errors
        if (moviesResult.error && moviesResult.error.code !== 'PGRST116') {
          console.error("Error fetching from movies table:", moviesResult.error.message);
        }
        if (upcomingResult.error && upcomingResult.error.code !== 'PGRST116') {
          console.error("Error fetching from upcoming_movies table:", upcomingResult.error.message);
        }
        if (newReleasesResult.error && newReleasesResult.error.code !== 'PGRST116') {
          console.error("Error fetching from new_releases table:", newReleasesResult.error.message);
        }

        // Use the first result we find
        const movieData = moviesResult.data || upcomingResult.data || newReleasesResult.data;
        
        if (movieData) {
          const tableName = moviesResult.data ? 'movies' : 
                           upcomingResult.data ? 'upcoming_movies' : 
                           'new_releases';
          console.log(`✅ Found movie in ${tableName} table:`, movieData);
          setMovie(movieData);
        } else {
          console.warn(`❌ Movie with ID ${movieId} not found in any table`);
          setMovie(null);
        }

      } catch (error) {
        console.error("Error fetching movie:", error);
        setMovie(null);
      }

      setLoading(false);
    };

    fetchMovie();
  }, [movieId]);

  return { movie, loading };
}
