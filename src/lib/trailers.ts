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
  const { data, error } = await supabase
    .from("trailers")
    .select("id, name, youtube_url, youtube_key, type, language, site")
    .eq("id", id)
    .maybeSingle();

  console.log('📊 getMovieById result:', { data, error });

  if (error) throw error;
  if (!data) return null;

  // Prefer full URL if present; otherwise build from key when site is YouTube
  const urlOrKey: string | null = data.youtube_url || data.youtube_key || null;
  let youtubeIdOrUrl = '';
  if (urlOrKey) {
    const raw = String(urlOrKey).trim();
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      youtubeIdOrUrl = raw;
    } else {
      // Build a standard watch URL from key only when site is YouTube; otherwise keep the key
      youtubeIdOrUrl = (data.site && String(data.site).toLowerCase() === 'youtube')
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(raw)}`
        : raw;
    }
  }

  const mapped: Trailer = {
    id: String(data.id),
    title: data.name || 'Unknown Movie',
    youtube_id: youtubeIdOrUrl,
    category: data.type || data.language || 'Unknown',
    poster_url: '', // none in this table; UI will fallback
  };

  return mapped;
}
