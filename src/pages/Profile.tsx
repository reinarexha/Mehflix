// src/pages/Profile.tsx
import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getTrailerById } from '../lib/data'

const Profile: React.FC = () => {
  const { user } = useUser()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const navigate = useNavigate()

  // Fetch latest profile data
  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (error) console.log('Error fetching profile:', error.message)

      if (profileData && profileData.username) {
        setUsername(profileData.username)
      } else {
        // Fallback to auth metadata
        try {
          const { data: authData } = await supabase.auth.getUser()
          const authUser = authData.user
          const meta = (authUser as any)?.user_metadata
          setUsername(meta?.username || null)
        } catch {
          setUsername(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    const onProfileUpdated = (e: any) => {
      if (e?.detail?.username) setUsername(e.detail.username)
      else fetchProfile()
    }
    const onAuthRefreshed = () => fetchProfile()

    window.addEventListener('profile:updated', onProfileUpdated)
    window.addEventListener('auth:refreshed', onAuthRefreshed)

    return () => {
      window.removeEventListener('profile:updated', onProfileUpdated)
      window.removeEventListener('auth:refreshed', onAuthRefreshed)
    }
  }, [user])

  // Notifications: who liked my comments
  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    let mounted = true

    async function loadNotifications() {
      setNotifLoading(true)
      try {
        const userId = user.id

        // 1) fetch my comments
        const { data: myComments } = await supabase
          .from('comments')
          .select('id, content, trailer_id')
          .eq('user_id', userId)

        const commentRows = (myComments ?? []) as any[]
        const ids = commentRows.map(c => c.id)
        if (ids.length === 0) {
          if (mounted) setNotifications([])
          return
        }

        // 2) fetch likes on those comments
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('id, user_id, comment_id, created_at')
          .in('comment_id', ids)
          .order('created_at', { ascending: false })

        const likesRows = likes ?? []

        // 3) fetch usernames for likers
        const userIds = [...new Set(likesRows.map(l => l.user_id))]
        const stringIds = userIds.map(id => String(id)) // convert to string

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', stringIds)

        const profilesMap = new Map(profiles?.map(p => [String(p.id), p.username]))

        // 4) map notifications with usernames
        const mapByComment: Record<string, any> = {}
        for (const c of commentRows) mapByComment[c.id] = c

        const items = likesRows.map(l => {
          const comment = mapByComment[l.comment_id]
          const likerName = profilesMap.get(String(l.user_id)) || 'Unknown User'
          const trailerId = comment?.trailer_id || null
          const trailer = trailerId ? getTrailerById(trailerId) : undefined
          const movieLink = trailer ? `/movie/${trailer.youtube_id ?? trailer.id}` : `/movie/${trailerId}`
          return {
            id: l.id,
            likerName,
            commentContent: comment?.content || '',
            created_at: l.created_at,
            movieLink,
          }
        })

        if (mounted) setNotifications(items)
      } catch (e) {
        console.warn('Failed to load notifications', e)
      } finally {
        if (mounted) setNotifLoading(false)
      }
    }

    loadNotifications()
    return () => { mounted = false }
  }, [user])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Sign out failed', e)
    }
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
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-lg overflow-hidden text-white">
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: avatar & basic info */}
          <div className="flex flex-col items-center md:items-start md:col-span-1">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl font-bold mb-4">
              {initials}
            </div>
            <h2 className="text-xl font-bold">{username || user.email}</h2>
            <div className="mt-4 flex flex-col gap-2 w-full">
              <Link
                to="/edit-info"
                className="text-center bg-surface hover:bg-white/5 px-3 py-2 rounded-md"
              >
                Edit Info
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={fetchProfile}
                  className="text-center bg-blue-600 hover:bg-blue-700 mt-2 px-3 py-1 rounded"
                >
                  Refresh Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="text-center bg-red-600 hover:bg-red-700 mt-2 px-3 py-1 rounded"
                >
                  Log out
                </button>
              </div>
            </div>
            {/* Notifications */}
            <div className="w-full mt-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-center">Notifications</h3>
                {notifLoading ? (
                  <div className="text-center text-sm text-gray-300">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-sm text-gray-300">No notifications yet</div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {notifications.map((n) => (
                      <li key={n.id} className="p-2 bg-gray-800 rounded flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-gray-200"><strong>{n.likerName}</strong> liked your comment</div>
                          <div className="text-xs text-gray-400 truncate">"{n.commentContent}"</div>
                          <a href={n.movieLink} className="text-xs text-blue-400 mt-1 inline-block">View</a>
                        </div>
                        <div className="text-xs text-gray-500 ml-3">{new Date(n.created_at).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right: Personal Info */}
          <div className="md:col-span-2">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Personal Info</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Username:</strong> {username || 'Not set'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
