import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

type Mode = 'login' | 'signup' | 'forgot'

export default function Auth({ mode: initialMode = 'login' as Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        setMessage('Logged in successfully')
        navigate('/home')
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (err) throw err
        setMessage('Account created. Please check your email to confirm.')
        navigate('/login')
      } else if (mode === 'forgot') {
        // Updated: redirectTo points to /reset-password instead of /login
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        })
        if (err) throw err
        setMessage('Password reset email sent. Please check your inbox.')
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="w-full max-w-[460px] bg-surface rounded-md p-6 shadow-xl border border-white/10">
        <h1 className="mt-6 mb-4 text-4xl font-semibold text-center text-white">
          {mode === 'login'
            ? 'Login'
            : mode === 'signup'
            ? 'Create Account'
            : 'Forgot Password'}
        </h1>

        {message && (
          <div className="mb-3 text-[#1c1530] bg-button/90 rounded px-3 py-2">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form className="grid gap-3" onSubmit={onSubmit}>
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete='on'
            type="email"
            className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text"
          />
          {mode !== 'forgot' && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text"
            />
          )}
          <button
            disabled={loading}
            className="px-4 py-3 rounded-sm bg-button text-[#1c1530] font-bold w-full hover:opacity-90 transition"
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Login'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {mode === 'login' && (
            <>
              <div className="text-muted">
                Don’t have an account?{' '}
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('signup')}
                >
                  Sign up now!
                </button>
              </div>
              <div>
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="text-muted">
                Already have an account?{' '}
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
              </div>
              <div>
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="text-muted">
                Remembered your password?{' '}
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
              </div>
              <div className="text-muted">
                Don’t have an account?{' '}
                <button
                  className="bg-transparent text-button p-0 border-0"
                  onClick={() => setMode('signup')}
                >
                  Sign up now!
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
