// src/pages/WatchlistPage.tsx
import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { getTrailerById, removeWatchlistRow, toggleWatchlist } from '../lib/data'
import type { Trailer } from '../lib/data'
import MovieCard from '../components/MovieCard'
import { supabase } from '../lib/supabaseClient'

const WatchlistPage: React.FC = () => {
  const { user } = useUser()
  // Track rows so duplicates (same trailer_id) can be removed individually
  const [watchlistRows, setWatchlistRows] = useState<Array<{ id: string; trailer_id: string }>>([])
  const [watchlistTrailers, setWatchlistTrailers] = useState<Trailer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setWatchlistTrailers([])
      setLoading(false)
      return
    }

    const fetchWatchlist = async () => {
      try {
        // Fetch watchlist directly from Supabase
        const { data, error } = await supabase
          .from('watchlist')
          .select('id, trailer_id')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching watchlist:', error)
          setWatchlistTrailers([])
          return
        }

        // Save rows to preserve unique row ids
        const rows: Array<{ id: string; trailer_id: string }> = (data ?? []).map((row: { id: string; trailer_id: string }) => ({ id: row.id, trailer_id: row.trailer_id }))
        setWatchlistRows(rows)

        // Map trailer IDs to full trailer objects (for display)
        const trailersData = rows
          .map((row: { id: string; trailer_id: string }) => getTrailerById(row.trailer_id))
          .filter((t: Trailer | undefined): t is Trailer => t !== undefined)

        setWatchlistTrailers(trailersData)
      } catch (err) {
        console.error('Unexpected error fetching watchlist:', err)
        setWatchlistTrailers([])
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [user])

  if (!user)
    return (
      <div className="text-white text-center mt-20">
        Please log in to see your watchlist.
      </div>
    )

  if (loading)
    return <div className="text-white text-center mt-20">Loading watchlist...</div>

  if (!watchlistTrailers.length && !watchlistRows.length)
    return <div className="text-white text-center mt-20">Your Watchlist is empty</div>

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Your Watchlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {watchlistRows.map((row, _idx) => {
          const trailer = getTrailerById(row.trailer_id)
          if (!trailer) {
            return (
              <div key={row.id} className="p-3 bg-surface border border-white/10 rounded">
                ID: {row.trailer_id}
                <div>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded mt-2"
                    onClick={async () => {
                      try {
                        await removeWatchlistRow(row.id)
                        setWatchlistRows(prev => prev.filter(r => r.id !== row.id))
                      } catch (e) {
                        console.error('Failed to remove watchlist row', e)
                        alert('Failed to remove item from watchlist. See console for details.')
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div key={row.id}>
              <MovieCard
                trailer={trailer}
                userId={user.id}
                onRemoveWatchlist={async () => {
                  try {
                    // Prefer removing the exact watchlist row by id to handle duplicates
                    await removeWatchlistRow(row.id)
                    setWatchlistRows(prev => prev.filter(r => r.id !== row.id))
                  } catch (e) {
                    console.error('Failed to remove watchlist row by id, falling back to toggle', e)
                    try {
                      await toggleWatchlist(user.id, trailer)
                      setWatchlistRows(prev => prev.filter(r => r.id !== row.id))
                    } catch (err) {
                      console.error('Fallback toggle failed', err)
                    }
                  }
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WatchlistPage
