import { useEffect, useState } from 'react'
import AuthPage from './AuthPage.jsx'
import JoinRoomPage from './JoinRoomPage.jsx'
import LandingPage from './LandingPage.jsx'
import RoomEditorPage from './RoomEditorPage.jsx'
import { clearSession, createRoom as createRoomRequest, readSessionUser } from './api.js'

function readRoute() {
  const url = new URL(window.location.href)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] === 'auth') {
    return { page: 'auth', intent: url.searchParams.get('intent'), returnTo: url.searchParams.get('returnTo') }
  }
  if (parts[0] === 'join') return { page: 'join' }
  if ((parts[0] === 'r' || parts[0] === 'room') && parts[1]) {
    try {
      return { page: 'room', roomCode: decodeURIComponent(parts[1]) }
    } catch {
      return { page: 'room', roomCode: parts[1] }
    }
  }
  return { page: 'home' }
}

function safeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/auth')
    ? path
    : '/'
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [user, setUser] = useState(readSessionUser)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const handlePopState = () => setRoute(readRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path) {
    window.history.pushState({}, '', path)
    setRoute(readRoute())
    setActionError('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function requireSignIn({ intent, returnTo } = {}) {
    const params = new URLSearchParams()
    if (intent) params.set('intent', intent)
    if (returnTo) params.set('returnTo', returnTo)
    const query = params.toString()
    navigate(query ? `/auth?${query}` : '/auth')
  }

  function openRoom(roomCode) {
    const code = typeof roomCode === 'string' ? roomCode.trim() : ''
    const shortCode = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]{6}$/.test(code)
    const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)
    if (!shortCode && !legacyId) return
    navigate(`/r/${encodeURIComponent(code)}`)
  }

  async function createRoom() {
    if (creatingRoom) return

    setCreatingRoom(true)
    setActionError('')
    try {
      const room = await createRoomRequest('Untitled room')
      if (!room?.code) throw new Error('The server did not return a room code.')
      sessionStorage.setItem(`codesync:seed:${room.code}`, 'true')
      openRoom(room.code)
    } catch (error) {
      setActionError(error.message || 'Could not create a room. Please try again.')
    } finally {
      setCreatingRoom(false)
    }
  }

  function joinRoom(code) {
    if (typeof code === 'string' && code.trim()) openRoom(code)
    else navigate('/join')
  }

  async function onAuthenticated(authenticatedUser) {
    setUser(authenticatedUser)
    if (route.intent === 'create') {
      await createRoom()
      return
    }
    navigate(safeReturnPath(route.returnTo))
  }

  function signOut() {
    clearSession()
    setUser(null)
    navigate('/')
  }

  if (route.page === 'auth') {
    return <AuthPage onAuthenticated={onAuthenticated} onBack={() => navigate('/')} />
  }

  if (route.page === 'join') {
    return <JoinRoomPage onJoin={joinRoom} onBack={() => navigate('/')} />
  }

  if (route.page === 'room') {
    return (
      <RoomEditorPage
        key={route.roomCode}
        roomCode={route.roomCode}
        onHome={() => navigate('/')}
      />
    )
  }

  return (
    <LandingPage
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      onSignIn={() => requireSignIn()}
      onSignOut={signOut}
      user={user}
      creatingRoom={creatingRoom}
      actionError={actionError}
    />
  )
}
