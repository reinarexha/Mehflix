import { supabase } from './supabaseClient'

export type Trailer = {
  id: string
  title: string
  youtube_id: string
  category: string
  poster_url: string
}

export type CommentRow = {
  id: string
  user_id: string
  trailer_id: string
  content: string
  created_at: string
  likes?: number
}

export async function toggleWatchlist(userId: string, trailerId: string) {
  // Check if exists
  const { data, error } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('trailer_id', trailerId)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error

  if (data) {
    const { error: delErr } = await supabase.from('watchlist').delete().eq('id', data.id)
    if (delErr) throw delErr
    return { inWatchlist: false }
  }

  const { error: insErr } = await supabase.from('watchlist').insert({ user_id: userId, trailer_id: trailerId })
  if (insErr) throw insErr
  return { inWatchlist: true }
}

export async function toggleFavorite(userId: string, trailerId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('trailer_id', trailerId)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error

  if (data) {
    const { error: delErr } = await supabase.from('favorites').delete().eq('id', data.id)
    if (delErr) throw delErr
    return { favorited: false }
  }
  const { error: insErr } = await supabase.from('favorites').insert({ user_id: userId, trailer_id: trailerId })
  if (insErr) throw insErr
  return { favorited: true }
}

export async function addComment(userId: string, trailerId: string, content: string) {
  const { error } = await supabase
    .from('comments')
    .insert({ user_id: userId, trailer_id: trailerId, content })
  if (error) throw error
}

export async function fetchComments(trailerId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id,user_id,trailer_id,content,created_at')
    .eq('trailer_id', trailerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  // Optionally join likes count
  const ids = (data ?? []).map(c => c.id)
  if (ids.length === 0) return data ?? []
  const { data: likeRows, error: likeErr } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .in('comment_id', ids)
  if (likeErr) throw likeErr
  const counts = new Map<string, number>()
  likeRows?.forEach(r => counts.set(r.comment_id as unknown as string, (counts.get(r.comment_id as unknown as string) ?? 0) + 1))
  return (data ?? []).map(c => ({ ...c, likes: counts.get(c.id) ?? 0 }))
}

export async function toggleLikeComment(userId: string, commentId: string) {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (data) {
    const { error: delErr } = await supabase.from('comment_likes').delete().eq('id', data.id)
    if (delErr) throw delErr
    return { liked: false }
  }
  const { error: insErr } = await supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId })
  if (insErr) throw insErr
  return { liked: true }
}


