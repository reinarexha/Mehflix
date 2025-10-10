// src/App.tsx
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useUser } from './hooks/useUser';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Movie from './pages/Movie';
import CategoryPage from './pages/Category';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  const { user } = useUser();
  const location = useLocation();

  const hideNavbarOnRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
  const showNavbar = user && !hideNavbarOnRoutes.includes(location.pathname);

  return (
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
        <Route element={<ProtectedRoute user={user}><Outlet /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<Home />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
