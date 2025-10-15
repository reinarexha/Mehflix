import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { toggleFavorite, toggleWatchlist, getTrailerById, fetchFavorites, fetchWatchlist, toggleLikeComment, type CommentRow, type Trailer } from '../lib/data'
import { supabase } from '../lib/supabaseClient'

export default function Movie() {
  const { id } = useParams()
  const videoId = id || ''
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
  const { user } = useUser()
  const [isFav, setIsFav] = useState(false)
  const [inList, setInList] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!videoId) return
      try {
        const rows = await fetchComments(videoId)
        setComments(rows)
      } catch (e) {
        // ignore load errors for now
        console.warn('Failed to load comments', e)
      }
    }

    run()
  }, [videoId])

  useEffect(() => {
    async function loadStatus() {
      if (!user || !videoId) return
      try {
        const favs = await fetchFavorites(user.id)
        const wls = await fetchWatchlist(user.id)
        const trailer = getTrailerById(videoId) ?? { id: videoId, title: 'Unknown', youtube_id: videoId, category: 'Unknown', poster_url: '' }
        setIsFav(favs.some(t => t.id === trailer.id || t.youtube_id === trailer.youtube_id))
        setInList(wls.some(t => t.id === trailer.id || t.youtube_id === trailer.youtube_id))
      } catch (e) {
        console.error('Failed to load favorite/watchlist status', e)
      }
    }
    loadStatus()
  }, [user, videoId])

  // Local comment helpers (supabase-backed)
  // Resolve trailer id candidates (prefer canonical trailer.id when available)
  function trailerIdCandidates(videoIdentifier: string) {
    const trailer = getTrailerById(videoIdentifier)
    const candidates = [] as string[]
    if (trailer?.id) candidates.push(trailer.id)
    if (videoIdentifier) candidates.push(videoIdentifier)
    // dedupe
    return Array.from(new Set(candidates))
  }

  async function fetchComments(trailerIdentifier: string): Promise<CommentRow[]> {
    // include commenter username; query by any known trailer id form (uuid or youtube id)
    const ids = trailerIdCandidates(trailerIdentifier)
    try {
      // try fetching by trailer_id
      let byTrailer: any[] | null = null
      let errTrailer: any = null
      try {
        const res = await supabase
          .from('comments')
          .select('id, user_id, trailer_id, content, created_at, likes, commenter:profiles(username)')
          .in('trailer_id', ids)
          .order('created_at', { ascending: false })
        byTrailer = res.data ?? null
        errTrailer = res.error ?? null
      } catch (e) {
        errTrailer = e
      }

      // also try fetching by movie_id in case the schema uses that column
      let byMovie: any[] | null = null
      let errMovie: any = null
      try {
        const res2 = await supabase
          .from('comments')
          .select('id, user_id, trailer_id, movie_id, content, created_at, likes, commenter:profiles(username)')
          .in('movie_id', ids)
          .order('created_at', { ascending: false })
        byMovie = res2.data ?? null
        errMovie = res2.error ?? null
      } catch (e) {
        errMovie = e
      }

      // If both attempts returned relationship errors, fallback to no-join flow
      const relErrMsg = 'Could not find a relationship'
      const trailerRelErr = errTrailer && String(errTrailer.message || errTrailer).includes(relErrMsg)
      const movieRelErr = errMovie && String(errMovie.message || errMovie).includes(relErrMsg)

      let rows: any[] = []
      if ((errTrailer && !trailerRelErr) || (errMovie && !movieRelErr)) {
        // Some other error occurred
        throw errTrailer || errMovie
      }

      if (trailerRelErr || movieRelErr) {
        // fallback: fetch comments without join and then fetch profiles separately
        const { data: simpleByTrailer, error: sErr1 } = await supabase
          .from('comments')
          .select('id, user_id, trailer_id, movie_id, content, created_at, likes')
          .in('trailer_id', ids)
          .order('created_at', { ascending: false })
        const { data: simpleByMovie, error: sErr2 } = await supabase
          .from('comments')
          .select('id, user_id, trailer_id, movie_id, content, created_at, likes')
          .in('movie_id', ids)
          .order('created_at', { ascending: false })
        if (sErr1 && sErr2) throw sErr1 || sErr2
        rows = [...(simpleByTrailer ?? []), ...(simpleByMovie ?? [])]
        // fetch usernames for unique user_ids
        const uids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))
        if (uids.length) {
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', uids)
          const mapProfiles = new Map((profiles ?? []).map((p: any) => [p.id, p.username]))
          return rows.map(r => ({ ...r, commenterUsername: mapProfiles.get(r.user_id) ?? null })) as CommentRow[]
        }
        return rows.map(r => ({ ...r, commenterUsername: null })) as CommentRow[]
      }

      rows = [...(byTrailer ?? []), ...(byMovie ?? [])] as any[]
      // dedupe by id
      const map = new Map<string, any>()
      for (const r of rows) map.set(r.id, r)
      const merged = Array.from(map.values())
  return merged.map(r => ({ ...r, commenterUsername: (function getName(x:any){ if (!x) return null; if (Array.isArray(x)) return x[0]?.username ?? null; return x.username ?? null })(r.commenter) })) as CommentRow[]
    } catch (error) {
      throw error
    }
  }

  async function addComment(userId: string, trailerIdentifier: string, content: string) {
    // prefer canonical trailer.id when available
    const candidates = trailerIdCandidates(trailerIdentifier)
    const preferred = candidates[0]
    // First try inserting into trailer_id column; if that fails (schema uses movie_id), try movie_id
    const tryInsert = async (payload: any) => {
      const { data, error } = await supabase
        .from('comments')
        .insert([payload])
        .select('id, user_id, trailer_id, movie_id, content, created_at, likes, commenter:profiles(username)')
      return { data, error }
    }

    // attempt with trailer_id
    let res = await tryInsert({ user_id: userId, trailer_id: preferred, content })
    // If the DB reports missing trailer_id column, try movie_id fallback
    const missingTrailerId = res.error && String(res.error.message || res.error).includes("trailer_id")
    if (res.error && missingTrailerId) {
      const fb = await tryInsert({ user_id: userId, movie_id: preferred, content })
      if (!fb.error) res = fb
      else {
        // both failed, combine messages
        const combined = `${String(res.error.message || res.error)}; ${String(fb.error.message || fb.error)}`
        console.warn('addComment failed (both attempts):', combined)
        throw new Error(combined)
      }
    } else if (res.error) {
      // Other error not related to missing column — try fallback anyway but keep primary error if fallback fails
      const fb = await tryInsert({ user_id: userId, movie_id: preferred, content })
      if (!fb.error) res = fb
      else {
        const combined = `${String(res.error.message || res.error)}; ${String(fb.error.message || fb.error)}`
        console.warn('addComment failed (both attempts):', combined)
        throw new Error(combined)
      }
    }

  const r = res.data?.[0]
  if (!r) return null
  const commenterUsername = (function getName(x:any){ if (!x) return null; if (Array.isArray(x)) return x[0]?.username ?? null; return x.username ?? null })(r.commenter)
  return { ...r, commenterUsername }
  }



  return (
    <main className="max-w-[1080px] mx-auto p-4">
      <div className="flex items-start gap-6 flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <h1 className="mt-0 mb-2 text-3xl font-bold">Trailer</h1>
          <div className="relative w-full pt-[56.25%] rounded-md overflow-hidden shadow-2xl">
        {videoId ? (
          <iframe
            src={src}
            title="Trailer player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-white/10">
            <div className="text-muted">Invalid video</div>
          </div>
        )}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={async () => {
              if (!user) return alert('Please sign in to use watchlist')
              setInList(v => !v)
              try {
                const trailer: Trailer = getTrailerById(videoId) ?? { id: videoId, title: 'Unknown', youtube_id: videoId, category: 'unknown', poster_url: '' }
                await toggleWatchlist(user.id, trailer)
              } catch {
                setInList(v => !v)
              }
            }} className="px-3 py-2 rounded-sm font-semibold border border-white/10" style={{ background: inList ? 'var(--color-button)' : 'rgba(255,255,255,0.08)', color: inList ? '#1c1530' : 'var(--color-text)' }}>
              {inList ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            <button onClick={async () => {
              if (!user) return alert('Please sign in to favorite')
              setIsFav(v => !v)
              try {
                const trailer: Trailer = getTrailerById(videoId) ?? { id: videoId, title: 'Unknown', youtube_id: videoId, category: 'unknown', poster_url: '' }
                await toggleFavorite(user.id, trailer)
              } catch {
                setIsFav(v => !v)
              }
            }} className="px-3 py-2 rounded-sm border border-white/10" style={{ background: isFav ? 'var(--color-button)' : 'rgba(255,255,255,0.08)', color: isFav ? '#1c1530' : 'var(--color-text)' }}>
              {isFav ? 'Favorited' : 'Favorite'}
            </button>
          </div>
          <div className="mt-6">
            <div className="text-lg font-semibold mb-2">Comments</div>
            <form className="flex gap-2 mb-3" onSubmit={async (e) => {
              e.preventDefault()
              if (!user) return alert('Please sign in to comment')
              const content = newComment.trim()
              if (!content) return
              const optimistic: CommentRow = {
                id: `temp-${Date.now()}`,
                user_id: user.id,
                trailer_id: (getTrailerById(videoId)?.id ?? videoId),
                content,
                created_at: new Date().toISOString(),
                likes: 0,
              }
              setComments(prev => [optimistic, ...prev])
              setNewComment('')
              try {
                const saved = await addComment(user.id, videoId, content)
                if (saved) {
                  // Replace optimistic comment with persisted server row
                  setComments(prev => [
                    saved,
                    ...prev.filter(c => !c.id.toString().startsWith('temp-'))
                  ])
                } else {
                  // mark unsynced (no id)
                  setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, _unsynced: true, _error: 'Failed to save' } : c))
                }
              } catch (err: any) {
                // mark unsynced and keep optimistic visible with retry
                setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, _unsynced: true, _error: err?.message ?? 'Failed to save' } : c))
              }
            }}>
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment" className="flex-1 px-3 py-2 rounded-sm border border-white/10 bg-input text-text" />
              <button className="px-3 py-2 rounded-sm bg-button text-[#1c1530] font-semibold">Post</button>
            </form>
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-surface border border-white/10 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-semibold">{(c as any).commenterUsername ?? c.user_id}</div>
                      <div className="text-xs text-muted">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-400">Likes: {c.likes ?? 0}</div>
                  </div>
                  <div className="mb-2">{c.content}</div>
                  { (c as any)._unsynced && (
                    <div className="mt-2 text-sm text-yellow-300 flex items-center justify-between">
                      <div>Not saved: {(c as any)._error}</div>
                      <div>
                        <button onClick={async () => {
                          // retry saving this optimistic comment
                          try {
                            const { data, error } = await supabase
                              .from('comments')
                              .insert([{ trailer_id: c.trailer_id, user_id: c.user_id, content: c.content }])
                              .select('id, user_id, trailer_id, content, created_at, likes, commenter:profiles(username)')
                            if (!error && data) {
                              const r = data[0]
                              const commenterUsername = (function getName(x:any){ if (!x) return null; if (Array.isArray(x)) return x[0]?.username ?? null; return x.username ?? null })(r.commenter)
                              setComments(prev => [ { ...r, commenterUsername }, ...prev.filter(x => x.id !== c.id) ])
                            } else {
                              setComments(prev => prev.map(x => x.id === c.id ? { ...x, _unsynced: true, _error: error?.message ?? 'Failed to save' } : x))
                            }
                          } catch (err:any) {
                            setComments(prev => prev.map(x => x.id === c.id ? { ...x, _unsynced: true, _error: err?.message ?? 'Failed to save' } : x))
                          }
                        }} className="text-xs underline">Retry</button>
                      </div>
                    </div>
                  )}
                  <div>
                    <button onClick={async () => {
                      if (!user) return alert('Please sign in to like comments')
                      // optimistic count
                      setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x))
                      try {
                        const res = await toggleLikeComment(user.id, c.id)
                        // if toggle reports not liked, revert
                        if (!res || res.liked === false) {
                          setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: Math.max(0, (x.likes ?? 1) - 1) } : x))
                        }
                      } catch (e) {
                        setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: Math.max(0, (x.likes ?? 1) - 1) } : x))
                      }
                    }} className="px-2 py-1 rounded-sm border border-white/10 bg-white/5">Like</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-80 shrink-0">
          <div className="text-lg font-semibold mb-2">Related</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-white/10 rounded-md overflow-hidden">
                <div className="w-full h-[100px] bg-white/10" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}


