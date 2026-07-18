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

Visual identity is high-contrast dark mode with purple as the accent. Root
background is `gray-700` (`#111113`).

**Styling rules:**
- Colors live in `src/theme/palette.js` (flat object, typed by `palette.d.ts`),
  which `tailwind.config.js` consumes. Each key is exactly the Tailwind class
  suffix, so `bg-purple-100`, `text-purple-100` and `color={color["purple-100"]}`
  are visibly the same color. The scale is literal (`purple-300`, `gray-600`),
  not semantic — `primary`/`surface-low`/`on-surface` were removed because ~10
  aliases pointed at the same hex. `error`/`success`/`warning`/`info` and
  `difficulty-*` stay semantic on purpose.
- Never hardcode a hex. In `className` use the token; in a JS prop (Lucide
  `color=`, `LinearGradient colors=`, `ActivityIndicator`) import `color` from
  the palette.
- Any conditional `className` goes through `cn()` (`src/lib/cn.ts`, clsx +
  tailwind-merge). No template literals. `cn.test.ts` guards the custom
  classGroups — the config's custom `fontSize`/spacing scales must be registered
  there or the merge fails silently.
- `style={{}}` only for what a class cannot express: `LinearGradient` and
  `Animated.View` (no cssInterop registered, they ignore `className`), shadows,
  and genuinely dynamic values.
- `npm run format` runs prettier + prettier-plugin-tailwindcss, which sorts
  classes (including inside `cn()`).
