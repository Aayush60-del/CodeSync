const API_BASE = (import.meta.env?.VITE_CODESYNC_API_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function saveSession(loginResponse) {
  sessionStorage.setItem('codesync:accessToken', loginResponse.accessToken)
  sessionStorage.setItem('codesync:tokenType', loginResponse.tokenType || 'Bearer')
  sessionStorage.setItem('codesync:user', JSON.stringify(loginResponse.user))
}

export function clearSession() {
  sessionStorage.removeItem('codesync:accessToken')
  sessionStorage.removeItem('codesync:tokenType')
  sessionStorage.removeItem('codesync:user')
}

export function readSessionUser() {
  if (!sessionStorage.getItem('codesync:accessToken')) return null
  try {
    const user = sessionStorage.getItem('codesync:user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const { auth = true, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers || {})
  const token = auth ? sessionStorage.getItem('codesync:accessToken') : null

  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `${sessionStorage.getItem('codesync:tokenType') || 'Bearer'} ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers })
  } catch {
    throw new ApiError('Could not reach CodeSync. Check that the backend is running.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok) {
    if (response.status === 401) clearSession()
    const message = result?.message
      || (response.status === 401 && path === '/auth/login' ? 'Username or password is incorrect.' : '')
      || (response.status === 401 ? 'Please sign in to continue.' : '')
      || ((response.status === 400 || response.status === 404) && path.startsWith('/rooms/') ? 'That room code is invalid or no longer exists.' : '')
      || `Request failed (${response.status}).`
    throw new ApiError(message, response.status)
  }

  return result
}

export function signUp({ username, email, password }) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function signIn({ username, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function createRoom(name = 'Untitled room') {
  return request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function getRoom(roomCode) {
  return request(`/rooms/${encodeURIComponent(roomCode)}`, { auth: false })
}
