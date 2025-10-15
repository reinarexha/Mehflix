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

/* ========= Single trailer (DB) ========= */
export async function getMovieById(id: string): Promise<Trailer | null> {
  const { data, error } = await supabase
    .from("trailers")
    .select("id,title,youtube_id,category,poster_url")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Trailer | null) ?? null;
}

/* ========= Local helper stub (for Home.tsx fallback) ========= */
export function getTrailerById(_id: string): Trailer | undefined {
  const local = (moviesData as any[]).find(m => m.id === _id);
  if (local) {
    return {
      id: local.id,
      title: local.title,
      youtube_id: (function extractYoutubeId(url: string) {
        try {
          const u = new URL(url)
          if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || url
          if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || url
          return url
        } catch {
          return url
        }
      })(local.trailer),
      category: 'Unknown',
      poster_url: local.poster,
    };
  }

  // Return undefined for unknown IDs instead of a fake placeholder
  return undefined;
}

/* ========= Ensure trailer exists (DB) ========= */
async function ensureTrailerExists(trailer: Trailer) {
  try {
    const payload = {
      id: trailer.id,
      title: trailer.title ?? 'Unknown',
      youtube_id: trailer.youtube_id ?? trailer.id,
      category: trailer.category ?? 'Unknown',
      poster_url: trailer.poster_url ?? '',
    }
    const { error } = await supabase.from('trailers').upsert([payload])
    if (error) throw error
    return true
  } catch (e) {
    console.warn('ensureTrailerExists failed', e)
    throw e
  }
}

/* ========= Watchlist ========= */
export async function toggleWatchlist(userId: string, trailer: Trailer) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("trailer_id", trailer.id)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const { error: delErr } = await supabase
      .from("watchlist")
      .delete()
      .eq("id", (data as { id: string }).id);
    if (delErr) throw delErr;
    return { inWatchlist: false };
  }

  const { error: insErr } = await supabase
    .from("watchlist")
    .insert({ user_id: userId, trailer_id: trailer.id });
  if (insErr) {
    const msg = String(insErr.message || insErr).toLowerCase();
    if (msg.includes('foreign key') || msg.includes('violates foreign key') || msg.includes('trailer_id')) {
      try {
        await ensureTrailerExists(trailer)
        const { error: retryErr } = await supabase.from('watchlist').insert({ user_id: userId, trailer_id: trailer.id })
        if (retryErr) throw retryErr
        return { inWatchlist: true }
      } catch (e) {
        throw e
      }
    }
    throw insErr
  }
  return { inWatchlist: true };
}

/* ========= Favorites ========= */
export async function toggleFavorite(userId: string, trailer: Trailer) {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("trailer_id", trailer.id)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const { error: delErr } = await supabase
      .from("favorites")
      .delete()
      .eq("id", (data as { id: string }).id);
    if (delErr) throw delErr;
    return { favorited: false };
  }

  const { error: insErr } = await supabase
    .from("favorites")
    .insert({ user_id: userId, trailer_id: trailer.id });
  if (insErr) {
    const msg = String(insErr.message || insErr).toLowerCase();
    if (msg.includes('foreign key') || msg.includes('violates foreign key') || msg.includes('trailer_id')) {
      try {
        await ensureTrailerExists(trailer)
        const { error: retryErr } = await supabase.from('favorites').insert({ user_id: userId, trailer_id: trailer.id })
        if (retryErr) throw retryErr
        return { favorited: true }
      } catch (e) {
        throw e
      }
    }
    throw insErr
  }

  return { favorited: true };
}

/* ========= Fetch Favorites ========= */
export async function fetchFavorites(userId: string): Promise<Trailer[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("trailer_id")
    .eq("user_id", userId);
  if (error) throw error;

  const ids = (data ?? []).map((r: any) => String(r.trailer_id));
  if (ids.length === 0) return [];

  const trailers = await Promise.all(
    ids.map(async (id) => {
      const { data: t, error: e } = await supabase
        .from("trailers")
        .select("id,title,youtube_id,category,poster_url")
        .eq("id", id)
        .maybeSingle();
      if (e || !t) return null;
      return t as Trailer;
    })
  );

  return trailers.filter((t): t is Trailer => !!t);
}

/* ========= Fetch Watchlist ========= */
export async function fetchWatchlist(userId: string): Promise<Trailer[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("trailer_id")
    .eq("user_id", userId);
  if (error) throw error;

  const ids = (data ?? []).map((r: any) => String(r.trailer_id));
  if (ids.length === 0) return [];

  const trailers = await Promise.all(
    ids.map(async (id) => {
      const { data: t, error: e } = await supabase
        .from("trailers")
        .select("id,title,youtube_id,category,poster_url")
        .eq("id", id)
        .maybeSingle();

      if (e || !t) return null;
      return t as Trailer;
    })
  );

  return trailers.filter((t): t is Trailer => !!t);
}

/* ========= Comments ========= */
export type CommentRow = {
  id: string;
  user_id: string;
  trailer_id: string;
  content: string;
  created_at: string;
  likes?: number;
};

export async function addComment(userId: string, trailerId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .insert({ user_id: userId, trailer_id: trailerId, content });
  if (error) throw error;
}

export async function fetchComments(trailerId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id,user_id,trailer_id,content,created_at")
    .eq("trailer_id", trailerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const comments = (data as CommentRow[] | null) ?? [];
  if (comments.length === 0) return comments;

  const ids = comments.map((c) => c.id);
  const { data: likeRows, error: likeErr } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", ids);
  if (likeErr) throw likeErr;

  const counts = new Map<string, number>();
  (likeRows ?? []).forEach((r: any) => {
    const cid = r.comment_id as string;
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
  });

  return comments.map((c) => ({ ...c, likes: counts.get(c.id) ?? 0 }));
}

/* ========= Comment Likes ========= */
export async function toggleLikeComment(userId: string, commentId: string) {
  const { data, error } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("comment_id", commentId)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const { error: delErr } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", (data as { id: string }).id);
    if (delErr) throw delErr;
    return { liked: false };
  }

  const { error: insErr } = await supabase
    .from("comment_likes")
    .insert({ user_id: userId, comment_id: commentId });
  if (insErr) throw insErr;

  return { liked: true };
}

// Remove a specific watchlist row by its row id
export async function removeWatchlistRow(rowId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('watchlist').delete().eq('id', rowId)
    if (error) throw error
       return true;
  } catch (err) {
    console.warn('removeWatchlistRow failed', err);
    throw err;
  }
}

// sanity marker if you want to check via console dynamic import
export const __DATA_MODULE = "OK";
