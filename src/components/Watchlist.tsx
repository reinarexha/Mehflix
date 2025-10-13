import { useUser } from '../context/UserContext';

export default function Watchlist() {
  const { user } = useUser();

  if (!user) return <p>Please log in to see your watchlist.</p>;

  return (
    <div>
      <h1>{user.email}'s Watchlist</h1>
      {/* Your watchlist content */}
    </div>
  );
}
