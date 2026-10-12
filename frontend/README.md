# CodeSync frontend

React + Vite frontend for CodeSync. Tailwind styles the landing and room pages; CodeMirror 6 and Yjs power the shared editor.

## Start

Run Spring Boot on port 8080, then from this folder:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Choose **Create a room** to get a shareable `/r/{code}` link; no account is required. Guests can open **Join a room** and enter the six-character code or invite link without signing up. If a host signs in, the room is associated with their profile. The UUID remains the database identifier; the short code is the public lookup key.

A room editor uses one Yjs document and relays Yjs binary updates through Spring's `/ws/rooms/{code}` endpoint. The client adds a small room-sync envelope around Yjs state vectors and updates; Spring resolves the code to the internal UUID and forwards binary frames without interpreting the CRDT data. Vite proxies `/api` and `/ws` to the local Spring server.

Set `VITE_CODESYNC_API_URL` to the API base URL (including `/api`) or `VITE_CODESYNC_WS_URL` to the WebSocket server base URL if your backend is not available through the same origin. Use `wss://` for HTTPS deployments.

## Current room behavior

- Room records are stored in PostgreSQL. Creating a room and looking it up by invite code are public; owner association is optional.
- The short room code is an invite credential. Anyone with it can read the room metadata and join the editor without an account.
- Room lookup and WebSocket connections are public by design; anyone with the room code can join. Treat the code as a private invite and add code revocation or rate limits if rooms need tighter access control.
- The relay keeps connected sessions in memory and does not persist Yjs document content. If every client disconnects or Spring restarts, the document state is lost.
