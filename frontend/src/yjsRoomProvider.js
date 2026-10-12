import * as Y from 'yjs'
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness.js'

const SYNC_STEP_1 = 1
const SYNC_STEP_2 = 2
const UPDATE = 3
const AWARENESS_UPDATE = 4
const AWARENESS_REQUEST = 5
const CLIENT_ID_BYTES = 36
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const remoteOrigin = Symbol('remote-yjs-update')
const remoteAwarenessOrigin = Symbol('remote-awareness-update')
const userColors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' },
]

function encodeFrame(type, clientId, payload) {
  const idBytes = textEncoder.encode(clientId)
  const frame = new Uint8Array(1 + CLIENT_ID_BYTES + payload.byteLength)
  frame[0] = type
  frame.set(idBytes.subarray(0, CLIENT_ID_BYTES), 1)
  frame.set(payload, 1 + CLIENT_ID_BYTES)
  return frame
}

function decodeFrame(frame) {
  if (frame.byteLength < 1 + CLIENT_ID_BYTES) return null

  return {
    type: frame[0],
    clientId: textDecoder.decode(frame.subarray(1, 1 + CLIENT_ID_BYTES)),
    payload: frame.subarray(1 + CLIENT_ID_BYTES),
  }
}

export function connectYjsRoom(doc, roomCode, onStatus, onAwareness, displayName) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const sameOriginUrl = `${protocol}//${window.location.host}`
  const baseUrl = (import.meta.env?.VITE_CODESYNC_WS_URL || sameOriginUrl).replace(/\/+$/, '')
  const socket = new WebSocket(`${baseUrl}/ws/rooms/${encodeURIComponent(roomCode)}`)
  const clientId = crypto.randomUUID()
  const awareness = new Awareness(doc)
  const userColor = userColors[Math.floor(Math.random() * userColors.length)]
  let active = true
  let errorSeen = false
  socket.binaryType = 'arraybuffer'

  awareness.setLocalStateField('user', {
    name: displayName,
    color: userColor.color,
    colorLight: userColor.light,
  })
  onAwareness(awareness)

  function send(type, payload) {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.send(encodeFrame(type, clientId, payload))
  }

  function onDocumentUpdate(update, origin) {
    if (origin !== remoteOrigin) send(UPDATE, update)
  }

  function onAwarenessUpdate({ added, updated, removed }) {
    const changedClientIds = [...new Set([...added, ...updated, ...removed])]
      .filter((id) => id === awareness.clientID)

    if (changedClientIds.length > 0) {
      send(AWARENESS_UPDATE, encodeAwarenessUpdate(awareness, changedClientIds))
    }
  }

  doc.on('update', onDocumentUpdate)
  awareness.on('update', onAwarenessUpdate)

  socket.addEventListener('open', () => {
    if (!active) return
    onStatus('connected')
    send(SYNC_STEP_1, Y.encodeStateVector(doc))
    send(AWARENESS_UPDATE, encodeAwarenessUpdate(awareness, [awareness.clientID]))
    send(AWARENESS_REQUEST, new Uint8Array())
  })

  socket.addEventListener('message', (event) => {
    if (!(event.data instanceof ArrayBuffer)) return

    const frame = decodeFrame(new Uint8Array(event.data))
    if (!frame || frame.clientId === clientId) return

    if (frame.type === SYNC_STEP_1) {
      send(SYNC_STEP_2, Y.encodeStateAsUpdate(doc, frame.payload))
      return
    }

    if (frame.type === SYNC_STEP_2 || frame.type === UPDATE) {
      Y.applyUpdate(doc, frame.payload, remoteOrigin)
      return
    }

    if (frame.type === AWARENESS_UPDATE) {
      applyAwarenessUpdate(awareness, frame.payload, remoteAwarenessOrigin)
      return
    }

    if (frame.type === AWARENESS_REQUEST && awareness.getLocalState()) {
      send(AWARENESS_UPDATE, encodeAwarenessUpdate(awareness, [awareness.clientID]))
    }
  })

  socket.addEventListener('error', () => {
    errorSeen = true
    if (active) onStatus('error')
  })
  socket.addEventListener('close', () => {
    if (!active) return
    awareness.setLocalState(null)
    onStatus(errorSeen ? 'error' : 'disconnected')
  })

  onStatus('connecting')

  return () => {
    active = false
    doc.off('update', onDocumentUpdate)
    if (socket.readyState === WebSocket.OPEN) awareness.setLocalState(null)
    awareness.off('update', onAwarenessUpdate)
    awareness.destroy()
    socket.close()
    onAwareness(null)
  }
}
