import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Create a comprehensive mock client if environment variables are not set
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY - using mock client')
  // Create a comprehensive mock supabase client for development
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log('Mock signInWithPassword called with:', { email, password })
        // Simulate a successful login for demo purposes
        return { 
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: email,
              user_metadata: { name: email.split('@')[0] }
            }, 
            session: { access_token: 'mock-token' } 
          }, 
          error: null 
        }
      },
      signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
        console.log('Mock signUp called with:', { email, password, options })
        // Simulate a successful signup for demo purposes
        return { 
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: email,
              user_metadata: options?.data || {}
            }, 
            session: null // No session for new signups until email confirmation
          }, 
          error: null 
        }
      },
      resetPasswordForEmail: async (email: string, options?: any) => {
        console.log('Mock resetPasswordForEmail called with:', { email, options })
        // Simulate a successful password reset request
        return { data: {}, error: null }
      },
      signOut: async () => {
        console.log('Mock signOut called')
        return { error: null }
      }
    }
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
