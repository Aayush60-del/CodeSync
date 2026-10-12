import { useState } from 'react'
import { saveSession, signIn, signUp } from './api.js'

export default function AuthPage({ onAuthenticated, onBack }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8 || password.length > 15) {
      setError('Password must be between 8 and 15 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') await signUp({ username: username.trim(), email: email.trim(), password })
      const session = await signIn({ username: username.trim(), password })
      saveSession(session)
      await onAuthenticated(session.user)
    } catch (requestError) {
      setError(requestError.message || 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <main className="grid min-h-screen bg-[#f7f8fc] lg:grid-cols-[1fr_0.85fr]">
      <section className="flex flex-col px-5 py-7 sm:px-10 lg:px-16">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          <span aria-hidden="true">←</span> Back to CodeSync
        </button>

        <div className="mx-auto my-auto w-full max-w-md py-14">
          <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200/70">&lt;/&gt;</div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Your shared workspace</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-[38px]">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#566477]">
            {isSignup ? 'An account is optional. Sign up if you want rooms linked to your profile.' : 'Sign in to use your CodeSync profile. You can also create or join rooms as a guest.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-xs font-semibold text-slate-700">Username</label>
              <input id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            </div>

            {isSignup && <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-700">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            </div>}

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold text-slate-700">Password</label>
              <input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={8} maxLength={15} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
              {isSignup && <p className="mt-1.5 text-[11px] text-slate-400">Use 8–15 characters.</p>}
            </div>

            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p>}

            <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-indigo-100">
              {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#566477]">
            {isSignup ? 'Already have an account?' : 'New to CodeSync?'}{' '}
            <button type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError('') }} className="font-semibold text-indigo-600 hover:text-indigo-700">
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
        <div className="text-[11px] text-slate-400">CodeSync · Shared code, less context switching.</div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#191b27] px-10 py-12 text-white lg:flex lg:items-center">
        <div className="absolute -right-20 -top-28 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-slate-300"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-indigo-200">&lt;/&gt;</span> One shared workspace</div>
          <h2 className="text-4xl font-bold leading-tight tracking-[-0.05em]">Good ideas get better when they meet.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">Create a room, invite your teammates, and work in the same editor together.</p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold text-slate-200">A calmer way to pair</p>
            <div className="mt-4 space-y-3 text-xs text-slate-400">
              <p><span className="mr-2 text-emerald-300">✓</span>One room link for your whole team</p>
              <p><span className="mr-2 text-emerald-300">✓</span>Live shared editing powered by Yjs</p>
              <p><span className="mr-2 text-emerald-300">✓</span>Your rooms are linked to your account</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}
