// src/components/MovieCard.tsx
import React from 'react'
import type { Trailer } from '../lib/data'

type MovieCardProps = {
  /** prefer using `movie`; `trailer` is kept for backward-compat */
  movie?: Trailer
  trailer?: Trailer
  userId?: string
  showDate?: boolean
  onRemoveFavorite?: (trailerId: string) => Promise<void>
  onRemoveWatchlist?: (trailerId: string) => Promise<void>
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  trailer,
  onRemoveFavorite,
  onRemoveWatchlist,
  showDate = true,
}) => {
  const t = movie ?? trailer
  if (!t) return null

  // Use the poster_url from the trailer object, or create a fallback
  const posterUrl = t.poster_url || `https://via.placeholder.com/300x450/1f2937/9ca3af?text=${encodeURIComponent(t.title || 'Movie')}`
  
  const releaseDate = (t as any).releaseDate 
    ? new Date((t as any).releaseDate).toLocaleDateString() 
    : (t.category || 'Unknown Release')

  return (
    <div className="bg-gray-800 rounded shadow hover:shadow-lg transition p-2 flex flex-col">
      <img
        src={posterUrl}
        alt={t.title}
        className="w-full h-48 object-cover rounded mb-2 bg-gray-700"
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(`
            <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#1f2937"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
                ${t.title || 'No Poster'}
              </text>
            </svg>
          `)}`;
        }}
      />
      <h3 className="text-white font-semibold text-sm md:text-base truncate">{t.title}</h3>
      {showDate && <p className="text-gray-400 text-xs">{releaseDate}</p>}

      <div className="mt-2 flex gap-2 justify-center">
        {onRemoveFavorite && (
          <button
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRemoveFavorite(t.id)
            }}
          >
            Remove Favorite
          </button>
        )}
        {onRemoveWatchlist && (
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRemoveWatchlist(t.id)
            }}
          >
            Remove from Watchlist
          </button>
        )}
      </div>
    </div>
  )
}

export default MovieCard