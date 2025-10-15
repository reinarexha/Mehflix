// src/components/Watchlist.tsx
import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import { Link } from 'react-router-dom'
import { getTrailerById, toggleWatchlist, removeWatchlistRow, fetchWatchlist } from '../lib/data'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../hooks/useUser'

const Watchlist: React.FC = () => {
  const { user, loading } = useUser()
  // Keep rows so duplicate trailer entries can be removed individually
  const [rows, setRows] = useState<Array<{ id: string; trailer_id: string }>>([])

  useEffect(() => {
    if (loading) return
    if (!user) return

    const fetchWatchlistLocal = async () => {
      try {
        const rows = await fetchWatchlist(user.id)
        // fetchWatchlist returns Trailer[], but Watchlist component expects rows (id + trailer_id)
        // Convert trailers into row-like objects using trailer.id as trailer_id and generate a synthetic row id
        const mapped = rows.map((t, idx) => ({ id: `${t.id}-${idx}`, trailer_id: t.id }))
        setRows(mapped)
      } catch (err) {
        console.error(err)
      }
    }

    fetchWatchlistLocal()
  }, [user])

  // Debug helper: fetch raw watchlist rows directly from Supabase
  const [rawRows, setRawRows] = useState<Array<{ id: string; trailer_id: string }>>([])
  const [showDebug, setShowDebug] = useState(false)
  useEffect(() => {
    if (loading) return
    if (!user) return
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.from('watchlist').select('id,trailer_id').eq('user_id', user.id)
        if (!mounted) return
        setRawRows((data as any) ?? [])
      } catch (e) {
        console.warn('Failed to load raw watchlist rows', e)
      }
    })()
    return () => { mounted = false }
  }, [user, rows])

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

  if (loading) return <p className="text-white">Checking sign-in status…</p>
  if (!user) return <p className="text-white">Please log in to see your watchlist.</p>

  if (rows.length === 0)
    return (
      <div>
        <p className="text-white">Your watchlist is empty.</p>
        <div className="mt-2">
          <button onClick={() => setShowDebug(v => !v)} className="text-xs underline">Toggle debug</button>
          {showDebug && (
              <div className="mt-2 text-sm text-gray-300">
                <div className="mb-2">Auth debug (from useUser()):</div>
                <pre className="text-xs bg-black/20 p-2 rounded mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify({ user: user ?? null, loading }, null, 2)}
                </pre>
                <div className="mb-2">Raw watchlist rows (from supabase.watchlist):</div>
                {rawRows.length === 0 ? <div className="text-xs">(no rows)</div> : rawRows.map(r => <div key={r.id}>{r.id} → {r.trailer_id}</div>)}
              </div>
          )}
        </div>
      </div>
    )

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
