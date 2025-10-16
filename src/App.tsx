// src/App.tsx
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useUser } from './hooks/useUser';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './context/UserContext';

// Pages
import Home from './pages/Home';
import Categories from './pages/Categories';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Movie from './components/Movie';
import CategoryPage from './pages/Category';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WatchlistPage from './pages/WatchlistPage';
import FavoritesPage from './pages/FavoritesPage';
import RatingsPage from './pages/RatingsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import EditInfoPage from './pages/EditInfoPage';
import PersonalInfoPage from './pages/PersonalInfoPage';

import './App.css';

// Wrappers that obtain the user themselves so routes can always be registered
const WatchlistPageWrapper: React.FC = () => <WatchlistPage />
const FavoritesPageWrapper: React.FC = () => {
  const { user } = useUser()
  return <FavoritesPage userId={user ? user.id : ''} />
}
const RatingsPageWrapper: React.FC = () => {
  const { user } = useUser()
  return <RatingsPage userId={user ? user.id : ''} />
}
const ChangePasswordPageWrapper: React.FC = () => {
  const { user } = useUser()
  return <ChangePasswordPage userId={user ? user.id : ''} />
}
const EditInfoPageWrapper: React.FC = () => {
  const { user } = useUser()
  return <EditInfoPage userId={user ? user.id : ''} />
}
const PersonalInfoPageWrapper: React.FC = () => {
  const { user } = useUser()
  return <PersonalInfoPage userId={user ? user.id : ''} />
}

function App() {
  const { user, loading } = useUser();
  const location = useLocation();

  const hideNavbarOnRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
  const showNavbar = user && !hideNavbarOnRoutes.includes(location.pathname);

  return (
    <UserProvider>
      <div>
        {showNavbar && <Navbar />}

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Auth mode="login" />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/movie/:id" element={<Movie />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<Home />} />

            {/* Profile subpages (always registered; wrappers decide how to handle missing user) */}
            <Route path="/watchlist" element={<WatchlistPageWrapper />} />
            <Route path="/favorites" element={<FavoritesPageWrapper />} />
            <Route path="/ratings" element={<RatingsPageWrapper />} />
            <Route path="/change-password" element={<ChangePasswordPageWrapper />} />
            <Route path="/edit-info" element={<EditInfoPageWrapper />} />
            <Route path="/personal-info" element={<PersonalInfoPageWrapper />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </UserProvider>
  );
}

export default App;
