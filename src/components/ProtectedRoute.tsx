// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'

type Props = {
  user: any
  loading?: boolean
  children: any
}

export default function ProtectedRoute({ user, loading, children }: Props) {
  const location = useLocation()
  // Wait for auth state to resolve before deciding
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
