# AGENTS.md

## What this repo is
Two independent parts:
1. **TypeSpec API contract** (root, `specs/*.tsp`) — the source of truth. Generates
   the OpenAPI 3.1 document `tsp-output/openapi.yaml` for the "Calendar of Calls"
   booking service. No server/runtime logic lives here.
2. **Frontend SPA** (`frontend/`) — React + Vite client that talks to the API
   **only through the contract**. See `frontend/` section below.

## Commands (root — contract)
- `npm run compile` — compile `specs/` to `tsp-output/openapi.yaml`
- `npm run watch` — recompile on change
- `npm run format` — format `specs/**/*.tsp` (run before committing spec edits)
- `npm run docs` — compile, then serve ReDoc-style `specs/docs.html` on :8080
- No test, lint, or typecheck scripts at root. Verification = `npm run compile` succeeds.

## Layout
- `specs/main.tsp` — service entrypoint; defines `CalendarOfCalls` namespace and
  imports the other files. Adding a new `.tsp` file requires an `import` here.
- `specs/models.tsp` — all models, `Page<T>` wrapper, and `@error` types.
- `specs/admin.tsp` — owner/admin endpoints (`/admin`, tag `Admin`).
- `specs/public.tsp` — guest endpoints (`/public`, tag `Public`).
- `tsp-output/` and `node_modules/` are gitignored. `tsp-output/openapi.yaml` is
  generated — never hand-edit it.

## Conventions
- All `@doc` text is in **Russian**; match this when editing/adding docs.
- TypeSpec version `0.67.x` (uses `#{ }` object-value syntax and `Lifecycle.Read`
  visibility — do not downgrade syntax).
- Errors are modeled as `@error` models with `@statusCode` and returned via union
  return types (e.g. `EventType | NotFoundError | ValidationError`).

## Domain rules to preserve in the spec
- Single predefined `Owner`; no registration/auth. Admin ops act as the owner.
- Guests book without accounts.
- Global occupancy rule: one booking per time, even across different event types
  (409 `ConflictError`).
- Booking window: free slots span 14 days from now. Slots are computed, not stored.
- Booking `end` = `start + durationMinutes` of the event type (server-computed).

## Frontend (`frontend/`)
Separate package — `cd frontend` before running its scripts. Stack: React +
Vite + TypeScript, Mantine UI, TanStack Query, React Router, openapi-fetch.
Talks to the API only via the generated typed client; no business logic that
isn't in the contract.

- **Dev flow (order matters):**
  1. (root) `npm run compile` — produce `tsp-output/openapi.yaml`.
  2. (frontend) `npm run gen:api` — regenerate `src/api/schema.d.ts` from that file.
  3. (frontend) `npm run dev:all` — runs Prism mock (:4010) + Vite (:5173) together.
- `src/api/schema.d.ts` is **generated** (gitignored) — never hand-edit; rerun
  `gen:api` after any contract change.
- API base URL is `VITE_API_URL` (see `.env.example`). In dev the client calls
  relative `/` and Vite proxies `/admin` + `/public` to `VITE_API_URL`
  (default Prism `:4010`). Point it at a real backend without code changes.
- `npm run mock` = `prism mock ../tsp-output/openapi.yaml -d` (dynamic data).
  Prism does **not** persist state: after a POST, a later GET returns fresh random
  data, and list endpoints may return empty/`total<0`. The booking confirmation
  page works around this by reading the POST response via router state.
- Verify frontend changes with `npm run build` (tsc + vite) and `npm run lint`.
  `src/api/` types/client are the contract boundary — keep all fetch calls there.

## CI
`.github/workflows/hexlet-check.yml` is an auto-generated Hexlet check — do not
edit or delete it.
