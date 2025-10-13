import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure we have a recovery session; if not, send back to login
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      const type = (data?.session as any)?.type
      if (!data?.session || (type && type !== 'recovery')) {
        // still allow if session exists from the email link
        // if completely missing, route to login
        if (!data?.session) navigate('/login')
      }
    })
  }, [navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setMessage('Password updated. You can now log in.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err: any) {
      setError(err.message ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-[460px] bg-surface rounded-md p-6 shadow-xl border border-white/10">
        <h1 className="mt-0 mb-4 text-3xl font-bold">Reset password</h1>
        {message && <div className="mb-3 text-[#1c1530] bg-button/90 rounded px-3 py-2">{message}</div>}
        {error && <div className="mb-3 text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}
        <form className="grid gap-3" onSubmit={onSubmit}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" type="password" className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text" />
          <button disabled={loading} className="px-4 py-3 rounded-sm bg-button text-[#1c1530] font-bold w-full">{loading ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </main>
  )
}

