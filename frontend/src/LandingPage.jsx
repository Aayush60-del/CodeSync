import { useState } from 'react'

function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5" aria-label="CodeSync home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/70">
        <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]" aria-hidden="true">
          <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-[-0.04em] text-slate-950">CodeSync</span>
    </a>
  )
}

export default function LandingPage({ onCreateRoom, onJoinRoom, onSignIn, onSignOut, user, creatingRoom, actionError }) {
  const [roomCode, setRoomCode] = useState('')
  const [joinError, setJoinError] = useState('')

  function join(event) {
    event.preventDefault()
    const code = roomCode.trim().split(/[?#]/, 1)[0].replace(/\/+$/, '').split('/').pop()
    const shortCode = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]{6}$/.test(code || '')
    const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code || '')
    if (!shortCode && !legacyId) {
      setJoinError('Enter a 6-character room code or room link.')
      return
    }
    setJoinError('')
    onJoinRoom(code)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      <header className="relative z-10 mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-3 sm:gap-6">
          <a href="#how-it-works" className="hidden text-sm font-medium text-[#566477] transition hover:text-slate-900 sm:block">How it works</a>
          <button type="button" onClick={onJoinRoom} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">Join a room</button>
          {user ? <>
            <span className="hidden max-w-28 truncate text-xs font-medium text-[#566477] sm:block">{user.username}</span>
            <button type="button" onClick={onSignOut} className="rounded-lg px-2 py-2 text-xs font-semibold text-[#566477] transition hover:bg-slate-100 hover:text-slate-900">Sign out</button>
          </> : <button type="button" onClick={onSignIn} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">Sign in</button>}
          <button type="button" disabled={creatingRoom} onClick={onCreateRoom} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-indigo-100">{creatingRoom ? 'Creating…' : 'Start coding'}</button>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -left-44 top-14 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
          <div className="relative z-10 max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-100">
                <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" aria-hidden="true"><path d="m10 2 1.55 4.45L16 8l-4.45 1.55L10 14l-1.55-4.45L4 8l4.45-1.55L10 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
              </span>
              A shared space for good ideas
            </div>
            <h1 className="max-w-[620px] text-[42px] font-bold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-[56px] lg:text-[62px]">Build something<br className="hidden sm:block" /> better, <span className="text-indigo-600">together.</span></h1>
            <p className="mt-6 max-w-lg text-[16px] leading-7 text-[#566477] sm:text-[17px]">A calm, shared code room for thinking out loud, pairing up, and making progress in real time.</p>
            <p className="mt-2 text-xs text-[#626d7d]">Accounts are optional. Create a room or join one with a code, no sign-up needed.</p>
            {actionError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">{actionError}</p>}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" disabled={creatingRoom} onClick={onCreateRoom} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-indigo-100">
                {creatingRoom ? 'Creating room…' : 'Create a room'}
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" onClick={onJoinRoom} className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Join with a room code</button>
            </div>

            <div className="mt-9 flex items-center gap-3 text-xs text-[#626d7d]">
              <div className="flex -space-x-2">
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f8fc] bg-indigo-100 text-[9px] font-bold text-indigo-700">A</span>
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f8fc] bg-emerald-100 text-[9px] font-bold text-emerald-700">M</span>
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f8fc] bg-amber-100 text-[9px] font-bold text-amber-700">R</span>
              </div>
              <span>One room link gets everyone to the same editor.</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
            <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-indigo-100/70 via-sky-50 to-violet-100/70 blur-2xl" />
            <div className="relative rotate-[1deg] rounded-[22px] border border-white/90 bg-white p-2.5 shadow-[0_35px_90px_-38px_rgba(45,55,100,0.38)]">
              <div className="overflow-hidden rounded-[16px] bg-[#171a20]">
                <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#20242b] px-4">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /><span className="ml-3 font-mono text-[11px] text-slate-300">solution.js</span></div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> room live</div>
                </div>
                <div className="grid min-h-[285px] grid-cols-[42px_1fr] px-4 py-5 sm:min-h-[330px] sm:px-6 sm:py-7">
                  <div className="select-none pr-4 text-right font-mono text-[11px] leading-[2.2] text-slate-400">01<br />02<br />03<br />04<br />05<br />06<br />07<br />08</div>
                  <div className="font-mono text-[12px] leading-[2.2] sm:text-[13px]">
                    <div><span className="text-violet-300">const</span> <span className="text-sky-200">makeItTogether</span> <span className="text-slate-300">=</span> <span className="text-amber-200">(ideas)</span> <span className="text-slate-300">=&gt; {'{'}</span></div>
                    <div className="pl-5"><span className="text-violet-300">return</span> <span className="text-slate-300">ideas.</span><span className="text-sky-200">map</span><span className="text-slate-300">((idea) =&gt; {'{'}</span></div>
                    <div className="pl-10"><span className="text-violet-300">const</span> <span className="text-sky-200">nextStep</span> <span className="text-slate-300">=</span> <span className="text-emerald-200">collaborate</span><span className="text-slate-300">(idea);</span></div>
                    <div className="pl-10"><span className="text-violet-300">return</span> <span className="text-sky-200">nextStep</span><span className="text-slate-300">;</span></div>
                    <div className="pl-5"><span className="text-slate-300">{'}'});</span></div>
                    <div><span className="text-slate-300">{'}'};</span></div>
                    <div className="mt-3"><span className="text-slate-300">// Good work happens together.</span></div>
                    <div className="mt-1"><span className="text-sky-200">makeItTogether</span><span className="text-slate-300">(</span><span className="rounded-sm bg-indigo-400/20 px-0.5 text-indigo-100">shared ideas</span><span className="text-slate-300">);</span><span className="ml-0.5 inline-block h-4 w-0.5 translate-y-1 bg-indigo-300" /></div>
                  </div>
                </div>
                <div className="flex h-10 items-center justify-between border-t border-white/[0.08] bg-[#20242b] px-4 text-[10px] text-slate-300"><span>JavaScript · UTF-8</span><span>Yjs keeps edits in sync</span></div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.35)] sm:-left-10">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M7 12.5 10.2 16 17.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /></svg></span>
              <div><div className="text-xs font-semibold text-slate-800">Edits stay in sync</div><div className="mt-0.5 text-[10px] text-[#626d7d]">One room, one shared document</div></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">How CodeSync works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">Three steps to a shared editor.</h2>
            <div id="how-it-works" className="mt-5 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
                <p className="font-mono text-xs font-bold text-indigo-600">01</p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">Create a room</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#566477]">Start with a shared coding space. No account required.</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
                <p className="font-mono text-xs font-bold text-indigo-600">02</p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">Share the code</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#566477]">Send the 6-character room code or invite link.</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
                <p className="font-mono text-xs font-bold text-indigo-600">03</p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">Code together</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#566477]">Everyone sees edits and live cursors in the same editor.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="join-room" className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8">
          <div className="flex flex-col justify-between gap-4 border-t border-slate-200 pt-7 sm:flex-row sm:items-center">
            <div><p className="text-sm font-semibold text-slate-800">Have a room code?</p><p className="mt-1 text-xs text-[#566477]">Enter it to jump straight into the shared editor.</p></div>
            <form onSubmit={join} className="flex w-full max-w-md gap-2">
              <div className="min-w-0 flex-1">
                <input value={roomCode} onChange={(event) => { setRoomCode(event.target.value); setJoinError('') }} placeholder="e.g. a7K9xP" aria-label="Room code" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                {joinError && <p role="alert" className="mt-1 text-[11px] text-rose-600">{joinError}</p>}
              </div>
              <button type="submit" className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Join room</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-[11px] text-[#626d7d] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} CodeSync</span><span>Made for the moments when two minds are better than one.</span>
        </div>
      </footer>
    </div>
  )
}
