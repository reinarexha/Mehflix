// src/pages/WatchlistPage.tsx
import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { getTrailerById } from '../lib/data'
import type { Trailer } from '../lib/data'
import MovieCard from '../components/MovieCard'
import { supabase } from '../lib/supabaseClient'

const WatchlistPage: React.FC = () => {
  const { user } = useUser()
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
          .select('trailer_id')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching watchlist:', error)
          setWatchlistTrailers([])
          return
        }

        // Map trailer IDs to full trailer objects
        const trailersData = (data ?? [])
          .map((row: { trailer_id: string }) => getTrailerById(row.trailer_id))
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

  if (!watchlistTrailers.length)
    return <div className="text-white text-center mt-20">Your Watchlist is empty</div>

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Your Watchlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {watchlistTrailers.map((trailer, idx) => (
          <MovieCard key={`${trailer.id}-${idx}`} trailer={trailer} userId={user.id} />
        ))}
      </div>
    </div>
  )
}

export default WatchlistPage
