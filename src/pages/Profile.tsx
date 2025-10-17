import { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useUser } from "../hooks/useUser"
import { supabase } from "../lib/supabaseClient"

import {
  fetchWatchlist,
  fetchFavorites,
  clearUserData,
  cleanInvalidUserData
} from '../lib/data'
import { getMovieById } from '../lib/trailers'

type Trailer = {
  id: string
  title: string
  youtube_id?: string
  category?: string
  poster_url?: string
}

const Profile: React.FC = () => {
  const { user } = useUser()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState<any[]>([])
  const [notifLoading, setNotifLoading] = useState(false)

  const [watchlist, setWatchlist] = useState<Trailer[]>([])
  const [favorites, setFavorites] = useState<Trailer[]>([])

  const [moviesLoading, setMoviesLoading] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [cleaningData, setCleaningData] = useState(false)

  const navigate = useNavigate()
  const location = useLocation() // <-- for refresh after EditInfo

  // ---------------- Profile ----------------
  const fetchProfile = async () => {
    if (!user) return
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (error) console.log('Error fetching profile:', error.message)
      setUsername(profileData?.username ?? '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user, location.key]) // <-- refresh when navigating back from EditInfo

  // ---------------- Notifications ----------------
  useEffect(() => {
    if (!user) return

    let mounted = true
    const cutoffDate = new Date('2025-10-16') // Replace with your DB reset date

    const loadNotifications = async () => {
      setNotifLoading(true)
      try {
        const { data: myComments } = await supabase
          .from('comments')
          .select('id, content, trailer_id')
          .eq('user_id', user.id)

        const commentRows = myComments ?? []
        const commentIds = commentRows.map((c) => c.id)
        if (commentIds.length === 0) {
          if (mounted) setNotifications([])
          return
        }

        const { data: likes } = await supabase
          .from('comment_likes')
          .select('id, comment_id, created_at')
          .in('comment_id', commentIds)
          .order('created_at', { ascending: false })

        const recentLikes = (likes ?? []).filter(
          (l) => new Date(l.created_at) >= cutoffDate
        )

        const commentMap: Record<string, any> = {}
        for (const c of commentRows) commentMap[c.id] = c

        const items = await Promise.all(
          recentLikes.map(async (l) => {
            const comment = commentMap[l.comment_id]
            const trailerId = comment?.trailer_id || null
            const trailer = trailerId ? await getMovieById(trailerId) : undefined
            const movieLink = trailer
              ? `/movie/${trailer.youtube_id ?? trailer.id}`
              : `/movie/${trailerId}`

            return {
              id: l.id,
              likerName: 'A watcher agrees with you',
              commentContent: comment?.content || '',
              created_at: l.created_at,
              movieLink
            }
          })
        )

        if (mounted) setNotifications(items)
      } catch (e) {
        console.warn('Failed to load notifications', e)
      } finally {
        if (mounted) setNotifLoading(false)
      }
    }

    loadNotifications()
    return () => {
      mounted = false
    }
  }, [user])

  // ---------------- Watchlist & Favorites ----------------
  const loadMovies = async () => {
    if (!user) {
      setWatchlist([])
      setFavorites([])
      return
    }

    setMoviesLoading(true)
    try {
      console.log('🔄 Loading movies for user:', user.id)


      const [wl, favs] = await Promise.all([
        fetchWatchlist(user.id),
        fetchFavorites(user.id)
      ])

      console.log('📥 Raw watchlist data:', wl)
      console.log('📥 Raw favorites data:', favs)


      const validWatchlist = wl.filter(
        (trailer) =>
          trailer &&
          trailer.title &&
          trailer.title !== 'Unknown' &&
          trailer.title !== 'Unknown Title' &&
          trailer.poster_url &&
          !trailer.poster_url.includes('placeholder.com')
      )

      const validFavorites = favs.filter(
        (trailer) =>
          trailer &&
          trailer.title &&
          trailer.title !== 'Unknown' &&
          trailer.title !== 'Unknown Title' &&
          trailer.poster_url &&
          !trailer.poster_url.includes('placeholder.com')
      )

      console.log('✅ Valid watchlist count:', validWatchlist.length)
      console.log('✅ Valid favorites count:', validFavorites.length)

      setWatchlist(validWatchlist)
      setFavorites(validFavorites)
    } catch (e) {
      console.error('❌ Failed to load movies', e)
      setWatchlist([])
      setFavorites([])
    } finally {
      setMoviesLoading(false)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [user])

  // ---------------- Clean Invalid Data ----------------
  const handleCleanData = async () => {
    if (!user) return

    const confirmClean = window.confirm(
      'This will remove any corrupted or invalid movie entries from your watchlist and favorites. Continue?'
    )

    if (!confirmClean) return

    setCleaningData(true)
    try {
      const result = await cleanInvalidUserData(user.id)
      if (result.success) {
        alert(`✅ ${result.message}`)
        await loadMovies()
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (error) {
      alert('❌ Failed to clean data')
      console.error('Error cleaning data:', error)
    } finally {
      setCleaningData(false)
    }
  }

  // ---------------- Clear All Data ----------------
  const handleClearData = async () => {
    if (!user) return

    const confirmClear = window.confirm(
      'Are you sure you want to clear ALL your watchlist and favorites data? This cannot be undone.'
    )

    if (!confirmClear) return

    setClearingData(true)
    try {
      const result = await clearUserData(user.id)
      if (result.success) {
        alert(`✅ ${result.message}`)
        await loadMovies()
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (error) {
      alert('❌ Failed to clear data')
      console.error('Error clearing data:', error)
    } finally {
      setClearingData(false)
    }
  }

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    navigate('/login')
  }

  if (loading)
    return <div className="text-white text-center mt-20">Loading profile...</div>

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Guest User</h1>
          <p>Please log in to see your profile.</p>
        </div>
      </div>
    )

  const initials = (username || user.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Personal Info */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">{user.email}</h2>
              <p className="text-gray-400 text-sm mb-4">
                Username: {username || 'N/A'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  to="/edit-info"
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
                >
                  Edit Info
                </Link>
                <button
                  onClick={loadMovies}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  Refresh Profile
                </button>
                <button
                  onClick={handleCleanData}
                  disabled={cleaningData}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {cleaningData ? 'Cleaning...' : 'Clean Invalid Data'}
                </button>
                <button
                  onClick={handleClearData}
                  disabled={clearingData}
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {clearingData ? 'Clearing...' : 'Clear All Data'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Watchlist</h3>
            <span className="text-sm text-gray-400">{watchlist.length} items</span>
          </div>
          {moviesLoading ? (
            <div className="text-gray-300 text-center py-8">Loading...</div>
          ) : watchlist.length === 0 ? (
            <div className="text-gray-400 text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
              <div className="text-xl mb-2">📺</div>
              <div>No movies in watchlist</div>
              <div className="text-sm mt-2 text-gray-500">
                Add movies from the home page to see them here
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
              {watchlist.map((m) => (
                <div key={m.id} className="flex-shrink-0 w-40">
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    className="w-full h-56 object-cover rounded-lg hover:scale-105 transition-transform duration-200 shadow-lg"
                    onError={(e) => {

                      console.warn('❌ Image failed to load:', m.title, m.poster_url)

                      ;(e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300x450/374151/FFFFFF?text=No+Poster'
                    }}
                  />
                  <div className="mt-3 text-sm font-medium text-center truncate px-1">
                    {m.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Favorites</h3>
            <span className="text-sm text-gray-400">{favorites.length} items</span>
          </div>
          {moviesLoading ? (
            <div className="text-gray-300 text-center py-8">Loading...</div>
          ) : favorites.length === 0 ? (
            <div className="text-gray-400 text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
              <div className="text-xl mb-2">⭐</div>
              <div>No favorite movies</div>
              <div className="text-sm mt-2 text-gray-500">
                Favorite movies from the home page to see them here
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
              {favorites.map((m) => (
                <div key={m.id} className="flex-shrink-0 w-40">
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    className="w-full h-56 object-cover rounded-lg hover:scale-105 transition-transform duration-200 shadow-lg"
                    onError={(e) => {

                      console.warn('❌ Image failed to load:', m.title, m.poster_url)

                      ;(e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300x450/374151/FFFFFF?text=No+Poster'
                    }}
                  />
                  <div className="mt-3 text-sm font-medium text-center truncate px-1">
                    {m.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <span className="text-sm text-gray-400">
              {notifications.length} items
            </span>
          </div>
          {notifLoading ? (
            <div className="text-gray-300 text-center py-8">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-400 text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
              <div className="text-xl mb-2">🔔</div>
              <div>No notifications yet</div>
              <div className="text-sm mt-2 text-gray-500">
                You'll get notifications when others interact with your comments
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex-shrink-0 w-80 bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  <div className="text-gray-200 text-sm font-medium mb-2">
                    {n.likerName}
                  </div>
                  <div className="text-gray-100 text-sm mb-3 line-clamp-2 bg-gray-800 p-2 rounded">
                    {n.commentContent}
                  </div>
                  <Link
                    to={n.movieLink}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-block bg-blue-900/20 px-3 py-1 rounded"
                  >
                    Go to movie →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
