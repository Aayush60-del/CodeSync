# CodeSync

CodeSync is a real-time collaborative code editor. Users create rooms and invite collaborators with a six-character code; guests can join without an account. React, CodeMirror, and Yjs power the frontend, while Spring Boot relays room updates over WebSockets and persists room metadata in PostgreSQL.

## Run locally

Requirements: Java 21, Node.js 22, npm, and PostgreSQL.

Configure the backend environment before starting Spring Boot:

```text
DB_URL=jdbc:postgresql://localhost:5432/codesync
DB_USERNAME=postgres
DB_PASSWORD=your-local-password
JWT_SECRET=use-a-random-secret-of-at-least-32-bytes
CODESYNC_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the backend with `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`). Start the frontend in another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Flyway applies the versioned PostgreSQL schema migrations; Hibernate validates the schema and does not modify it. For an existing database without Flyway history, the initial migration creates any missing tables and backfills room codes. Back up production data before first migration.

## Tests and CI

See [TESTING.md](TESTING.md) for backend, frontend, browser, audit, and optional load-test commands. GitHub Actions runs the build and automated checks for pushes and pull requests.

## Deployment considerations

- Use TLS, secure database credentials, a strong unique JWT secret, and an exact `CODESYNC_ALLOWED_ORIGINS` allowlist.
- Apply request-rate limits at the reverse proxy or hosting platform; authentication routes are not rate-limited in the app.
- The WebSocket relay and Yjs document state are in-memory. Run one backend instance; edits are not durable and disappear when all collaborators leave or the process restarts.
- Do not treat invite codes as access control for sensitive source code; anyone with a code can join and edit that room.
