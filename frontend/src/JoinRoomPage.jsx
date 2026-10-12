import { useState } from 'react'

export default function JoinRoomPage({ onJoin, onBack }) {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const raw = roomCode.trim()
    const path = raw.split(/[?#]/, 1)[0].replace(/\/+$/, '')
    const code = path.split('/').pop()

    const shortCode = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]{6}$/.test(code || '')
    const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code || '')
    if (!shortCode && !legacyId) {
      setError('Enter the 6-character room code or paste a valid CodeSync room link.')
      return
    }

    setError('')
    onJoin(code)
  }

  return (
    <main className="grid min-h-screen bg-[#f7f8fc] lg:grid-cols-[1fr_0.85fr]">
      <section className="flex flex-col px-5 py-7 sm:px-10 lg:px-16">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to home
        </button>
        <div className="mx-auto my-auto w-full max-w-md py-14">
          <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/70">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M8 12h8m-4-4v8M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Join your team</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-[38px]">Enter a room code</h1>
          <p className="mt-3 text-sm leading-6 text-[#566477]">Paste the invite code or the room link your teammate shared with you.</p>

          <form onSubmit={submit} className="mt-8">
            <label htmlFor="room-code" className="mb-2 block text-xs font-semibold text-slate-700">Room code or link</label>
            <input id="room-code" autoFocus value={roomCode} onChange={(event) => { setRoomCode(event.target.value); setError('') }} placeholder="e.g. a7K9xP" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            {error && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
            <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100">
              Open shared editor
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/70 p-3.5 text-[11px] leading-5 text-[#566477]">
            <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" /><path d="M10 9v4m0-6h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            No account is needed to join. The room code is the invite, so only share it with people you trust.
          </div>
        </div>
        <div className="text-[11px] text-slate-400">CodeSync · Shared code, less context switching.</div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#191b27] px-10 py-12 text-white lg:flex lg:items-center">
        <div className="absolute -right-20 -top-28 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-slate-300"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-indigo-200">&lt;/&gt;</span> One shared workspace</div>
          <h2 className="text-4xl font-bold leading-tight tracking-[-0.05em]">Pick up where the team is thinking.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">A room code takes you directly into the editor. Guests can join without creating an account.</p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-200">How joining works</span><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">3 steps</span></div>
            <div className="space-y-4">
              <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/15 text-[10px] font-bold text-indigo-200">1</span><p className="pt-1 text-xs text-slate-400">Paste the code your teammate sent.</p></div>
              <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/15 text-[10px] font-bold text-indigo-200">2</span><p className="pt-1 text-xs text-slate-400">Open the room in your browser.</p></div>
              <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/15 text-[10px] font-bold text-indigo-200">3</span><p className="pt-1 text-xs text-slate-400">Start editing together in real time.</p></div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}
