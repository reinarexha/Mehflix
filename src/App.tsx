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
import Movie from './pages/Movie';
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

// Wrappers so TypeScript knows these pages receive userId
const WatchlistPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <WatchlistPage userId={userId} />
);
const FavoritesPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <FavoritesPage userId={userId} />
);
const RatingsPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <RatingsPage userId={userId} />
);
const ChangePasswordPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <ChangePasswordPage userId={userId} />
);
const EditInfoPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <EditInfoPage userId={userId} />
);
const PersonalInfoPageWrapper: React.FC<{ userId: string }> = ({ userId }) => (
  <PersonalInfoPage userId={userId} />
);

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
            <Route path="/profile" element={user ? <Profile userId={user.id} /> : <Navigate to="/login" replace />} />
            <Route path="/movie/:id" element={<Movie />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<Home />} />

            {/* Profile subpages */}
            {user && (
              <>
                <Route path="/watchlist" element={<WatchlistPageWrapper userId={user.id} />} />
                <Route path="/favorites" element={<FavoritesPageWrapper userId={user.id} />} />
                <Route path="/ratings" element={<RatingsPageWrapper userId={user.id} />} />
                <Route path="/change-password" element={<ChangePasswordPageWrapper userId={user.id} />} />
                <Route path="/edit-info" element={<EditInfoPageWrapper userId={user.id} />} />
                <Route path="/personal-info" element={<PersonalInfoPageWrapper userId={user.id} />} />
              </>
            )}
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </UserProvider>
  );
}

export default App;
