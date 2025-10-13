// src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { Link } from 'react-router-dom';

type ProfileProps = {
  userId: string;
};

const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const { user } = useUser();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const meta = (user as any).user_metadata;
      setUsername(meta?.username || null);
    }
    setLoading(false);
  }, [user]);

  if (loading) return <div className="text-white text-center mt-20">Loading profile...</div>;
  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Guest User</h1>
          <p>Please log in to see your profile.</p>
        </div>
      </div>
    );

  return (
    <div className="flex justify-center bg-gray-900 min-h-screen p-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{username || user.email}</h2>
          <p className="text-gray-300">{user.email}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Link to="/edit-info" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold">
            Edit Info
          </Link>
          <Link to="/change-password" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold">
            Change Password
          </Link>
          <Link to="/watchlist" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold">
            Watchlist
          </Link>
          <Link to="/favorites" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold">
            Favorites
          </Link>
          <Link to="/ratings" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold">
            Ratings
          </Link>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-center mb-4">Personal Info</h3>
          <p className="mb-2">
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Username:</strong> {username || 'Not set'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
