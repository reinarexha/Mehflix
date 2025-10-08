import { supabase } from './supabaseClient'

export type Trailer = {
  id: string
  title: string
  youtube_id: string
  category: string
  poster_url: string
}

export async function fetchTrailersByCategory(category: string): Promise<Trailer[]> {
<<<<<<< HEAD
  try {
    const { data, error } = await (supabase as any)
      .from('trailers')
      .select('id,title,youtube_id,category,poster_url')
      .eq('category', category)
      .limit(24)
=======
  if (!supabase) return []
  const { data, error } = await supabase
    .from('trailers')
    .select('id,title,youtube_id,category,poster_url')
    .eq('category', category)
    .limit(24)
>>>>>>> 92d0187a4618788afbf93ddbce3e6bd707272e45

    if (error) throw error
    return data ?? []
  } catch {
    // Fallback to demo data when Supabase is unavailable
    return Array.from({ length: 10 }).map((_, i) => ({
      id: `${category}-${i}`,
      title: `${capitalize(category)} Trailer ${i + 1}`,
      youtube_id: demoIds[i % demoIds.length],
      category,
      poster_url: `https://picsum.photos/seed/${category}${i}/300/450`
    }))
  }
}

const demoIds = [
  'dQw4w9WgXcQ', '3JZ_D3ELwOQ', 'hY7m5jjJ9mM', 'kxopViU98Xo', '9bZkp7q19f0',
  'tVj0ZTS4WF4', 'CevxZvSJLk8', 'RgKAFK5djSk', 'OPf0YbXqDm0', '60ItHLz5WEA'
]

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export async function addToWatchlist(userId: string, trailerId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: userId, trailer_id: trailerId })
  if (error) throw error
}

export async function toggleFavorite(userId: string, trailerId: string) {
  if (!supabase) return { favorited: false }
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('trailer_id', trailerId)
    .maybeSingle()
  if (error) throw error
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
  if (!supabase) return
  const { error } = await supabase
    .from('comments')
    .insert({ user_id: userId, trailer_id: trailerId, content })
  if (error) throw error
}

export async function likeComment(userId: string, commentId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('comment_likes')
    .insert({ user_id: userId, comment_id: commentId })
  if (error) throw error
}


