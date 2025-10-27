import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Movie = Record<string, unknown>;

export function useMovie(movieId: number) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;

    (async () => {
      setLoading(true);
      try {
        // Prefer upcoming/new_releases when duplicates exist (fixes wrong movie on click)
        const [upcomingResult, newReleasesResult, moviesResult] = await Promise.all([
          supabase.from('upcoming_movies').select('*').eq('id', movieId).maybeSingle(),
          supabase.from('new_releases').select('*').eq('id', movieId).maybeSingle(),
          supabase.from('movies').select('*').eq('id', movieId).maybeSingle(),
        ]);

        const now = new Date();
        const isFuture = (row: any) => { try { return row?.release_date && new Date(row.release_date) > now; } catch { return false } };
        const within14 = (row: any) => { try { const d = new Date(row?.release_date); return isFinite(d as any) && ((now.getTime()-d.getTime())/(1000*60*60*24)) <= 14; } catch { return false } };

        let chosen: any = null;
        if (upcomingResult.data && isFuture(upcomingResult.data)) chosen = upcomingResult.data;
        else if (newReleasesResult.data && within14(newReleasesResult.data)) chosen = newReleasesResult.data;
        else chosen = upcomingResult.data || newReleasesResult.data || moviesResult.data || null;

        setMovie(chosen);
      } catch (error) {
        console.error("Error fetching movie:", error);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  return { movie, loading };
}
