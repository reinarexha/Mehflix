import { useState } from 'react'

type Mode = 'login' | 'signup' | 'forgot'

export default function Auth({ mode: initialMode = 'login' as Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)

  return (
    <main className="max-w-[460px] mx-auto my-8 p-4">
      <div className="bg-surface rounded-md p-6 shadow-xl border border-white/10">
        <h1 className="mt-0">{mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Forgot Password'}</h1>
        <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
          {mode === 'signup' && (
            <input placeholder="Name" className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text" />
          )}
          <input placeholder="Email" className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text" />
          {mode !== 'forgot' && <input placeholder="Password" type="password" className="px-3 py-3 rounded-sm border border-white/10 bg-input text-text" />}
          <button className="px-4 py-3 rounded-sm bg-button text-[#1c1530] font-bold w-full">{mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</button>
        </form>
        <div className="flex gap-2 mt-4 text-muted justify-center">
          {mode !== 'login' && <button className="bg-transparent text-button p-0 border-0" onClick={() => setMode('login')}>Login</button>}
          {mode !== 'signup' && <button className="bg-transparent text-button p-0 border-0" onClick={() => setMode('signup')}>Create account</button>}
          {mode !== 'forgot' && <button className="bg-transparent text-button p-0 border-0" onClick={() => setMode('forgot')}>Forgot password</button>}
        </div>
      </div>
    </main>
  )
}

