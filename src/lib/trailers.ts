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
    .select("id, name, youtube_url, youtube_key, type, language, site, source_table, source_row_id")
    .eq("id", numericId)
    .maybeSingle();

  console.log('📊 getMovieById result:', { data, error });

  if (error) throw error;
  // If there's no trailers row, try to find the movie in the movie tables directly
  if (!data) {
    try {
      const numericRowId = Number.isFinite(Number(id)) ? Number(id) : null;
      if (numericRowId) {
        const tables = ['movies', 'upcoming_movies', 'new_releases'];
        for (const t of tables) {
          try {
            const { data: row, error: rowErr } = await supabase.from(t).select('id, title, poster_url, genre').eq('id', numericRowId).maybeSingle();
            if (!rowErr && row) {
              return {
                id: String(row.id),
                title: (row as any).title || 'Unknown Movie',
                youtube_id: String(id),
                category: (row as any).genre || 'Unknown',
                poster_url: (row as any).poster_url || `data:image/svg+xml;base64,${btoa(`
                  <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#374151"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">No Poster</text>
                  </svg>
                `)}`,
              } as Trailer;
            }
          } catch (e) {
            // ignore and continue
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // no trailer row and no movie row found
    return null;
  }

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
    // Default to a compact data-URI poster; we'll try to replace this with a real poster below
    poster_url: `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#374151"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">No Poster</text>
      </svg>
    `)}`,
  };

  // If the trailers row doesn't include a usable poster, try to load it from the linked source table
  try {
    if ((!mapped.poster_url || mapped.poster_url.includes('No Poster')) && data.source_table && data.source_row_id) {
      const srcTable = String((data as any).source_table);
      const srcId = (data as any).source_row_id;
      console.log('🔎 Looking up poster in source table', srcTable, srcId);
      const { data: movieRow, error: movieErr } = await supabase
        .from(srcTable)
        .select('poster_url')
        .eq('id', srcId)
        .maybeSingle();

      if (!movieErr && movieRow && (movieRow as any).poster_url) {
        mapped.poster_url = (movieRow as any).poster_url;
        return mapped;
      }
    }

    // If we didn't find a poster above, try to query common movie tables by numeric id
    const numericRowId = Number.isFinite(Number(id)) ? Number(id) : null;
    if ((!mapped.poster_url || mapped.poster_url.includes('No Poster')) && numericRowId) {
      const tables = ['movies', 'upcoming_movies', 'new_releases'];
      for (const t of tables) {
        try {
          const { data: row, error: rowErr } = await supabase.from(t).select('poster_url').eq('id', numericRowId).maybeSingle();
          if (!rowErr && row && (row as any).poster_url) {
            mapped.poster_url = (row as any).poster_url;
            break;
          }
        } catch (e) {
          // ignore and continue
        }
      }
    }
  } catch (e) {
    console.warn('Failed to lookup poster from source table or movie tables', e);
  }

  // FINAL FALLBACK: Try to find a poster by matching the trailer name/title in movie tables
  try {
    const title = (data.name || '').trim();
    if ((!mapped.poster_url || mapped.poster_url.includes('No Poster')) && title) {
      const search = `%${title.replace(/%/g, '')}%`;
      const tables = ['movies', 'upcoming_movies', 'new_releases'];
      for (const t of tables) {
        try {
          const { data: rows, error: rowsErr } = await supabase
            .from(t)
            .select('poster_url, title')
            .ilike('title', search)
            .limit(1);
          if (!rowsErr && rows && rows.length > 0 && (rows[0] as any).poster_url) {
            mapped.poster_url = (rows[0] as any).poster_url;
            break;
          }
        } catch (e) {
          // ignore and continue
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return mapped;
}
