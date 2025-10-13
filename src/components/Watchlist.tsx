// src/components/Watchlist.tsx
import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import { Link } from 'react-router-dom'
import { getTrailerById, toggleWatchlist, removeWatchlistRow } from '../lib/data'
import { useUser } from '../hooks/useUser'

const Watchlist: React.FC = () => {
  const { user } = useUser()
  // Keep rows so duplicate trailer entries can be removed individually
  const [rows, setRows] = useState<Array<{ id: string; trailer_id: string }>>([])

  useEffect(() => {
    if (!user) return

    const fetchWatchlist = async () => {
      try {
        const res = await fetch(`/api/watchlist/${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch watchlist')
        const data: Array<{ id: string; trailer_id: string }> = await res.json()
        setRows(data)
        // we only need rows now; trailers will be derived when rendering
      } catch (err) {
        console.error(err)
      }
    }

    fetchWatchlist()
  }, [user])

  const handleRemoveWatchlist = async (rowId: string, trailerId: string) => {
    if (!user) return
      try {
        // Prefer removing a specific row to handle duplicates
        await removeWatchlistRow(rowId)
        setRows(prev => prev.filter(r => r.id !== rowId))
      } catch (err) {
      console.error('Failed to remove watchlist row, falling back to toggle', err)
      try {
        const trailer = getTrailerById(trailerId)
        if (!trailer) return
        await toggleWatchlist(user.id, trailer)
        // Remove only one occurrence of this trailer_id from rows to avoid clearing duplicates
        setRows(prev => {
          const idx = prev.findIndex(r => r.trailer_id === trailerId)
          if (idx === -1) return prev
          return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (!user) return <p className="text-white">Please log in to see your watchlist.</p>

  if (rows.length === 0)
    return <p className="text-white">Your watchlist is empty.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {rows.map((row) => {
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
                      await handleRemoveWatchlist(row.id, row.trailer_id)
                    } catch (err) {
                      console.error('Remove failed', err)
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
          <Link key={row.id} to={`/movie/${trailer.youtube_id}`} className="no-underline text-inherit">
            <MovieCard
              trailer={trailer}
              userId={user.id}
              onRemoveWatchlist={() => handleRemoveWatchlist(row.id, trailer.id)}
            />
          </Link>
        )
      })}
    </div>
  )
}

export default Watchlist
