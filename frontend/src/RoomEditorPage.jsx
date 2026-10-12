import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { getRoom, readSessionUser } from './api.js'
import CollaborativeEditor from './CollaborativeEditor.jsx'
import { connectYjsRoom } from './yjsRoomProvider.js'

const seedKey = (roomCode) => `codesync:seed:${roomCode}`
const starterCode = [
  '// Welcome to your shared CodeSync room',
  'const buildTogether = (ideas) => {',
  '  return ideas.map((idea) => improve(idea));',
  '};',
  '',
  'buildTogether(["curiosity", "good teamwork"]);',
  '',
].join('\n')

function BrandMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/70">
      <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]" aria-hidden="true"><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  )
}

function statusStyle(status) {
  if (status === 'connected') return 'bg-emerald-50 text-emerald-700'
  if (status === 'error') return 'bg-rose-50 text-rose-700'
  if (status === 'disconnected') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function statusLabel(status) {
  if (status === 'connected') return 'Room connected'
  if (status === 'error') return 'Connection failed'
  if (status === 'disconnected') return 'Disconnected'
  return 'Connecting…'
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function RoomEditorPage({ roomCode, onHome }) {
  const [ydoc] = useState(() => new Y.Doc())
  const [awareness, setAwareness] = useState(null)
  const [participants, setParticipants] = useState([])
  const [room, setRoom] = useState(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [copyState, setCopyState] = useState('')
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(() => {
    const accountUser = readSessionUser()
    if (accountUser?.username) return accountUser.username

    const guestNameKey = 'codesync:guestName'
    const savedGuestName = sessionStorage.getItem(guestNameKey)
    if (savedGuestName) return savedGuestName

    const generatedGuestName = `Guest ${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    sessionStorage.setItem(guestNameKey, generatedGuestName)
    return generatedGuestName
  })
  const ytext = useMemo(() => ydoc.getText('codemirror'), [ydoc])
  const [documentStats, setDocumentStats] = useState(() => ({
    lines: ytext.toString().split('\n').length,
    characters: ytext.length,
  }))

  useEffect(() => {
    let active = true
    setLoadingRoom(true)
    setRoomError('')

    getRoom(roomCode)
      .then((roomDetails) => {
        if (!active) return
        if (sessionStorage.getItem(seedKey(roomCode)) === 'true') {
          sessionStorage.removeItem(seedKey(roomCode))
          if (ytext.length === 0) ytext.insert(0, starterCode)
        }
        const canonicalPath = `/r/${encodeURIComponent(roomDetails.code)}`
        if (window.location.pathname !== canonicalPath) {
          window.history.replaceState({}, '', canonicalPath)
        }
        setRoom(roomDetails)
      })
      .catch((error) => {
        if (!active) return
        setRoomError(error.message || 'Could not open this room.')
      })
      .finally(() => {
        if (active) setLoadingRoom(false)
      })

    return () => { active = false }
  }, [roomCode, ytext, loadAttempt])

  useEffect(() => {
    if (!room) return undefined
    return connectYjsRoom(ydoc, room.code, setConnectionStatus, setAwareness, displayName)
  }, [ydoc, room])

  useEffect(() => {
    if (!awareness) {
      setParticipants([])
      return undefined
    }

    function updateParticipants() {
      const nextParticipants = Array.from(awareness.getStates(), ([clientId, state]) => {
        if (!state?.user) return null
        return {
          clientId,
          name: state.user.name || 'Guest',
          color: state.user.color || '#6366f1',
        }
      }).filter(Boolean)

      setParticipants((current) => {
        const unchanged = current.length === nextParticipants.length
          && current.every((participant, index) => (
            participant.clientId === nextParticipants[index].clientId
            && participant.name === nextParticipants[index].name
            && participant.color === nextParticipants[index].color
          ))

        return unchanged ? current : nextParticipants
      })
    }

    updateParticipants()
    awareness.on('change', updateParticipants)
    return () => awareness.off('change', updateParticipants)
  }, [awareness])

  useEffect(() => {
    if (!awareness) return
    const name = displayName.trim().slice(0, 32) || 'Guest'
    const user = awareness.getLocalState()?.user || {}
    if (user.name !== name) awareness.setLocalStateField('user', { ...user, name })
    if (!readSessionUser()?.username) sessionStorage.setItem('codesync:guestName', name)
  }, [awareness, displayName])

  useEffect(() => {
    const updateStats = () => setDocumentStats({
      lines: ytext.toString().split('\n').length,
      characters: ytext.length,
    })
    ytext.observe(updateStats)
    return () => ytext.unobserve(updateStats)
  }, [ytext])

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState(label)
      window.setTimeout(() => setCopyState(''), 1800)
    } catch {
      setCopyState('')
    }
  }

  async function shareRoom() {
    await copyText(`${window.location.origin}/r/${room.code}`, 'Link copied')
  }

  const visibleParticipants = connectionStatus === 'connected' ? participants : []

  if (loadingRoom || roomError || !room) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 text-slate-900">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.25)]">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 font-bold text-white">&lt;/&gt;</div>
          <h1 className="mt-5 text-xl font-bold tracking-tight">{loadingRoom || !roomError ? 'Opening your room…' : 'Room unavailable'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{loadingRoom || !roomError ? 'Checking the invite and loading room details.' : roomError}</p>
          {loadingRoom || !roomError ? <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" /></div> : <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700">Try again</button>
            <button type="button" onClick={onHome} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Back home</button>
          </div>}
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/95">
        <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onHome} aria-label="Back to CodeSync home" className="rounded-xl outline-none transition hover:opacity-80 focus:ring-4 focus:ring-indigo-100"><BrandMark /></button>
            <div className="hidden sm:block"><div className="text-sm font-bold tracking-[-0.03em] text-slate-900">CodeSync</div><div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#566477]">Shared workspace</div></div>
            <span className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-800">{room.name}</div>
              <button type="button" onClick={() => copyText(room.code, 'Code copied')} title="Copy room code" className="mt-0.5 inline-flex items-center gap-1.5 rounded font-mono text-[10px] font-semibold tracking-wide text-indigo-700 transition hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <span className="font-sans text-[9px] tracking-[0.12em] text-[#566477]">ROOM</span>
                <span>{room.code}</span>
                <span aria-hidden="true" className="font-sans text-[9px] text-[#566477]">{copyState === 'Code copied' ? 'Copied!' : '⧉'}</span>
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[10px] font-semibold sm:px-3 sm:text-[11px] ${statusStyle(connectionStatus)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              {statusLabel(connectionStatus)}
            </div>
            {visibleParticipants.length > 0 && (
              <div className="relative">
                <button type="button" aria-label={`${visibleParticipants.length} people in this room`} aria-expanded={participantsOpen} onClick={() => setParticipantsOpen((open) => !open)} className="inline-flex h-9 items-center gap-2 rounded-lg px-1.5 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-100">
                  <span className="flex -space-x-2">
                    {visibleParticipants.slice(0, 3).map((participant) => (
                      <span key={participant.clientId} title={participant.name} className="grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-slate-950" style={{ backgroundColor: participant.color }}>{initials(participant.name)}</span>
                    ))}
                  </span>
                  <span className="hidden text-[11px] font-semibold text-slate-600 sm:inline">{visibleParticipants.length}</span>
                </button>
                {participantsOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" role="dialog" aria-label="People in this room">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-xs font-semibold text-slate-800">In this room</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#566477]">{visibleParticipants.length}</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {visibleParticipants.map((participant) => (
                        <div key={participant.clientId} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-slate-950" style={{ backgroundColor: participant.color }}>{initials(participant.name)}</span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{participant.name}</span>
                          {participant.clientId === awareness?.clientID && <span className="text-[10px] font-medium text-slate-400">You</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={shareRoom} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{copyState === 'Link copied' ? 'Link copied' : 'Share room'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-7 sm:px-7 lg:pt-9">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#566477]"><button type="button" onClick={onHome} className="transition hover:text-slate-700">Home</button><span>/</span><span className="text-slate-600">Room editor</span></div>
            <h1 className="text-[25px] font-bold tracking-[-0.045em] text-slate-950 sm:text-[30px]">Let’s make it work.</h1>
            <p className="mt-1.5 text-sm text-[#566477]">{room.ownerUsername ? `Created by ${room.ownerUsername}. ` : ''}Share the room link to bring someone into this editor.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.87a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span className="text-xs font-semibold text-slate-700">{connectionStatus === 'connected' ? `${visibleParticipants.length} ${visibleParticipants.length === 1 ? 'person' : 'people'} editing` : 'Waiting for room connection'}</span>
          </div>
        </div>

        {connectionStatus === 'error' && (
          <div role="status" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800">
            Could not connect to the CodeSync server. Make sure Spring Boot is running at <code className="rounded bg-white/70 px-1 py-0.5 font-mono">localhost:8080</code> and refresh this page.
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_-35px_rgba(15,23,42,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div><span className="ml-1 text-xs font-semibold text-slate-700">index.js</span><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-[#566477]">JavaScript</span></div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-[#566477]">
                <span>You</span>
                <input aria-label="Your display name" maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-24 bg-transparent font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
              </label>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700">Yjs shared text</span>
            </div>
          </div>
          <div className="bg-[#171a20] p-3 sm:p-4">
            {awareness
              ? <CollaborativeEditor ytext={ytext} awareness={awareness} label="Shared editor" accent="bg-indigo-400" />
              : <div className="grid h-[26rem] place-items-center rounded-xl border border-white/10 bg-[#282c34] text-xs text-slate-400 lg:h-[31rem]">Connecting your editor presence…</div>}
          </div>
          <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 text-[11px] text-[#566477] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5"><span>{documentStats.lines} lines</span><span>{documentStats.characters} characters</span><span>UTF-8</span><span>JavaScript</span></div>
            <span className={connectionStatus === 'connected' ? 'text-emerald-700' : connectionStatus === 'error' ? 'text-rose-600' : 'text-[#566477]'}>
              {connectionStatus === 'connected'
                ? `Live sync · ${participants.length} ${participants.length === 1 ? 'collaborator' : 'collaborators'}`
                : connectionStatus === 'error'
                  ? 'Connection failed · changes are not syncing'
                  : connectionStatus === 'disconnected'
                    ? 'Disconnected · changes are not syncing'
                    : 'Connecting to live sync…'}
            </span>
          </footer>
        </section>

        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.87a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div><p className="text-xs font-semibold text-slate-800">Invite a teammate</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Anyone with this invite link can join and edit the shared document.</p></div></div>
          <button type="button" onClick={shareRoom} className="self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto">{copyState === 'Link copied' ? 'Invite link copied' : 'Copy invite link'}</button>
        </div>
      </main>
    </div>
  )
}
