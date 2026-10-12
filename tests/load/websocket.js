import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Counter } from 'k6/metrics'
import ws from 'k6/ws'

const handshakeDuration = new Trend('websocket_handshake_ms')
const receivedMessages = new Counter('websocket_messages_received')

export const options = {
  thresholds: {
    websocket_handshake_ms: ['p(95)<1500'],
    websocket_messages_received: ['count>0'],
  },
}

export function setup() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8080'
  const response = http.post(
    `${baseUrl}/api/rooms`,
    JSON.stringify({ name: 'Automated WebSocket load test' }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(response, { 'room was created': (result) => result.status === 201 })
  if (response.status !== 201) {
    throw new Error(`Could not create the load-test room: ${response.status}`)
  }

  return { baseUrl, roomCode: response.json('code') }
}

export default function ({ baseUrl, roomCode }) {
  const wsUrl = `${baseUrl.replace(/^http/, 'ws')}/ws/rooms/${roomCode}`
  let echoed = false
  const response = ws.connect(wsUrl, {}, (socket) => {
    socket.on('open', () => socket.send(`load-client-${__VU}`))
    socket.on('message', () => {
      echoed = true
      receivedMessages.add(1)
    })
    sleep(5)
    socket.close()
  })

  handshakeDuration.add(response.timings.duration)
  check(response, { 'WebSocket handshake succeeded': (result) => result && result.status === 101 })
  check(echoed, { 'WebSocket relay delivered a message': (received) => received })
  sleep(1)
}
