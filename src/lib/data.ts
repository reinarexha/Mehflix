// src/lib/data.ts
import { supabase } from "./supabaseClient";
import moviesData from './moviesData'

/* ========= Types ========= */
export type Trailer = {
  id: string;
  title: string;
  youtube_id: string;
  category: string;
  poster_url: string;
};

export type CommentRow = {
  id: string;
  user_id: string;
  trailer_id: string;
  content: string;
  created_at: string;
  likes?: number;
};

/* ========= Single trailer (DB) ========= */
export async function getMovieById(id: string): Promise<Trailer | null> {
  if (!id) return null;
  
  try {
    const { data, error } = await supabase
      .from("trailers")
      .select("id,title,youtube_id,category,poster_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching movie by ID:', error);
      return null;
    }
    
    return data as Trailer | null;
  } catch (error) {
    console.error('Exception in getMovieById:', error);
    return null;
  }
}

/* ========= Local helper stub (for Home.tsx fallback) ========= */
export function getTrailerById(id: string): Trailer | undefined {
  if (!id) return undefined;
  
  try {
    const local = (moviesData as any[]).find(m => m.id === id);
    if (local) {
      return {
        id: local.id,
        title: local.title || 'Unknown Title',
        youtube_id: (function extractYoutubeId(url: string) {
          try {
            const u = new URL(url);
            if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || url;
            if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || url;
            return url;
          } catch {
            return url;
          }
        })(local.trailer || ''),
        category: local.category || 'Unknown',
        poster_url: local.poster || '',
      };
    }
    return undefined;
  } catch (error) {
    console.error('Error in getTrailerById:', error);
    return undefined;
  }
}

/* ========= Ensure trailer exists (DB) ========= */
async function ensureTrailerExists(trailer: Trailer): Promise<boolean> {
  if (!trailer?.id) return false;
  
  try {
    const payload = {
      id: trailer.id,
      title: trailer.title || 'Unknown',
      youtube_id: trailer.youtube_id || trailer.id,
      category: trailer.category || 'Unknown',
      poster_url: trailer.poster_url || '',
    };
    
    const { error } = await supabase
      .from('trailers')
      .upsert([payload], { onConflict: 'id' });
      
    if (error) {
      console.error('Error ensuring trailer exists:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in ensureTrailerExists:', error);
    return false;
  }
}

/* ========= Watchlist ========= */
export async function toggleWatchlist(userId: string, trailer: Trailer): Promise<{ inWatchlist: boolean }> {
  if (!userId || !trailer?.id) {
    throw new Error('Invalid user ID or trailer');
  }

  try {
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
      return { inWatchlist: false };
    }

    // If doesn't exist, add it
    const { error: insErr } = await supabase
      .from("watchlist")
      .insert({ 
        user_id: userId, 
        trailer_id: trailer.id 
      });

    if (insErr) {
      const msg = String(insErr.message || insErr).toLowerCase();
      
      // If foreign key constraint fails, ensure trailer exists and retry
      if (msg.includes('foreign key') || msg.includes('violates foreign key') || msg.includes('trailer_id')) {
        const ensured = await ensureTrailerExists(trailer);
        if (!ensured) throw new Error('Failed to ensure trailer exists');
        
        const { error: retryErr } = await supabase
          .from('watchlist')
          .insert({ user_id: userId, trailer_id: trailer.id });
          
        if (retryErr) throw retryErr;
        return { inWatchlist: true };
      }
      throw insErr;
    }

    return { inWatchlist: true };
  } catch (error) {
    console.error('Error in toggleWatchlist:', error);
    throw error;
  }
}

/* ========= Favorites ========= */
export async function toggleFavorite(userId: string, trailer: Trailer): Promise<{ favorited: boolean }> {
  if (!userId || !trailer?.id) {
    throw new Error('Invalid user ID or trailer');
  }

  try {
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
      return { favorited: false };
    }

    // If doesn't exist, add it
    const { error: insErr } = await supabase
      .from("favorites")
      .insert({ 
        user_id: userId, 
        trailer_id: trailer.id 
      });

    if (insErr) {
      const msg = String(insErr.message || insErr).toLowerCase();
      
      // If foreign key constraint fails, ensure trailer exists and retry
      if (msg.includes('foreign key') || msg.includes('violates foreign key') || msg.includes('trailer_id')) {
        const ensured = await ensureTrailerExists(trailer);
        if (!ensured) throw new Error('Failed to ensure trailer exists');
        
        const { error: retryErr } = await supabase
          .from('favorites')
          .insert({ user_id: userId, trailer_id: trailer.id });
          
        if (retryErr) throw retryErr;
        return { favorited: true };
      }
      throw insErr;
    }

    return { favorited: true };
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    throw error;
  }
}

/* ========= Fetch Favorites ========= */
export async function fetchFavorites(userId: string): Promise<Trailer[]> {
  if (!userId) {
    console.log('No user ID provided to fetchFavorites');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("trailer_id")
      .eq("user_id", userId);
    
    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    const ids = (data || []).map((r: any) => String(r.trailer_id));
    
    if (ids.length === 0) {
      console.log('No favorites found for user:', userId);
      return [];
    }

    // Fetch trailer details for each favorite
    const trailers = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data: trailer, error: trailerError } = await supabase
            .from("trailers")
            .select("id,title,youtube_id,category,poster_url")
            .eq("id", id)
            .maybeSingle();

          if (trailerError || !trailer) {
            console.warn(`Trailer not found for favorite: ${id}`);
            return null;
          }
          
          return trailer as Trailer;
        } catch (err) {
          console.warn(`Error fetching trailer ${id}:`, err);
          return null;
        }
      })
    );

    const validTrailers = trailers.filter((t): t is Trailer => t !== null);
    console.log(`Loaded ${validTrailers.length} favorites for user:`, userId);
    
    return validTrailers;
  } catch (error) {
    console.error('Exception in fetchFavorites:', error);
    return [];
  }
}

/* ========= Fetch Watchlist ========= */
export async function fetchWatchlist(userId: string): Promise<Trailer[]> {
  if (!userId) {
    console.log('No user ID provided to fetchWatchlist');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("watchlist")
      .select("trailer_id")
      .eq("user_id", userId);
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }

    const ids = (data || []).map((r: any) => String(r.trailer_id));
    
    if (ids.length === 0) {
      console.log('No watchlist items found for user:', userId);
      return [];
    }

    // Fetch trailer details for each watchlist item
    const trailers = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data: trailer, error: trailerError } = await supabase
            .from("trailers")
            .select("id,title,youtube_id,category,poster_url")
            .eq("id", id)
            .maybeSingle();

          if (trailerError || !trailer) {
            console.warn(`Trailer not found for watchlist: ${id}`);
            return null;
          }
          
          return trailer as Trailer;
        } catch (err) {
          console.warn(`Error fetching trailer ${id}:`, err);
          return null;
        }
      })
    );

    const validTrailers = trailers.filter((t): t is Trailer => t !== null);
    console.log(`Loaded ${validTrailers.length} watchlist items for user:`, userId);
    
    return validTrailers;
  } catch (error) {
    console.error('Exception in fetchWatchlist:', error);
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
    console.error('Error adding comment:', error);
    throw error;
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

    const likeCounts = new Map<string, number>();
    (likeRows ?? []).forEach((r: any) => {
      const cid = r.comment_id as string;
      likeCounts.set(cid, (likeCounts.get(cid) ?? 0) + 1);
    });

    return comments.map((c) => ({ 
      ...c, 
      likes: likeCounts.get(c.id) ?? 0 
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
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
    console.error('Error in toggleLikeComment:', error);
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
    console.error('Error removing watchlist row:', error);
    throw error;
  }
}

/* ========= Clear User Data ========= */
export async function clearUserData(userId: string): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'No user ID provided' };
  }

  try {
    console.log('🧹 Clearing data for user:', userId);
    
    // Delete all watchlist entries for this user
    const { error: watchlistError, count: watchlistCount } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId);
    
    if (watchlistError) {
      console.error('Error clearing watchlist:', watchlistError);
      throw watchlistError;
    }

    // Delete all favorites entries for this user
    const { error: favoritesError, count: favoritesCount } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId);
    
    if (favoritesError) {
      console.error('Error clearing favorites:', favoritesError);
      throw favoritesError;
    }

    console.log(`✅ Cleared ${watchlistCount} watchlist items and ${favoritesCount} favorites for user:`, userId);
    
    return { 
      success: true, 
      message: `Cleared ${watchlistCount} watchlist items and ${favoritesCount} favorites` 
    };
  } catch (error) {
    console.error('Exception in clearUserData:', error);
    return { 
      success: false, 
      message: `Failed to clear user data: ${error}` 
    };
  }
}

// Export for debugging
export const __DATA_MODULE = "DATA_MODULE_V2_FIXED";