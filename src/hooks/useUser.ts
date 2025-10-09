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
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null)
      setLoading(false)
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null)
    })
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}


