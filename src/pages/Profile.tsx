// src/pages/Profile.tsx
import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { Link } from 'react-router-dom'

const Profile: React.FC = () => {
  const { user } = useUser()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const meta = (user as any).user_metadata
      setUsername(meta?.username || null)
    }
    setLoading(false)
  }, [user])

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

  const initials = (username || user.email || 'U').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

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
            <p className="text-gray-300 mt-1">{user.email}</p>
            <div className="mt-4 flex flex-col gap-2 w-full">
              <Link to="/edit-info" className="text-center bg-surface hover:bg-white/5 px-3 py-2 rounded-md">Edit Info</Link>
              <Link to="/change-password" className="text-center bg-surface hover:bg-white/5 px-3 py-2 rounded-md">Change Password</Link>
            </div>
          </div>

          {/* Middle: stats & quick links */}
          <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">My Activity</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Link to="/watchlist" className="bg-gray-800 rounded-md p-3">
                  <div className="text-xl font-bold">—</div>
                  <div className="text-xs text-gray-300">Watchlist</div>
                </Link>
                <Link to="/favorites" className="bg-gray-800 rounded-md p-3">
                  <div className="text-xl font-bold">—</div>
                  <div className="text-xs text-gray-300">Favorites</div>
                </Link>
                <Link to="/ratings" className="bg-gray-800 rounded-md p-3">
                  <div className="text-xl font-bold">—</div>
                  <div className="text-xs text-gray-300">Ratings</div>
                </Link>
              </div>
            </div>

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
