# Paragon Dashboard

Admin dashboard for Paragon auction, bidder, listing, message, and user workflows.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local env file:

   ```sh
   cp .env.example .env
   ```

3. Update `.env` so `VITE_API_BASE_URL` points at the Paragon API server.

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build in `dist`.
- `npm run preview` serves the production build locally.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run format` formats the project with Prettier.
- `npm run test:run` runs Vitest once.
- `npm run check` runs the full local verification suite.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_PORT` | `5100` | Local Vite dev/preview port. |
| `VITE_API_BASE_URL` | none | API origin used by the Vite `/api` and `/ws` proxies. |
| `VITE_REALTIME_URL` | derived from `VITE_API_BASE_URL` | Optional websocket endpoint override for auction realtime updates. |
| `VITE_ENABLE_DEV_ADMIN_HEADERS` | `true` in dev | Sends local-only dashboard admin headers through the shared request helper. |

Keep real `.env` files local. Only `.env.example` should be committed.

## Project Shape

- `src/core` contains shared frame, layout, config, API, and UI primitives.
- `src/features` contains feature-level auction, login, listing, bid, and user code.
- `src/routes` contains route modules and route-owned dashboard/message UI.
- `src/redux` contains the current Redux store and reducers.
- `src/interfaces` contains shared domain interfaces.
