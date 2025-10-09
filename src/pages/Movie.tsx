import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { addComment, fetchComments, toggleFavorite, toggleLikeComment, toggleWatchlist, type CommentRow } from '../lib/data'

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
      } catch {}
    }
    run()
  }, [videoId])

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
              try { await toggleWatchlist(user.id, videoId) } catch { setInList(v => !v) }
            }} className="px-3 py-2 rounded-sm font-semibold border border-white/10" style={{ background: inList ? 'var(--color-button)' : 'rgba(255,255,255,0.08)', color: inList ? '#1c1530' : 'var(--color-text)' }}>
              {inList ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            <button onClick={async () => {
              if (!user) return alert('Please sign in to favorite')
              setIsFav(v => !v)
              try { await toggleFavorite(user.id, videoId) } catch { setIsFav(v => !v) }
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
                trailer_id: videoId,
                content,
                created_at: new Date().toISOString(),
                likes: 0,
              }
              setComments(prev => [optimistic, ...prev])
              setNewComment('')
              try {
                await addComment(user.id, videoId, content)
                const rows = await fetchComments(videoId)
                setComments(rows)
              } catch {
                // rollback
                setComments(prev => prev.filter(c => c.id !== optimistic.id))
              }
            }}>
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment" className="flex-1 px-3 py-2 rounded-sm border border-white/10 bg-input text-text" />
              <button className="px-3 py-2 rounded-sm bg-button text-[#1c1530] font-semibold">Post</button>
            </form>
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-surface border border-white/10 rounded-md p-3">
                  <div className="text-sm text-muted mb-1">{new Date(c.created_at).toLocaleString()}</div>
                  <div className="mb-2">{c.content}</div>
                  <button onClick={async () => {
                    if (!user) return alert('Please sign in to like comments')
                    // optimistic count
                    setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x))
                    try { await toggleLikeComment(user.id, c.id) } catch { setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: Math.max(0, (x.likes ?? 1) - 1) } : x)) }
                  }} className="px-2 py-1 rounded-sm border border-white/10 bg-white/5">Like ({c.likes ?? 0})</button>
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


