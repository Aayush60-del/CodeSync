import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as Y from 'yjs'
import { connectYjsRoom } from './yjsRoomProvider.js'

const originalWindow = globalThis.window
const originalWebSocket = globalThis.WebSocket

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3

  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.CONNECTING
    this.listeners = new Map()
    this.sent = []
    MockWebSocket.instances.add(this)
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener)
  }

  send(data) {
    this.sent.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
  }

  emit(type, event = {}) {
    this.listeners.get(type)?.(event)
  }
}

function makeFrame(type, clientId, payload = new Uint8Array()) {
  const clientIdBytes = new TextEncoder().encode(clientId)
  const frame = new Uint8Array(37 + payload.byteLength)
  frame[0] = type
  frame.set(clientIdBytes.subarray(0, 36), 1)
  frame.set(payload, 37)
  return frame.buffer
}

afterEach(() => {
  globalThis.window = originalWindow
  globalThis.WebSocket = originalWebSocket
})

test('connects, synchronizes local and remote Yjs updates, and cleans up', () => {
  globalThis.window = { location: { protocol: 'http:', host: 'localhost:5173' } }
  globalThis.WebSocket = MockWebSocket

  const localDoc = new Y.Doc()
  const remoteDoc = new Y.Doc()
  const statuses = []
  const awarenessStates = []
  let socket
  const cleanup = connectYjsRoom(
    localDoc,
    'ABC123',
    (status) => statuses.push(status),
    (awareness) => awarenessStates.push(awareness),
    'Sam',
  )
  socket = [...MockWebSocket.instances].at(-1)

  assert.equal(socket.url, 'ws://localhost:5173/ws/rooms/ABC123')
  assert.deepEqual(statuses, ['connecting'])

  socket.readyState = MockWebSocket.OPEN
  socket.emit('open')
  assert.equal(statuses.at(-1), 'connected')
  assert.deepEqual(socket.sent.map((message) => new Uint8Array(message)[0]), [1, 4, 5])

  remoteDoc.getText('code').insert(0, 'remote')
  socket.emit('message', { data: makeFrame(3, 'remote-client', Y.encodeStateAsUpdate(remoteDoc)) })
  assert.equal(localDoc.getText('code').toString(), 'remote')

  localDoc.getText('code').insert(6, ' local')
  assert.equal(new Uint8Array(socket.sent.at(-1))[0], 3)

  cleanup()
  assert.equal(socket.readyState, MockWebSocket.CLOSED)
  assert.equal(awarenessStates.at(-1), null)

  localDoc.destroy()
  remoteDoc.destroy()
})

MockWebSocket.instances = new Set()
