import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="profile-page p-4 max-w-xl mx-auto">
      <header className="profile-header flex items-center gap-4 mb-6">
        <div className="profile-avatar w-16 h-16 rounded-full bg-gray-500" />
        <div>
          <h2 className="text-xl font-semibold">{user?.displayName}</h2>
          <div className="text-gray-400">{user?.email}</div>
        </div>
        <button className="ml-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" onClick={logout}>Log out</button>
      </header>

      <section className="profile-section mb-4">
        <h3 className="text-lg font-semibold mb-2">Watchlist</h3>
        <div className="empty text-gray-400">No items yet</div>
      </section>

      <section className="profile-section mb-4">
        <h3 className="text-lg font-semibold mb-2">Favorites</h3>
        <div className="empty text-gray-400">No favorites yet</div>
      </section>

      <section className="profile-section mb-4">
        <h3 className="text-lg font-semibold mb-2">Ratings</h3>
        <div className="empty text-gray-400">No ratings yet</div>
      </section>

      <section className="profile-section mb-4">
        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
        <ul className="notifications list-disc list-inside text-gray-400">
          <li>Reminder alerts will appear here.</li>
          <li>Likes and comments on your posts will appear here.</li>
        </ul>
      </section>

      <section className="profile-section">
        <h3 className="text-lg font-semibold mb-2">Account</h3>
        <div className="account-grid grid grid-cols-3 gap-2">
          <Link to="#" className="account-card bg-gray-700 p-2 rounded text-center hover:bg-gray-600">Change password</Link>
          <Link to="#" className="account-card bg-gray-700 p-2 rounded text-center hover:bg-gray-600">Edit info</Link>
          <Link to="#" className="account-card bg-gray-700 p-2 rounded text-center hover:bg-gray-600">Personal info</Link>
        </div>
      </section>
    </div>
  );
}
