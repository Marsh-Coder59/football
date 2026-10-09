# Football Intelligence — frontend

Next.js 14 (App Router) + TypeScript (strict) + Tailwind + TanStack Query + Recharts.
It only presents data from the FastAPI backend in `../backend`; it never computes
predictions or touches PostgreSQL.

## Setup
```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                    # http://localhost:3000
```
Backend: in `../backend`, `pip install -r requirements.txt`, then
`uvicorn app.main:app --port 8000`. Set `CORS_ALLOWED_ORIGINS` in the backend env to your
frontend origin(s).

## Scripts
`npm run typecheck` · `npm run lint` · `npm test` · `npm run build` · `npm start`

## Environment
- `NEXT_PUBLIC_API_URL` — backend base URL (no secrets in `NEXT_PUBLIC_*` other than the
  optional `NEXT_PUBLIC_ADMIN_API_KEY`, which you should leave blank in production and enter
  at runtime on `/models`).

## Architecture
- `lib/api/client.ts` — the single axios client (timeout, error normalisation for
  401/403/404/422/429/5xx/network, friendly messages, no retry loops on 4xx/429).
- `lib/api/*.ts` — one file per resource: request functions + TanStack Query hooks.
- `types/api.ts` — types mirrored from the backend Pydantic schemas.
- `lib/betslip`, `lib/auth` — client-only stores (betslip list, admin key).
- `app/*` pages, `components/*` UI. Every data view has loading, empty and error states.

## Authentication
The backend has no login system; only two admin actions (validate/promote model) need an
`X-API-Key`. See `docs/api-integration-issues.md` #8.

## Docs
- `docs/backend-api-inventory.md` — endpoints actually available.
- `docs/api-integration-issues.md` — gaps, backend additions, and what was not built.

## Deployment
`npm run build && npm start`, with `NEXT_PUBLIC_API_URL` set at build time to the public
backend URL, and that frontend origin added to the backend's `CORS_ALLOWED_ORIGINS`.
