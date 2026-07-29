# Codex Ski Shop Frontend

Next.js frontend for Codex Ski Shop Zero Hit Radar.

## Environment

Copy `.env.example` when running locally:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
INTERNAL_API_BASE_URL=http://backend:8080
```

Browser-side code must use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`.
`http://backend:8080` is only for container-internal server-side usage.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

The Playwright E2E tests mock the backend API in the browser and cover:

- top page preview/search/zero-hit state
- product list search/filter/sort
- admin login, Zero Hit dashboard, and AI consultation fallback

## Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:

- frontend: http://localhost:3000
- backend: http://localhost:8080
- PostgreSQL: localhost:5432

Default demo admin credentials in `docker-compose.yml`:

- username: `admin@example.com`
- password: `change-me`

`ADMIN_PASSWORD` in compose is stored as `{noop}change-me` so Spring Security can
verify the demo password without treating it as a production secret.
