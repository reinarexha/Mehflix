// src/lib/trailers.ts
import { supabase } from "./supabaseClient";

export type Trailer = {
  id: string;
  title: string;
  youtube_id: string;
  category: string;
  poster_url: string;
};

export async function getMovieById(id: string): Promise<Trailer | null> {
  const { data, error } = await supabase
    .from("trailers")
    .select("id,title,youtube_id,category,poster_url")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Trailer | null) ?? null;
}
