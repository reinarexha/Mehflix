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
  console.log('🔍 getMovieById called with ID:', id);

  // Select based on actual DB schema and map to app shape
  const numericId = Number.isFinite(Number(id)) ? Number(id) : id;
  const { data, error } = await supabase
    .from("trailers")
    .select("id, name, youtube_url, youtube_key, type, language, site")
    .eq("id", numericId)
    .maybeSingle();

  console.log('📊 getMovieById result:', { data, error });

  if (error) throw error;
  if (!data) return null;

  // Prefer the youtube_key when present (this should be the 11-char id).
  // If only a youtube_url exists, extract the ID from the URL.
  const urlOrKey: string | null = data.youtube_key || data.youtube_url || null;
  let youtubeId = '';
  if (urlOrKey) {
    const raw = String(urlOrKey).trim();
    const idMatch = raw.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (idMatch && idMatch[1]) youtubeId = idMatch[1];
    else if (/^[A-Za-z0-9_-]{11}$/.test(raw)) youtubeId = raw;
    else youtubeId = raw; // fallback
  }

  const mapped: Trailer = {
    id: String(data.id),
    title: data.name || 'Unknown Movie',
    youtube_id: youtubeId,
    category: data.type || data.language || 'Unknown',
    // trailers table doesn't store poster URLs in this schema. Provide a sensible placeholder
    // so UI sections (like Profile) don't filter out favorites/watchlist items.
    poster_url: `https://via.placeholder.com/300x450/374151/FFFFFF?text=No+Poster`,
  };

  return mapped;
}
