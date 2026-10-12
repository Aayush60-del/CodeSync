import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  ApiError,
  clearSession,
  createRoom,
  getRoom,
  readSessionUser,
  saveSession,
  signIn,
  signUp,
} from './api.js'

const originalFetch = globalThis.fetch
const storage = new Map()

globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}

afterEach(() => {
  globalThis.fetch = originalFetch
  clearSession()
})

test('signup sends credentials as JSON without an authorization header', async () => {
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, ...options }
    return Response.json({ id: 'user-id' }, { status: 201 })
  }

  const result = await signUp({ username: 'sam', email: 'sam@example.com', password: 'password1' })

  assert.equal(request.url, '/api/auth/signup')
  assert.equal(request.method, 'POST')
  assert.equal(request.headers.get('content-type'), 'application/json')
  assert.equal(request.headers.get('authorization'), null)
  assert.deepEqual(JSON.parse(request.body), {
    username: 'sam',
    email: 'sam@example.com',
    password: 'password1',
  })
  assert.deepEqual(result, { id: 'user-id' })
})

test('sign in attaches a saved token and saves the returned session', async () => {
  saveSession({ accessToken: 'existing-token', user: { username: 'sam' } })
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, ...options }
    return Response.json({ accessToken: 'new-token', tokenType: 'Bearer', user: { username: 'sam' } })
  }

  const response = await signIn({ username: 'sam', password: 'password1' })
  saveSession(response)

  assert.equal(request.headers.get('authorization'), 'Bearer existing-token')
  assert.deepEqual(readSessionUser(), { username: 'sam' })
})

test('room requests encode invite codes and do not send authentication', async () => {
  saveSession({ accessToken: 'private-token', user: { username: 'sam' } })
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, ...options }
    return Response.json({ code: 'ABC123', name: 'Room' })
  }

  const room = await getRoom('A B/1')

  assert.equal(request.url, '/api/rooms/A%20B%2F1')
  assert.equal(request.headers.get('authorization'), null)
  assert.deepEqual(room, { code: 'ABC123', name: 'Room' })
})

test('create room sends the selected name', async () => {
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, ...options }
    return Response.json({ code: 'ABC123' }, { status: 201 })
  }

  await createRoom('Pairing session')

  assert.equal(request.url, '/api/rooms')
  assert.deepEqual(JSON.parse(request.body), { name: 'Pairing session' })
})

test('401 clears the session and reports the backend error', async () => {
  saveSession({ accessToken: 'expired-token', user: { username: 'sam' } })
  globalThis.fetch = async () => Response.json({ message: 'Session expired' }, { status: 401 })

  await assert.rejects(signUp({ username: 'sam', email: 'sam@example.com', password: 'password1' }), {
    name: 'ApiError',
    message: 'Session expired',
    status: 401,
  })
  assert.equal(readSessionUser(), null)
})

test('network failures become a user-facing ApiError', async () => {
  globalThis.fetch = async () => {
    throw new Error('offline')
  }

  await assert.rejects(createRoom(), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 0)
    assert.match(error.message, /backend is running/)
    return true
  })
})

test('malformed stored session data does not break session reads', () => {
  storage.set('codesync:accessToken', 'token')
  storage.set('codesync:user', '{')

  assert.equal(readSessionUser(), null)
})
