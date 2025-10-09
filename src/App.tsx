import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useUser } from './hooks/useUser'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import Movie from './pages/Movie'
import CategoryPage from './pages/Category'
import './App.css'

function App() {
  const { user } = useUser()
  const location = useLocation()

  // Hide Navbar on login/signup routes
  const hideNavbarOnRoutes = ['/', '/login', '/signup']
  const showNavbar = user && !hideNavbarOnRoutes.includes(location.pathname)

  return (
    <div>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Auth mode="login" />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
