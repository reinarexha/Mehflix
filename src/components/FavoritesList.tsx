// src/components/FavoritesList.tsx
import React, { useEffect, useState } from 'react'
import MovieCard from './MovieCard'
import type { Trailer } from '../lib/data'
import { getTrailerById, toggleFavorite } from '../lib/data'
import { useUser } from '../hooks/useUser'

const FavoritesList: React.FC = () => {
  const { user } = useUser()
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [unknownIds, setUnknownIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/favorites/${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch favorites')
        const ids: string[] = await res.json()
        const mapped = ids.map(id => getTrailerById(id))
        const favTrailers = mapped.filter((t): t is Trailer => t !== undefined)
  const unresolved = ids.filter((_, idx) => mapped[idx] === undefined)
        setTrailers(favTrailers)
        setUnknownIds(unresolved)
      } catch (err) {
        console.error(err)
      }
    }

    fetchFavorites()
  }, [user])

  const handleRemoveFavorite = async (trailerId: string) => {
    if (!user) return
    try {
      const trailer = getTrailerById(trailerId)
      if (trailer) {
        await toggleFavorite(user.id, trailer)
        setTrailers(prev => prev.filter(t => t.id !== trailerId))
        return
      }

      // Fallback: construct a minimal trailer object so toggleFavorite can remove the favorite
      const minimal: Trailer = {
        id: trailerId,
        title: 'Unavailable',
        youtube_id: trailerId,
        category: 'Unknown',
        poster_url: '/posters/placeholder.jpg',
      }
      await toggleFavorite(user.id, minimal)
      setUnknownIds(prev => prev.filter(id => id !== trailerId))
    } catch (err) {
      console.error(err)
    }
  }

  if (!user) return <p className="text-white">Please log in to see favorites.</p>

  if (trailers.length === 0 && unknownIds.length === 0)
    return <p className="text-white">You have no favorite trailers.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {trailers.map(trailer => (
        <MovieCard
          key={trailer.id}
          trailer={trailer}
          userId={user.id}
          onRemoveFavorite={() => handleRemoveFavorite(trailer.id)}
        />
      ))}

      {unknownIds.map(id => (
        <div
          key={`unknown-${id}`}
          className="bg-gray-800 rounded overflow-hidden flex flex-col items-center justify-center p-4 text-white"
        >
          <div className="text-sm mb-2">Unavailable item</div>
          <div className="text-xs mb-3 break-all">ID: {id}</div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            onClick={() => handleRemoveFavorite(id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

export default FavoritesList
