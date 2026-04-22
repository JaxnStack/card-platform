# Copilot Instructions for card-platform

This file helps future Copilot sessions understand and work effectively in this repository.

## Build, run, test, and lint
- Development server: `npm run dev` (starts Next.js on localhost:3000)
- Build (production): `npm run build` then `npm run start`
- Lint: `npm run lint` (runs `eslint`). To lint a single file: `npx eslint path/to/file --ext .ts,.tsx --fix` or `npm run lint -- --ext .ts,.tsx path/to/file`
- Tests: No test framework or `test` script is configured in package.json. Add a test runner and `test` script if tests are required.

## High-level architecture
- Monorepo-like layout with the Next.js app located at `card-platform/`.
- App uses the Next.js App Router (`src/app`), TypeScript, Tailwind, and Zustand for lightweight client state.
- Realtime multiplayer backend is implemented with Supabase:
  - Client: `src/lib/supabaseClient.ts` (public anon key)
  - Server: `src/lib/supabaseServer.ts` (service role key; used by server-side API)
  - DB schema: `supabase.sql` at repo root — apply to your Supabase project.
  - Rooms are persisted in a `rooms` table; updates are broadcast via Postgres change feeds (channels).
- Game logic is modular:
  - `src/lib/games/engine.ts` defines the GameEngine interface.
  - Concrete games live under `src/lib/games/` (e.g., `kata.ts`, `ak47.ts`).
  - Engines are registered via `src/lib/games/index.ts` and consumed by server API and client code.
- Server API:
  - `src/app/api/room/action/route.ts` validates incoming actions (START_GAME, GAME_ACTION), applies engine logic, and updates room state.
- Client hooks and store:
  - `src/hooks/useMultiplayer.ts` manages local player identity, subscribes to room updates, and calls server actions.
  - `src/store/gameStore.ts` (Zustand) holds the current in-memory GameState for UI components.

## Key conventions and patterns
- Game engine contract: every game must implement createGame, dispatch, getValidActions, and isGameOver. New games must follow this interface and be exported from `src/lib/games/index.ts`.
- Types: Shared types live in `src/types/` (notably `game.ts` and `multiplayer.ts`) and are treated as the single source of truth for game state shapes.
- Supabase usage:
  - Use public anon client (NEXT_PUBLIC_*) for browser subscriptions and channel listeners.
  - Use service-role client (SUPABASE_SERVICE_ROLE_KEY) on server-only code to perform room updates and action validation.
  - Subscribe to room updates using `supabase.channel(...).on('postgres_changes', ...)` and expect payload.new to contain the updated RoomRecord.
- Room codes: Generated as 6-character codes excluding ambiguous characters (`buildRoomCode` in `src/lib/multiplayer.ts`). Codes are uppercase; clients should uppercase input when searching.
- Local player identity: Stored in localStorage keys `card-platform-player-id` and `card-platform-player-name` by `useMultiplayer`.
- API contract: `/api/room/action` expects JSON { roomId, playerId, payload } and returns JSON with updated room or error.
- Validation: The server is authoritative about turn order and valid actions. Clients should only suggest actions derived from `engine.getValidActions`.

## Intelligence and agent notes
- See `card-platform/AGENTS.md`: this repository uses a Next.js version with breaking changes. Copilot agents should consult `node_modules/next/dist/docs/` before making API or structural changes.
- `card-platform/CLAUDE.md` references `AGENTS.md` — include its guidance if invoking Claude/OpenCode-style assistants.

## Where to look when adding features
- Add new game implementations under `src/lib/games/` and export them via `src/lib/games/index.ts`.
- Update shared types in `src/types/` if new game metadata fields are needed.
- For DB changes, update `supabase.sql` and apply migrations in Supabase.
- For auth or provider changes, consult environment variables in `.env.example`.

## Quick checks for CI/PR
- Ensure `npm run build` completes for any changes touching Next.js server or server API routes.
- Run `npx eslint .` to catch lint regressions (no explicit ESLint config file in repo — relies on `eslint-config-next`).

---

Created from repository sources: README.md, AGENTS.md, CLAUDE.md, package.json, and key TS files under `src/`.
