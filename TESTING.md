# Testing CodeSync

## Prerequisites

- Java 21 and Maven (or the included Maven wrapper)
- Node.js 22 and npm
- Playwright Chromium for browser tests
- k6 only for the optional WebSocket load test

## Backend tests

Run the complete Java unit and integration test suite:

```sh
./mvnw --batch-mode clean verify
```

On Windows, use `mvnw.cmd --batch-mode clean verify`. Tests load `src/test/resources/application.properties` and use an in-memory H2 database; they do not require or modify a local PostgreSQL database.

## Frontend tests

```sh
cd frontend
npm ci
npm test
npm run build
```

Unit tests use Node's built-in test runner. The browser suite checks guest room creation, two-page collaborative editing, invalid room-code validation, signup/signout, and WCAG A/AA accessibility rules using axe-core.

## Browser tests

Browser tests require the Spring Boot backend on `http://localhost:8080` and a Chromium installation:

```sh
cd frontend
npx playwright install chromium
npm run test:e2e
```

For local use, start the backend in a separate terminal with valid `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` environment variables. Set `CODESYNC_ALLOWED_ORIGINS` to comma-separated exact frontend origins outside local development. The CI browser job provisions PostgreSQL and starts the backend automatically. Playwright starts Vite on port 5173 and reuses an existing server outside CI.

## Security and load checks

- `npm audit --audit-level=moderate` checks production and development frontend dependencies.
- GitHub Actions runs CodeQL and Gitleaks on pushes and pull requests.
- The optional GitHub Actions `WebSocket load test` workflow uses k6 to measure handshake latency and verify message relay. It creates a test room in its configured database; use a disposable environment.

The application does not include an API gateway or distributed rate limiter. Configure request-rate limits at the reverse proxy or hosting platform before exposing authentication endpoints publicly. The WebSocket relay and Yjs state are in-memory; use a single backend instance and expect room contents to be lost after all clients disconnect or the process restarts.
