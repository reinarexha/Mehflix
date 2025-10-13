// src/components/Watchlist.tsx
import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import { Link } from 'react-router-dom'
import type { Trailer } from '../lib/data'
import { getTrailerById, toggleWatchlist } from '../lib/data'
import { useUser } from '../hooks/useUser'

const Watchlist: React.FC = () => {
  const { user } = useUser()
  const [trailers, setTrailers] = useState<Trailer[]>([])

  useEffect(() => {
    if (!user) return

    const fetchWatchlist = async () => {
      try {
        const res = await fetch(`/api/watchlist/${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch watchlist')
        const ids: string[] = await res.json()
        const wlTrailers = ids
          .map(id => getTrailerById(id))
          .filter((t): t is Trailer => t !== undefined)
        setTrailers(wlTrailers)
      } catch (err) {
        console.error(err)
      }
    }

    fetchWatchlist()
  }, [user])

  const handleRemoveWatchlist = async (trailerId: string) => {
    if (!user) return
    try {
      const trailer = getTrailerById(trailerId)
      if (!trailer) return
      await toggleWatchlist(user.id, trailer)
      setTrailers(prev => prev.filter(t => t.id !== trailerId))
    } catch (err) {
      console.error(err)
    }
  }

  if (!user) return <p className="text-white">Please log in to see your watchlist.</p>

  if (trailers.length === 0)
    return <p className="text-white">Your watchlist is empty.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {trailers.map((trailer, idx) => (
        <Link key={`${trailer.id}-${idx}`} to={`/movie/${trailer.youtube_id}`} className="no-underline text-inherit">
          <MovieCard
            trailer={trailer}
            userId={user.id}
            onRemoveWatchlist={() => handleRemoveWatchlist(trailer.id)}
          />
        </Link>
      ))}
    </div>
  )
}

export default Watchlist
