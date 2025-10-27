import { supabase } from "./supabaseClient";
import type { Trailer } from "./trailers";
import { getMovieById } from "./trailers";

export type CommentRow = {
  id: string;
  user_id: string;
  trailer_id: string;
  content: string;
  created_at: string;
  likes?: number;
};

/* ========= Ensure trailer exists (DB) ========= */
export async function ensureTrailerExists(trailer: Trailer): Promise<boolean> {
  if (!trailer?.id) return false;
  
  try {
    // Validate and clean trailer data
    const validatedTrailer = {
      id: trailer.id,
      title: trailer.title && !trailer.title.includes('Unknown') 
        ? trailer.title 
        : 'Unknown Movie',
      // Keep the raw youtube value (could be full url or key)
      youtube_raw: trailer.youtube_id || trailer.id,
      category: trailer.category || 'Unknown',
      // Poster URL is not a column in the current trailers table; keep for UI only
      poster_url: isValidPosterUrl(trailer.poster_url) ? trailer.poster_url : getDefaultPosterUrl()
    };

    // First check if trailer already exists
    // Use numeric id when possible (trailers.id is bigint in the DB)
    const numericId = Number.isFinite(Number(validatedTrailer.id)) ? Number(validatedTrailer.id) : validatedTrailer.id;
    const { data: existingTrailer } = await supabase
      .from('trailers')
      .select('id, name, youtube_url, youtube_key, type, source_table')
      .eq('id', numericId)
      .maybeSingle();

    // If trailer exists, update it with validated data
    if (existingTrailer) {
      // Update using the existing table columns (name, youtube_key or youtube_url, type)
  const updatePayload: any = { name: validatedTrailer.title, type: validatedTrailer.category };
      // Determine whether we have an 11-char youtube key or a URL
      const raw = String(validatedTrailer.youtube_raw || '').trim();
      if (/^[A-Za-z0-9_-]{11}$/.test(raw)) {
        updatePayload.youtube_key = raw;
      } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
        updatePayload.youtube_url = raw;
      } else if (raw) {
        // fallback to youtube_key
        updatePayload.youtube_key = raw;
      }

      // Ensure source_table/source_row_id are present to satisfy NOT NULL constraints
  if (!(existingTrailer as any).source_table) updatePayload.source_table = 'movies';
  if (!(existingTrailer as any).source_row_id) updatePayload.source_row_id = Number.isFinite(Number(validatedTrailer.id)) ? Number(validatedTrailer.id) : null;

      const { error } = await supabase
        .from('trailers')
        .update(updatePayload)
        .eq('id', numericId);
      
      if (error) {
        console.error('❌ Error updating trailer (supabase):', error);
        return false;
      }
      // console.log('✅ Updated trailer:', validatedTrailer.id, validatedTrailer.title);
      return true;
    }

    // If trailer doesn't exist, create it
    // console.log('🚀 Creating new trailer:', validatedTrailer);
    // Build insert payload using existing DB column names
  const insertPayload: any = { id: numericId, name: validatedTrailer.title, type: validatedTrailer.category };
    const rawInsert = String(validatedTrailer.youtube_raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(rawInsert)) {
      insertPayload.youtube_key = rawInsert;
    } else if (rawInsert.startsWith('http://') || rawInsert.startsWith('https://')) {
      insertPayload.youtube_url = rawInsert;
    } else if (rawInsert) {
      insertPayload.youtube_key = rawInsert;
    }

    // Set required source_table/source_row_id to link this trailer back to the movies table.
    // The `source_table` column is NOT NULL in your DB schema, so provide a sensible default.
    insertPayload.source_table = 'movies';
    insertPayload.source_row_id = Number.isFinite(Number(validatedTrailer.id)) ? Number(validatedTrailer.id) : null;

    const { error } = await supabase
      .from('trailers')
      .insert([insertPayload]);

    if (error) {
      console.error('❌ Error inserting trailer (supabase):', { error, payload: insertPayload });
      return false;
    }
    
    // console.log('✅ Created new trailer:', validatedTrailer.id, validatedTrailer.title);
    return true;
  } catch (error) {
    // console.error('❌ Exception in ensureTrailerExists:', error);
    return false;
  }
}

/* ========= Helper functions for poster URLs ========= */
function isValidPosterUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes('placeholder.com')) return false; // Placeholder is invalid
  if (url.includes('Unknown')) return false;
  return true;
}

function getDefaultPosterUrl(): string {
  // Use a simple colored placeholder instead of external URL
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="16" fill="white">
        No Poster
      </text>
    </svg>
  `)}`;
}

/* ========= Watchlist ========= */
export async function toggleWatchlist(userId: string, trailer: Trailer): Promise<{ inWatchlist: boolean }> {
  if (!userId || !trailer?.id) {
    throw new Error('Invalid user ID or trailer');
  }

  try {
    // console.log('🎬 Toggle watchlist for:', trailer.title, 'ID:', trailer.id);

    // Check if already in watchlist
    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", userId)
      .eq("trailer_id", trailer.id)
      .maybeSingle();
      
    if (error) throw error;

    // If exists, remove it
    if (data) {
      const { error: delErr } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", data.id);
        
      if (delErr) throw delErr;
      // console.log('❌ Removed from watchlist:', trailer.title);
      return { inWatchlist: false };
    }

    // If doesn't exist, add it - but first ensure trailer exists with valid data
    // console.log('👨‍💼 Ensuring trailer exists before adding to watchlist...');
    const ensured = await ensureTrailerExists(trailer);
    if (!ensured) {
      throw new Error('Failed to ensure trailer exists in database');
    }

    const { error: insErr } = await supabase
      .from("watchlist")
      .insert({ 
        user_id: userId, 
        trailer_id: trailer.id 
      });

    if (insErr) {
      // console.error('❌ Error adding to watchlist:', insErr);
      throw insErr;
    }

    // console.log('✅ Added to watchlist:', trailer.title);
    return { inWatchlist: true };
  } catch (error) {
    // console.error('❌ Error in toggleWatchlist:', error);
    throw error;
  }
}

/* ========= Favorites ========= */
export async function toggleFavorite(userId: string, trailer: Trailer): Promise<{ favorited: boolean }> {
  if (!userId || !trailer?.id) {
    throw new Error('Invalid user ID or trailer');
  }

  try {
    // console.log('⭐ Toggle favorite for:', trailer.title, 'ID:', trailer.id);

    // Check if already in favorites
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("trailer_id", trailer.id)
      .maybeSingle();
      
    if (error) throw error;

    // If exists, remove it
    if (data) {
      const { error: delErr } = await supabase
        .from("favorites")
        .delete()
        .eq("id", data.id);
        
      if (delErr) throw delErr;
      // console.log('❌ Removed from favorites:', trailer.title);
      return { favorited: false };
    }

    // If doesn't exist, add it - but first ensure trailer exists with valid data
    // console.log('👨‍💼 Ensuring trailer exists before adding to favorites...');
    const ensured = await ensureTrailerExists(trailer);
    if (!ensured) {
      throw new Error('Failed to ensure trailer exists in database');
    }

    const { error: insErr } = await supabase
      .from("favorites")
      .insert({ 
        user_id: userId, 
        trailer_id: trailer.id 
      });

    if (insErr) {
      // console.error('❌ Error adding to favorites:', insErr);
      throw insErr;
    }

    // console.log('✅ Added to favorites:', trailer.title);
    return { favorited: true };
  } catch (error) {
    // console.error('❌ Error in toggleFavorite:', error);
    throw error;
  }
}

/* ========= Fetch Favorites ========= */
export async function fetchFavorites(userId: string): Promise<Trailer[]> {
  if (!userId) {
    // console.log('❌ No user ID provided to fetchFavorites');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("trailer_id")
      .eq("user_id", userId);
    
    if (error) {
      // console.error('❌ Error fetching favorites:', error);
      return [];
    }

    type ListRow = { trailer_id: string };
    const ids = (data || []).map((r: ListRow) => String(r.trailer_id));
    
    if (ids.length === 0) {
      // console.log('ℹ️ No favorites found for user:', userId);
      return [];
    }

    // console.log('📥 Fetching favorite trailers for IDs:', ids);

    // Fetch trailer details for each favorite
    const trailers = await Promise.all(
      ids.map(async (id) => {
        try {
          const trailer = await getMovieById(id);
          if (!trailer) {
            // If trailer lookup fails, return a fallback object so the UI can still show the item
            // (some favorite rows may reference external youtube IDs or legacy ids not present in trailers table)
            // Provide a poster via getDefaultPosterUrl so Profile's filters will accept it.
            return {
              id: String(id),
              title: `Unknown Title`,
              youtube_id: String(id),
              category: 'Unknown',
              poster_url: getDefaultPosterUrl()
            } as Trailer;
          }

          // If the poster is a placeholder data URI, try to resolve a real poster from movie tables
          if (!trailer.poster_url || trailer.poster_url.startsWith('data:')) {
            try {
              const resolved = await resolvePosterForTrailer(trailer);
              trailer.poster_url = resolved || trailer.poster_url;
            } catch (e) {
              // ignore and keep existing
            }
          }

          // Ensure poster URL is valid
          if (!isValidPosterUrl(trailer.poster_url)) {
            trailer.poster_url = getDefaultPosterUrl();
          }

          // console.log('✅ Loaded favorite trailer:', trailer.title);
          return trailer;
        } catch (err) {
          // console.warn(`❌ Exception fetching trailer ${id}:`, err);
          return null;
        }
      })
    );

    const validTrailers = trailers.filter((t): t is Trailer => t !== null);
    // console.log(`✅ Loaded ${validTrailers.length} favorites for user:`, userId);
    
    return validTrailers;
  } catch (error) {
    // console.error('❌ Exception in fetchFavorites:', error);
    return [];
  }
}

/* ========= Fetch Watchlist ========= */
export async function fetchWatchlist(userId: string): Promise<Trailer[]> {
  if (!userId) {
    // console.log('❌ No user ID provided to fetchWatchlist');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("watchlist")
      .select("trailer_id")
      .eq("user_id", userId);
    
    if (error) {
      // console.error('❌ Error fetching watchlist:', error);
      return [];
    }

    type ListRow = { trailer_id: string };
    const ids = (data || []).map((r: ListRow) => String(r.trailer_id));
    
    if (ids.length === 0) {
      // console.log('ℹ️ No watchlist items found for user:', userId);
      return [];
    }

    // console.log('📥 Fetching watchlist trailers for IDs:', ids);

    // Fetch trailer details for each watchlist item
    const trailers = await Promise.all(
      ids.map(async (id) => {
        try {
          const trailer = await getMovieById(id);
          if (!trailer) {
            return {
              id: String(id),
              title: `Unknown Title`,
              youtube_id: String(id),
              category: 'Unknown',
              poster_url: getDefaultPosterUrl()
            } as Trailer;
          }

          // If the poster is a placeholder data URI, try to resolve a real poster from movie tables
          if (!trailer.poster_url || trailer.poster_url.startsWith('data:')) {
            try {
              const resolved = await resolvePosterForTrailer(trailer);
              trailer.poster_url = resolved || trailer.poster_url;
            } catch (e) {
              // ignore and keep existing
            }
          }

          // Ensure poster URL is valid
          if (!isValidPosterUrl(trailer.poster_url)) {
            trailer.poster_url = getDefaultPosterUrl();
          }

          // console.log('✅ Loaded watchlist trailer:', trailer.title);
          return trailer;
        } catch (err) {
          // console.warn(`❌ Exception fetching trailer ${id}:`, err);
          return null;
        }
      })
    );

    const validTrailers = trailers.filter((t): t is Trailer => t !== null);
    // console.log(`✅ Loaded ${validTrailers.length} watchlist items for user:`, userId);
    
    return validTrailers;
  } catch (error) {
    // console.error('❌ Exception in fetchWatchlist:', error);
    return [];
  }
}

/* ========= Comments ========= */
export async function addComment(userId: string, trailerId: string, content: string): Promise<void> {
  if (!userId || !trailerId || !content.trim()) {
    throw new Error('Invalid comment data');
  }

  try {
    const { error } = await supabase
      .from("comments")
      .insert({ 
        user_id: userId, 
        trailer_id: trailerId, 
        content: content.trim() 
      });
      
    if (error) throw error;
  } catch (error) {
    // console.error('Error adding comment:', error);
    throw error;
  }
}

/* ========= Update / Delete Comments (for owners) ========= */
export async function updateComment(commentId: string, userId: string, newContent: string): Promise<{ success: boolean; error?: any }> {
  if (!commentId || !userId || !newContent) return { success: false, error: 'Invalid params' };

  try {
    const { error } = await supabase
      .from('comments')
      .update({ content: newContent.trim() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select('id');

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<{ success: boolean; error?: any }> {
  if (!commentId || !userId) return { success: false, error: 'Invalid params' };

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

export async function fetchComments(trailerId: string): Promise<CommentRow[]> {
  if (!trailerId) return [];

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id,user_id,trailer_id,content,created_at")
      .eq("trailer_id", trailerId)
      .order("created_at", { ascending: false });
      
    if (error) throw error;

    const comments = (data as CommentRow[] | null) ?? [];
    if (comments.length === 0) return comments;

    // Fetch like counts for comments
    const commentIds = comments.map((c) => c.id);
    const { data: likeRows, error: likeErr } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds);
      
    if (likeErr) throw likeErr;

    type CommentLike = { comment_id: string };
    const likeCounts = new Map<string, number>();
    (likeRows ?? []).forEach((r: CommentLike) => {
      const cid = r.comment_id;
      likeCounts.set(cid, (likeCounts.get(cid) ?? 0) + 1);
    });

    return comments.map((c) => ({ 
      ...c, 
      likes: likeCounts.get(c.id) ?? 0 
    }));
  } catch (error) {
    // console.error('Error fetching comments:', error);
    return [];
  }
}

/* ========= Comment Likes ========= */
export async function toggleLikeComment(userId: string, commentId: string): Promise<{ liked: boolean }> {
  if (!userId || !commentId) {
    throw new Error('Invalid user ID or comment ID');
  }

  try {
    // Check if already liked
    const { data, error } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .maybeSingle();
      
    if (error) throw error;

    // If exists, remove like
    if (data) {
      const { error: delErr } = await supabase
        .from("comment_likes")
        .delete()
        .eq("id", data.id);
        
      if (delErr) throw delErr;
      return { liked: false };
    }

    // If doesn't exist, add like
    const { error: insErr } = await supabase
      .from("comment_likes")
      .insert({ 
        user_id: userId, 
        comment_id: commentId 
      });
      
    if (insErr) throw insErr;

    return { liked: true };
  } catch (error) {
    // console.error('Error in toggleLikeComment:', error);
    throw error;
  }
}

/* ========= Remove Watchlist Row ========= */
export async function removeWatchlistRow(rowId: string): Promise<boolean> {
  if (!rowId) return false;

  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', rowId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    // console.error('Error removing watchlist row:', error);
    throw error;
  }
}

/* ========= Clear User Data ========= */
export async function clearUserData(userId: string): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'No user ID provided' };
  }

  try {
    // console.log('🧹 Clearing data for user:', userId);
    
    // Delete all watchlist entries for this user
    const { error: watchlistError, count: watchlistCount } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId);
    
    if (watchlistError) {
      // console.error('Error clearing watchlist:', watchlistError);
      throw watchlistError;
    }

    // Delete all favorites entries for this user
    const { error: favoritesError, count: favoritesCount } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId);
    
    if (favoritesError) {
      // console.error('Error clearing favorites:', favoritesError);
      throw favoritesError;
    }

    // console.log(`✅ Cleared ${watchlistCount} watchlist items and ${favoritesCount} favorites for user:`, userId);
    
    return { 
      success: true, 
      message: `Cleared ${watchlistCount} watchlist items and ${favoritesCount} favorites` 
    };
  } catch (error) {
    // console.error('Exception in clearUserData:', error);
    return { 
      success: false, 
      message: `Failed to clear user data: ${error}` 
    };
  }
}

/* ========= Clean Invalid Watchlist/Favorites ========= */
export async function cleanInvalidUserData(userId: string): Promise<{ 
  success: boolean; 
  cleanedWatchlist: number; 
  cleanedFavorites: number;
  message: string 
}> {
  if (!userId) {
    return { success: false, cleanedWatchlist: 0, cleanedFavorites: 0, message: 'No user ID provided' };
  }

  try {
    // console.log('🧹 Cleaning invalid data for user:', userId);
    
    let cleanedWatchlist = 0;
    let cleanedFavorites = 0;

    // Clean watchlist: Remove entries where trailer doesn't exist or has invalid data
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('id, trailer_id')
      .eq('user_id', userId);

    if (watchlistError) throw watchlistError;

    if (watchlistData && watchlistData.length > 0) {
      for (const item of watchlistData) {
        const trailer = await getMovieById(item.trailer_id);

        // If trailer doesn't exist or has invalid data, remove the watchlist entry
        if (!trailer || !isValidPosterUrl(trailer.poster_url)) {
          const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('id', item.id);
          
          if (!error) {
            cleanedWatchlist++;
            // console.log(`🗑️ Removed invalid watchlist item: ${item.trailer_id}`);
          }
        }
      }
    }

    // Clean favorites: Remove entries where trailer doesn't exist or has invalid data
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('id, trailer_id')
      .eq('user_id', userId);

    if (favoritesError) throw favoritesError;

    if (favoritesData && favoritesData.length > 0) {
      for (const item of favoritesData) {
        const trailer = await getMovieById(item.trailer_id);

        // If trailer doesn't exist or has invalid data, remove the favorites entry
        if (!trailer || !isValidPosterUrl(trailer.poster_url)) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', item.id);
          
          if (!error) {
            cleanedFavorites++;
            // console.log(`🗑️ Removed invalid favorite item: ${item.trailer_id}`);
          }
        }
      }
    }

    const message = `Cleaned ${cleanedWatchlist} invalid watchlist items and ${cleanedFavorites} invalid favorite items`;
    // console.log('✅', message);
    
    return { 
      success: true, 
      cleanedWatchlist, 
      cleanedFavorites, 
      message 
    };
  } catch (error) {
    // console.error('❌ Exception in cleanInvalidUserData:', error);
    return { 
      success: false, 
      cleanedWatchlist: 0, 
      cleanedFavorites: 0, 
      message: `Failed to clean user data: ${error}` 
    };
  }
}

// Export for debugging
export const __DATA_MODULE = "DATA_MODULE_V7_NO_LOCAL_DATA_REMOVED_GET_TRAILER";

/**
 * Normalize poster URL for the browser.
 * - Return data: URIs and absolute URLs unchanged
 * - Convert local paths like `/posters/x.jpg` or `posters/x.jpg` to absolute URLs using window.location.origin
 */
export function normalizePosterUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (trimmed === '') return undefined;
  // Already a data URI
  if (trimmed.startsWith('data:')) return trimmed;
  // Absolute URL (http/https)
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Otherwise treat as a local path and prefix with origin
  try {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    if (!origin) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
  } catch (e) {
    return trimmed;
  }
}

/**
 * Try to resolve a better poster URL for a trailer by looking up movie tables.
 * Returns poster_url string or null if none found.
 */
async function resolvePosterForTrailer(trailer: Trailer): Promise<string | null> {
  try {
    const numericId = Number.isFinite(Number(trailer.id)) ? Number(trailer.id) : null;
    const tables = ['movies', 'upcoming_movies', 'new_releases'];

    if (numericId) {
      for (const t of tables) {
        try {
          const { data, error } = await supabase.from(t).select('poster_url').eq('id', numericId).maybeSingle();
          if (!error && data && (data as any).poster_url) return (data as any).poster_url as string;
        } catch (e) {
          // ignore and continue
        }
      }
    }

    const title = (trailer.title || '').trim();
    if (title) {
      const search = `%${title.replace(/%/g, '')}%`;
      for (const t of tables) {
        try {
          const { data, error } = await supabase.from(t).select('poster_url, title').ilike('title', search).limit(1);
          if (!error && data && data.length > 0 && (data[0] as any).poster_url) {
            return (data[0] as any).poster_url as string;
          }
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}
