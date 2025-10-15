import React from 'react'

// Import all posters
import id1 from '../assets/posters/id1.jpg'
import id2 from '../assets/posters/id2.jpg'
import id3 from '../assets/posters/id3.jpg'
import id4 from '../assets/posters/id4.jpg'
import id5 from '../assets/posters/id5.jpg'
import id6 from '../assets/posters/id6.jpg'
import id7 from '../assets/posters/id7.jpg'
import id8 from '../assets/posters/id8.webp'
import id9 from '../assets/posters/id9.jpg'
import id10 from '../assets/posters/id10.jpg'
import id11 from '../assets/posters/id11.webp'
import id12 from '../assets/posters/id12.jpg'
import id13 from '../assets/posters/id13.webp'
import id14 from '../assets/posters/id14.jpg'
import id15 from '../assets/posters/id15.jpg'
import id16 from '../assets/posters/id16.jpg'
import id17 from '../assets/posters/id17.jpg'
import id18 from '../assets/posters/id18.jpg'
import id19 from '../assets/posters/id19.jpg'
import id20 from '../assets/posters/id20.jpg'
import id21 from '../assets/posters/id21.jpg'
import id22 from '../assets/posters/id22.jpg'
import id23 from '../assets/posters/id23.webp'
import id24 from '../assets/posters/id24.jpg'
import id25 from '../assets/posters/id25.jpg'
import id26 from '../assets/posters/id26.jpg'
import id27 from '../assets/posters/id27.jpg'
import id28 from '../assets/posters/id28.jpg'
import id29 from '../assets/posters/id29.jpg'
import id30 from '../assets/posters/id30.jpg'

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

const posterMap: Record<string, string> = {
  '1': id1,
  '2': id2,
  '3': id3,
  '4': id4,
  '5': id5,
  '6': id6,
  '7': id7,
  '8': id8,
  '9': id9,
  '10': id10,
  '11': id11,
  '12': id12,
  '13': id13,
  '14': id14,
  '15': id15,
  '16': id16,
  '17': id17,
  '18': id18,
  '19': id19,
  '20': id20,
  '21': id21,
  '22': id22,
  '23': id23,
  '24': id24,
  '25': id25,
  '26': id26,
  '27': id27,
  '28': id28,
  '29': id29,
  '30': id30,
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

  const posterUrl = posterMap[t.id] || '/default-poster.jpg'
  const releaseDate = (t as any).releaseDate ? new Date((t as any).releaseDate).toLocaleDateString() : (t.category || 'Unknown Release')

  return (
    <div className="bg-gray-800 rounded shadow hover:shadow-lg transition p-2 flex flex-col">
      <img
        src={posterUrl}
        alt={t.title}
        className="w-full h-48 object-cover rounded mb-2"
      />
      <h3 className="text-white font-semibold text-sm md:text-base">{t.title}</h3>
  {showDate && <p className="text-gray-400 text-xs">{releaseDate}</p>}

      <div className="mt-2 flex gap-2 justify-center">
        {onRemoveFavorite && (
          <button
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
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
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded"
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
