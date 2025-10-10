import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export type MehflixUser = {
  id: string
  email?: string
}

export function useUser() {
  const [user, setUser] = useState<MehflixUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null)
      } catch (error) {
        console.warn('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
    
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null)
      })
      return () => {
        isMounted = false
        if (sub?.subscription) {
          sub.subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.warn('Error setting up auth state change listener:', error)
      setLoading(false)
      return () => {
        isMounted = false
      }
    }
  }, [])

  return { user, loading }
}


