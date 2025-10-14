// src/lib/data.ts
<<<<<<< HEAD
import { supabase } from "./supabaseClient";
=======
import { supabase } from './supabaseClient'
>>>>>>> 44ee14384fa48abea76d0f6ccbec80f5bf3891b8

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

export type ToggleWatchlistResult = { inWatchlist: boolean };
export type ToggleFavoriteResult = { favorited: boolean };
export type ToggleLikeResult = { liked: boolean };

/* ========= Single trailer ========= */
export async function getMovieById(id: string): Promise<Trailer | null> {
  const { data, error } = await supabase
    .from("trailers")
    .select("id,title,youtube_id,category,poster_url")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Trailer | null) ?? null;
}

/* ========= Watchlist ========= */
export async function toggleWatchlist(
  userId: string,
  trailerId: string
): Promise<ToggleWatchlistResult> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("trailer_id", trailerId)
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
    .insert({ user_id: userId, trailer_id: trailerId });
  if (insErr) throw insErr;

  return { inWatchlist: true };
}

/* ========= Favorites ========= */
export async function toggleFavorite(
  userId: string,
  trailerId: string
) {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("trailer_id", trailerId)
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
    .insert({ user_id: userId, trailer_id: trailerId });
  if (insErr) throw insErr;

  return { favorited: true };
}

/* ========= Comments ========= */
export async function addComment(
  userId: string,
  trailerId: string,
  content: string
<<<<<<< HEAD
): Promise<void> {
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

/* ========= Comment likes ========= */
export async function toggleLikeComment(
  userId: string,
  commentId: string
) {
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

// marker for sanity checks
export const __DATA_MODULE = "OK";
=======
  created_at: string
  likes?: number
}

// ---------------- Supabase Functions ----------------

export async function toggleWatchlist(userId: string, trailer: Trailer) {
  // Ensure trailer exists in trailers table
  const { error: upsertError } = await supabase
    .from('trailers')
    .upsert({
      id: trailer.id,
      title: trailer.title,
      youtube_id: trailer.youtube_id,
      category: trailer.category,
      poster_url: trailer.poster_url,
    })
  if (upsertError) throw upsertError

  // Check if in watchlist
  const { data, error } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('trailer_id', trailer.id)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error

  if (data) {
    const { error: delErr } = await supabase.from('watchlist').delete().eq('id', data.id)
    if (delErr) throw delErr
    return { inWatchlist: false }
  }

  const { error: insErr } = await supabase
    .from('watchlist')
    .insert({ user_id: userId, trailer_id: trailer.id })
  if (insErr) throw insErr
  return { inWatchlist: true }
}

export async function toggleFavorite(userId: string, trailer: Trailer) {
  // Ensure trailer exists in trailers table
  const { error: upsertError } = await supabase
    .from('trailers')
    .upsert({
      id: trailer.id,
      title: trailer.title,
      youtube_id: trailer.youtube_id,
      category: trailer.category,
      poster_url: trailer.poster_url,
    })
  if (upsertError) throw upsertError

  // Check if favorite exists
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('trailer_id', trailer.id)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error

  if (data) {
    const { error: delErr } = await supabase.from('favorites').delete().eq('id', data.id)
    if (delErr) throw delErr
    return { favorited: false }
  }

  const { error: insErr } = await supabase
    .from('favorites')
    .insert({ user_id: userId, trailer_id: trailer.id })
  if (insErr) throw insErr
  return { favorited: true }
}

// Fetch favorites for a user
export async function fetchFavorites(userId: string): Promise<Trailer[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('trailer_id')
    .eq('user_id', userId)
  if (error) throw error

  const trailersData = await Promise.all(
    (data ?? []).map(async (f: { trailer_id: string }) => {
      const { data: trailerRow } = await supabase
        .from('trailers')
        .select('*')
        .eq('id', f.trailer_id)
        .maybeSingle()
      return trailerRow as Trailer
    })
  )
  return trailersData.filter(Boolean)
}

// Fetch watchlist for a user
export async function fetchWatchlist(userId: string): Promise<Trailer[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('trailer_id')
    .eq('user_id', userId)
  if (error) throw error

  const trailersData = await Promise.all(
    (data ?? []).map(async (w: { trailer_id: string }) => {
      const { data: trailerRow } = await supabase
        .from('trailers')
        .select('*')
        .eq('id', w.trailer_id)
        .maybeSingle()
      return trailerRow as Trailer
    })
  )
  return trailersData.filter(Boolean)
}

// Remove a specific watchlist row by its row id
export async function removeWatchlistRow(rowId: string) {
  // Prefer supabase client if available
  try {
    if (typeof (supabase as any).from === 'function') {
      const { error } = await supabase.from('watchlist').delete().eq('id', rowId)
      if (error) throw error
      return true
    }
  } catch (err) {
    // fall through to network fallback
    console.warn('Supabase removeWatchlistRow failed, falling back to HTTP delete:', err)
  }

  // Fallback: try a server-side HTTP endpoint (if present)
  try {
    const res = await fetch(`/api/watchlist/${rowId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('HTTP delete failed')
    return true
  } catch (err) {
    throw err
  }
}

// ---------------- Movie/Trailer Functions ----------------

// Optional: static local trailers (for testing before Supabase)
export const trailers: Trailer[] = [
  { id: '1', title: 'Edge of Tomorrow', youtube_id: 'yt1', category: 'Action', poster_url: '/posters/id1.jpg' },
  { id: '2', title: 'Laugh Out Loud', youtube_id: 'yt2', category: 'Comedy', poster_url: '/posters/id2.jpg' },
  { id: '3', title: 'Night Terrors', youtube_id: 'yt3', category: 'Horror', poster_url: '/posters/id3.jpg' },
  { id: '4', title: 'Space Drift', youtube_id: 'yt4', category: 'Sci-Fi', poster_url: '/posters/id4.jpg' },
  { id: '5', title: 'Romance in Paris', youtube_id: 'yt5', category: 'Romance', poster_url: '/posters/id5.jpg' },
  { id: '6', title: 'Family Ties', youtube_id: 'yt6', category: 'Family', poster_url: '/posters/id6.jpg' },
  { id: '7', title: 'Hidden Crimes', youtube_id: 'yt7', category: 'Crime', poster_url: '/posters/id7.jpg' },
  { id: '8', title: 'The Animated Journey', youtube_id: 'yt8', category: 'Animation', poster_url: '/posters/id8.webp' },
  { id: '9', title: 'Dramatic Turns', youtube_id: 'yt9', category: 'Drama', poster_url: '/posters/id9.jpg' },
  { id: '10', title: 'Musical Nights', youtube_id: 'yt10', category: 'Musical', poster_url: '/posters/id10.jpg' },
  { id: '11', title: 'Undercover', youtube_id: 'yt11', category: 'Crime', poster_url: '/posters/id11.webp' },
  { id: '12', title: 'Ocean Documentary', youtube_id: 'yt12', category: 'Documentary', poster_url: '/posters/id12.jpg' },
  { id: '13', title: 'Love & Loss', youtube_id: 'yt13', category: 'Drama', poster_url: '/posters/id13.webp' },
  { id: '14', title: 'Action Rescue', youtube_id: 'yt14', category: 'Action', poster_url: '/posters/id14.jpg' },
  { id: '15', title: 'City of Dreams', youtube_id: 'yt15', category: 'Romance', poster_url: '/posters/id15.jpg' },
  { id: '16', title: 'Laugh Riot', youtube_id: 'yt16', category: 'Comedy', poster_url: '/posters/id16.jpg' },
  { id: '17', title: 'Horror House', youtube_id: 'yt17', category: 'Horror', poster_url: '/posters/id17.jpg' },
  { id: '18', title: 'Strings Attached', youtube_id: 'yt18', category: 'Musical', poster_url: '/posters/id18.jpg' },
  { id: '19', title: 'Family Heirloom', youtube_id: 'yt19', category: 'Family', poster_url: '/posters/id19.jpg' },
  { id: '20', title: 'Time Travelers', youtube_id: 'yt20', category: 'Sci-Fi', poster_url: '/posters/id20.jpg' },
  { id: '21', title: 'The Last Heist', youtube_id: 'yt21', category: 'Crime', poster_url: '/posters/id21.jpg' },
  { id: '22', title: 'Documented Lives', youtube_id: 'yt22', category: 'Documentary', poster_url: '/posters/id22.jpg' },
  { id: '23', title: 'Romantic Escape', youtube_id: 'yt23', category: 'Romance', poster_url: '/posters/id23.webp' },
  { id: '24', title: 'Thrill Ride', youtube_id: 'yt24', category: 'Thriller', poster_url: '/posters/id24.jpg' },
  { id: '25', title: 'Animated Tales', youtube_id: 'yt25', category: 'Animation', poster_url: '/posters/id25.jpg' },
  { id: '26', title: 'Drama Kings', youtube_id: 'yt26', category: 'Drama', poster_url: '/posters/id26.jpg' },
  { id: '27', title: 'Sci-Fi Odyssey', youtube_id: 'yt27', category: 'Sci-Fi', poster_url: '/posters/id27.jpg' },
  { id: '28', title: 'Family Reunion', youtube_id: 'yt28', category: 'Family', poster_url: '/posters/id28.jpg' },
  { id: '29', title: 'Horror Night', youtube_id: 'yt29', category: 'Horror', poster_url: '/posters/id29.jpg' },
  { id: '30', title: 'Final Act', youtube_id: 'yt30', category: 'Thriller', poster_url: '/posters/id30.jpg' },
]

export function getTrailerById(id: string): Trailer | undefined {
  // Match by numeric id or youtube id so callers can pass either
  return trailers.find((t) => t.id === id || t.youtube_id === id)
}
>>>>>>> 44ee14384fa48abea76d0f6ccbec80f5bf3891b8
