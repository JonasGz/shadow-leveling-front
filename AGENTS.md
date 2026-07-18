# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, opencode, …) working in this repository.

## What this is

**Shadow Leveling — frontend.** An Expo / React Native mobile app for a gamified workout tracker themed after Solo Leveling. It consumes the Go REST API in the separate `shadow-leveling-back` repo.

Reference docs in this repo: `README.md`, `API_GUIDE.md` (API contract), `PRD.md` (product spec), `DEPLOY.md` (EAS deploy).

## Stack

Expo SDK 54 / React Native 0.81, TypeScript (strict), Expo Router (file-based), NativeWind v4 (Tailwind), Zustand, Axios, React Hook Form + Zod, `expo-secure-store` for the auth token.

## Commands

```bash
npm install
npm start        # expo start
npm run android  # or: npm run ios / npm run web
npm test         # jest (jest-expo + @testing-library/react-native)
npm run typecheck
```

Env: `EXPO_PUBLIC_API_URL` in `.env` (default `http://localhost:8080`) points at the backend.

There is no E2E suite. Unit/component tests live next to the code as `*.test.ts(x)`; the meaningful coverage is in `src/features/` (regras de negócio), `src/lib/date.ts`, `src/hooks/` and `src/components/session/`.

## Architecture

- `app/` — Expo Router file-based routes. `_layout.tsx` bootstraps auth: reads the stored token, calls `authService.me()`, and redirects to `(auth)/login` or `(tabs)/`. Route groups: `(auth)/`, `(tabs)/`, plus `workout/`, `session/` stacks.
- `src/services/api.ts` — the single Axios instance. A **request interceptor** injects the bearer token from `expo-secure-store`; a **response interceptor** clears the token and redirects to login on any `401`. All other services (`auth`, `workouts`, `sessions`, `exercises`, `metrics`) use this instance.
- `src/stores/` — Zustand stores (`auth`, `workouts`).
- `src/components/ui/` — themed primitives (Button, Card, Input, Badge, Toast, EmptyState). `Toast` is provided via a `ToastProvider` at the root layout.
- `src/types/api.types.ts` — shared API types.

Visual identity is "Cyber-Athletic": high-contrast dark mode, electric purple + cyan. Root background is `#131314`. Tokens live in `tailwind.config.js`.
