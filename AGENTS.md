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

- `app/` — Expo Router file-based routes. `_layout.tsx` bootstraps auth: reads the stored token, calls `authService.me()`, and redirects to `(auth)/login` or `(tabs)/`. Route groups: `(auth)/`, `(tabs)/`, plus `workout/`, `session/`, `ai/` stacks.
- `src/services/api.ts` — the single Axios instance. A **request interceptor** injects the bearer token from `expo-secure-store`; a **response interceptor** clears the token and redirects to login on any `401`. All other services (`auth`, `workouts`, `sessions`, `exercises`, `metrics`) use this instance.
- `src/stores/` — Zustand stores (`auth`, `workouts`).
- `src/components/ui/` — themed primitives (Button, Card, Input, Badge, Toast, EmptyState). `Toast` is provided via a `ToastProvider` at the root layout.
- `src/types/api.types.ts` — shared API types.

### O assistente de treino (`app/ai/`)

Um chat guiado que devolve uma **proposta**, não um treino. A regra de ouro:
a proposta só vira treino quando o usuário confirma, e a criação passa pelas
rotas normais de workout — `createWorkoutFromProposal` em `ai.service.ts` faz
um `POST /workouts` + `addExercise` por dia, **sequencial** (paralelo correria
com o `sort_order`).

O servidor é stateless: `aiService.chat()` reenvia o histórico inteiro a cada
turno. A tela guarda as mensagens em `useState`, nada em storage.

Quatro estados chegam do backend (`AIChatResponse.state`):

- `question` — renderiza `text` como a próxima pergunta.
- `proposal` — renderiza o preview; nada foi persistido ainda.
- `refusal` — se `health_stop` for `true`, a conversa **encerra** (o usuário
  mencionou uma condição de saúde) e a tela oferece a criação manual.
- `error` — mensagem genérica; o motivo real só existe no log do servidor.

O status HTTP vira `AIBlockedError` com um `reason` (`ai.service.ts`): 428
manda para `app/ai/consent.tsx` (falta consentimento ou data de nascimento),
403 é menor de 18, 429 é limite diário, 404 é backend sem provider configurado.
Nenhum deles é erro de rede — todos têm tratamento próprio na tela.

O botão de report (`aiService.report`) é exigência da política de conteúdo
gerado por IA do Google Play: precisa funcionar sem sair do app.

Visual identity is high-contrast dark mode with purple as the accent. Root
background is `gray-700` (`#111113`).

**Styling rules:**

- Colors live in `src/theme/palette.js` (flat object, typed by `palette.d.ts`),
  which `tailwind.config.js` consumes. Each key is exactly the Tailwind class
  suffix, so `bg-purple-100`, `text-purple-100` and `color={color["purple-100"]}`
  are visibly the same color. The scale is literal (`purple-300`, `gray-600`),
  not semantic — `primary`/`surface-low`/`on-surface` were removed because ~10
  aliases pointed at the same hex. `error`/`success`/`warning`/`info` and
  `difficulty-*` stay semantic on purpose. `purple-grad-from`/`purple-grad-to`
  são um par de gradiente, não degraus da escala: só existem juntos (o FAB do
  assistente) e ambos caem entre `purple-200` e `purple-400`.
- Never hardcode a hex. In `className` use the token; in a JS prop (Lucide
  `color=`, `LinearGradient colors=`, `ActivityIndicator`) import `color` from
  the palette.
- Any conditional `className` goes through `cn()` (`src/lib/cn.ts`, clsx +
  tailwind-merge). No template literals. `cn.test.ts` guards the custom
  classGroups — only `shadow` is custom now; a custom scale that isn't
  registered there makes the merge fail silently.
- **Typography is the native Tailwind scale** (`text-xs` … `text-5xl`), with the
  design system's px values overriding the native ones in `tailwind.config.js`.
  The old semantic scale (`display`/`h1`/`title-md`/`label-sm`/…) is gone: it was
  24 tokens for 13 distinct values, 11 exact duplicates and 10 never used.
- **Weight is always explicit** — `text-base font-semibold`, never `text-base`
  alone expecting a default. The old tokens baked a `fontWeight` into each
  `fontSize` tuple and 52% of call sites overrode it anyway (100% of titles), so
  the class never told the truth. `fontSize` tuples now carry size + lineHeight
  only.
- Never use an arbitrary size (`text-[17px]`). `src/lib/typography.test.ts`
  fails on any legacy token or arbitrary size and names the file:line. Genuine
  outliers go in its `ALLOWED_ARBITRARY` list with the reason written down.
- Letter-spacing is the native scale; `tracking-wider` is the one in use, on
  small uppercase labels. The config no longer overrides `letterSpacing` — it
  used to zero out every value except a custom `label`, so 34 of 48 `tracking-*`
  classes in the app rendered nothing.
- `style={{}}` only for what a class cannot express: `LinearGradient` and
  `Animated.View` (no cssInterop registered, they ignore `className`), shadows,
  and genuinely dynamic values. `expo-image` **is** registered, in
  `src/lib/image.ts` — import `Image` from there, never from `expo-image`, or
  `className` is silently ignored and the image renders at size zero.
- **Radius is four values, one per role**: `rounded-sm` 4px (micro),
  `rounded-lg` 12px (control: input, button, chip, icon tile), `rounded-2xl`
  28px (container: card, panel, modal, sheet), `rounded-full` (pill, circle).
  The container→control gap keeps nesting harmonious by construction: an inner
  element always reads less round than its container. Don't add a fifth.
- **Spacing is the numeric scale only** (`p-4`, `gap-2`, `mt-6`). The
  `xs/sm/md/lg/xl` aliases were removed — they were exact duplicates of
  `1/2/4/6/10`. Half-steps (`p-2.5`) are gone too. Note that `h-`, `w-`, `top-`
  and `left-` read the same scale, so a stale alias there fails silently.
- `Card` (`src/components/ui/Card.tsx`) is the card surface — use it instead of
  hand-writing `rounded-2xl border border-white/7 bg-gray-600 p-4`. Pass `p-0`
  for image/menu containers that need the surface without the padding.
- `npm run format` runs prettier + prettier-plugin-tailwindcss, which sorts
  classes (including inside `cn()`).
