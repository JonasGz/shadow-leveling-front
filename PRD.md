# PRD — Shadow Leveling (React Native / Expo)

> App de tracker de treinos gamificado, inspirado no universo Solo Leveling.
> O backend já está pronto (Go + PostgreSQL + Redis). Este documento orienta o
> desenvolvimento do frontend React Native com Expo + NativeWind.

---

## Visão Geral

O Shadow Leveling transforma sua rotina de treinos em uma jornada de RPG.
O usuário completa missões diárias (treinos + tarefas), ganha XP, sobe de nível
e acompanha sua evolução ao longo do tempo — com a estética "Cyber-Athletic":
dark mode de alto contraste que lembra um centro de comando pessoal.

---

## Stack

| Camada        | Tecnologia                                       |
| ------------- | ------------------------------------------------ |
| Framework     | React Native + Expo (SDK 52+)                    |
| Estilos       | NativeWind v4 (TailwindCSS)                      |
| Navegação     | Expo Router (file-based routing)                 |
| Estado global | Zustand                                          |
| HTTP Client   | Axios com interceptors para Bearer Token         |
| Formulários   | React Hook Form + Zod                            |
| Storage local | Expo SecureStore (token) + AsyncStorage          |
| Animações     | React Native Reanimated + Moti                   |
| Fontes        | Inter (via expo-font / @expo-google-fonts/inter) |

---

## Design System

### Brand & Personalidade

Estética **"Cyber-Athletic"** — precisão de wearable premium de fitness fundida
com mecânicas de progressão de RPG moderno. Intenso, motivador, disciplinado.
Sem a poluição visual de RPGs tradicionais: dark mode minimalista e de alto
contraste que trata cada treino e tarefa como uma quest rumo a uma versão
superior de si mesmo.

---

### Paleta de Cores

| Token                       | Hex       | Uso                                                |
| --------------------------- | --------- | -------------------------------------------------- |
| `background`                | `#131314` | Fundo principal (base mais baixa)                  |
| `surface-container-lowest`  | `#0e0e0f` | Input fields, nível mais profundo                  |
| `surface-container-low`     | `#1c1b1c` | Cards padrão                                       |
| `surface-container`         | `#201f20` | Cards elevados                                     |
| `surface-container-high`    | `#2a2a2b` | Modais, bottom sheets                              |
| `surface-container-highest` | `#353436` | FABs, elementos flutuantes                         |
| `surface-bright`            | `#3a393a` | Hover/pressed state                                |
| `on-surface`                | `#e5e2e3` | Texto principal                                    |
| `on-surface-variant`        | `#cbc3d7` | Texto secundário                                   |
| `outline`                   | `#958ea0` | Bordas sutis                                       |
| `outline-variant`           | `#494454` | Divisores, bordas inativos                         |
| `primary`                   | `#d0bcff` | Electric Purple — XP, progressão, ações principais |
| `on-primary`                | `#3c0091` | Texto sobre primary                                |
| `primary-container`         | `#a078ff` | Containers de destaque primário                    |
| `inverse-primary`           | `#6d3bd7` | Variante invertida                                 |
| `secondary`                 | `#4cd7f6` | Cyan — métricas, dados, ações secundárias          |
| `on-secondary`              | `#003640` | Texto sobre secondary                              |
| `secondary-container`       | `#03b5d3` | Containers secundários                             |
| `tertiary`                  | `#ffb869` | Dourado — conquistas, raridade, XP ganho           |
| `on-tertiary`               | `#482900` | Texto sobre tertiary                               |
| `tertiary-container`        | `#ca801e` | Containers terciários                              |
| `error`                     | `#ffb4ab` | Vermelho — erros, missões perdidas, perigo         |
| `on-error`                  | `#690005` | Texto sobre error                                  |
| `error-container`           | `#93000a` | Containers de erro                                 |
| `surface-tint`              | `#d0bcff` | Tint dos surfaces (igual ao primary)               |

**Dificuldade de tarefas (semântico):**

| Nível     | Cor                    | Uso            |
| --------- | ---------------------- | -------------- |
| `easy`    | `#22c55e` (green-500)  | Badge verde    |
| `medium`  | `#eab308` (yellow-500) | Badge âmbar    |
| `hard`    | `#ef4444` (red-500)    | Badge vermelho |
| `no_rank` | `#958ea0` (outline)    | Badge cinza    |

---

### Tipografia — Inter

| Token                | Tamanho | Peso | Line Height | Letter Spacing | Uso                          |
| -------------------- | ------- | ---- | ----------- | -------------- | ---------------------------- |
| `display-lg`         | 48px    | 800  | 56px        | -0.04em        | Títulos heroicos             |
| `display-md`         | 36px    | 800  | 44px        | -0.03em        | Telas de resultado           |
| `headline-lg`        | 28px    | 700  | 36px        | -0.02em        | Cabeçalhos de tela (desktop) |
| `headline-lg-mobile` | 24px    | 700  | 32px        | -0.02em        | Cabeçalhos de tela (mobile)  |
| `title-md`           | 20px    | 600  | 28px        | —              | Títulos de card              |
| `body-lg`            | 18px    | 400  | 28px        | —              | Corpo principal              |
| `body-md`            | 16px    | 400  | 24px        | —              | Corpo secundário             |
| `label-md`           | 14px    | 600  | 20px        | 0.05em         | Labels de HUD (uppercase)    |
| `label-sm`           | 12px    | 700  | 16px        | 0.08em         | Micro-labels, badges         |

---

### Espaçamento (grid de 4px)

| Token | Valor | Uso                                    |
| ----- | ----- | -------------------------------------- |
| `xs`  | 4px   | Espaços mínimos                        |
| `sm`  | 8px   | Gaps internos pequenos                 |
| `md`  | 16px  | Padding padrão de card / gutter mobile |
| `lg`  | 24px  | Padding de seção                       |
| `xl`  | 40px  | Espaçamento entre seções               |

---

### Border Radius

| Token          | Valor  | Uso                            |
| -------------- | ------ | ------------------------------ |
| `rounded-sm`   | 4px    | Badges, chips pequenos         |
| `rounded`      | 8px    | Botões, inputs, cards          |
| `rounded-md`   | 12px   | Cards maiores                  |
| `rounded-lg`   | 16px   | Bottom sheets, modais          |
| `rounded-xl`   | 24px   | Cards heroicos                 |
| `rounded-full` | 9999px | Progress bars, avatares, pills |

---

### Elevation & Depth

Profundidade via camadas tonais + efeito "inner-glow" — sem drop shadow pesada.

- **Borders inativos:** 1px `outline-variant` (`#494454`)
- **Borders ativos/selecionados:** 1px `primary` (`#d0bcff`) ou `secondary` (`#4cd7f6`)
- **Glow de progresso:** soft outer glow roxo/cyan em elementos de XP ativo
- **Input fields:** fundo `surface-container-lowest` com border `outline-variant`; focus → border `primary` com leve glow

---

### Componentes Base

| Componente           | Spec                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Button Primary**   | Fundo `primary` (`#d0bcff`), texto `on-primary`, radius 8px, scale 0.98 no press                   |
| **Button Secondary** | Ghost com border 1px `secondary`, texto `secondary`, radius 8px                                    |
| **Button Danger**    | Fundo `error-container`, texto `error`, radius 8px                                                 |
| **Card**             | Fundo `surface-container-low`, border 1px `outline-variant`, radius 12px, padding 16px             |
| **Input**            | Fundo `surface-container-lowest`, border 1px `outline-variant`, focus border `primary`, radius 8px |
| **Badge/Chip**       | Pill (`rounded-full`), fundo 15% opacidade da cor semântica, texto full-strength                   |
| **Progress Bar**     | `rounded-full`, fill `primary` ou gradiente primary→secondary, pulse animation ao ~80%+            |
| **Progress Ring**    | Stroke espesso, cor `primary`, glow suave                                                          |
| **Bottom Sheet**     | Fundo `surface-container-high`, radius top 16px                                                    |
| **Skeleton**         | Shimmer animado em `surface-container-high`                                                        |

---

## Arquitetura de Arquivos

```
src/
├── app/                    # Expo Router (telas)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── login-verify.tsx
│   │   ├── register.tsx
│   │   └── register-verify.tsx
│   ├── (tabs)/
│   │   ├── index.tsx           # Home / Dashboard
│   │   ├── tasks.tsx           # Tarefas
│   │   ├── workouts.tsx        # Treinos
│   │   ├── history.tsx         # Histórico
│   │   └── profile.tsx         # Perfil
│   ├── workout/
│   │   ├── [id].tsx            # Detalhe do workout
│   │   └── [id]/session.tsx    # Execução do treino (sessão ativa)
│   ├── task/
│   │   └── create.tsx          # Criar tarefa
│   └── _layout.tsx
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, BottomSheet...
│   ├── auth/
│   ├── home/
│   ├── tasks/
│   ├── workouts/
│   ├── session/
│   └── history/
├── services/
│   ├── api.ts              # Instância Axios + interceptors
│   ├── auth.service.ts
│   ├── tasks.service.ts
│   ├── exercises.service.ts
│   ├── workouts.service.ts
│   ├── sessions.service.ts
│   └── metrics.service.ts
├── stores/
│   ├── auth.store.ts
│   ├── tasks.store.ts
│   └── workouts.store.ts
├── hooks/
│   └── useProtectedRoute.ts
└── types/
    └── api.types.ts
```

---

## Fluxo de Navegação

```
Splash Screen
  └─> verificar token no SecureStore
        ├─ sem token → (auth)/login
        └─ com token → (tabs)/index

(auth) — sem tab bar
  ├─ /login          → /login-verify (após POST /auth/login)
  └─ /register       → /register-verify (após POST /auth/register)

(tabs) — tab bar inferior com 5 abas
  ├─ Home            GET /user-metrics/today
  ├─ Tarefas         GET /tasks/day + /tasks/month
  ├─ Treinos         GET /workouts
  ├─ Histórico       GET /workout-sessions + /workout-sessions/missed
  └─ Perfil          GET /auth/me + /auth/sessions

Modais / Stacks sobre as tabs:
  ├─ /workout/[id]               detalhe + editar workout
  ├─ /workout/[id]/session       execução do treino ao vivo
  └─ /task/create                criar nova tarefa
```

---

## Telas e Funcionalidades

---

### TELA 1 — Splash / Onboarding

**Objetivo:** verificar sessão e redirecionar.

- Logo animado com Moti (fade in + scale), cores `primary` e `secondary`
- Lê token do SecureStore
- Se válido → Home; se não → Login

---

### TELA 2 — Login

**Endpoint:** `POST /auth/login`

**Campos:**

- E-mail
- Senha

**Fluxo:**

1. Usuário preenche e submete
2. Requisição ao backend → `200` retorna mensagem de código enviado
3. Navega para `/login-verify` passando o e-mail como param

**UI:**

- Fundo `background` (#131314) com partículas/glow roxo sutil
- Logo no topo com glow `primary`
- Card centralizado (`surface-container-low`) com inputs estilizados
- Botão primário "Entrar" em `primary`
- Link "Não tem conta? Registrar" em `secondary`

---

### TELA 3 — Verificar Código (Login)

**Endpoint:** `POST /auth/login/verify`

**UI:**

- 6 inputs OTP em `surface-container-lowest` com focus border `primary`
- Countdown de reenvio (60s) → `POST /auth/login/resend`
- Ao verificar: salva token no SecureStore → navega para Home
- Animação de sucesso com glow `primary`

---

### TELA 4 — Registro

**Endpoint:** `POST /auth/register`

**Campos:**

- E-mail
- Senha (mín. 8 chars)
- Confirmar senha

**UI:** mesma estrutura do Login com label "Criar Conta"

---

### TELA 5 — Verificar Código (Registro)

**Endpoint:** `POST /auth/register/verify`

**UI:** igual ao de Login/Verify

---

### TELA 6 — Home / Dashboard

**Endpoint:** `GET /user-metrics/today`

**Seções:**

#### Header

- Saudação com e-mail do usuário (label-md uppercase, cor `on-surface-variant`)
- Data atual formatada (ex: "QUINTA, 15 MAI") — estilo HUD
- Avatar placeholder com anel de progresso em `primary`

#### Barra de Progresso Geral

- `completed / total` missões do dia
- Barra `rounded-full` com fill gradiente `primary`→`secondary`
- Pulse animation quando ≥80% completo
- Texto: "2 DE 5 MISSÕES COMPLETAS" (label-md uppercase, `on-surface-variant`)

#### Missões de Treino

- Lista dos workouts do dia
- Card `surface-container-low` com border `outline-variant`
- Chip de status: ✓ verde (`success`) ou ● roxo pulsante (`primary`)
- Badge "FEITO HOJE" em `primary` com 15% opacidade de fundo
- Tap → `/workout/[id]`; botão "INICIAR" → `/workout/[id]/session`

#### Missões de Tarefas

- Lista de tarefas do dia (não opcionais primeiro)
- Tap para concluir → `PATCH /tasks/{id}/complete` com animação de check
- Badge de nível: pill com cor semântica (easy/medium/hard)
- Tarefas opcionais com tag "OPCIONAL" em `on-surface-variant`

#### Treinos Perdidos (se houver)

- Card de alerta com border 1px `error`, fundo `error-container` 10% opacidade
- Estética de "quest falhada"

---

### TELA 7 — Tarefas

**Endpoints:** `GET /tasks/month`, `GET /tasks/day`, `POST /tasks`

**Seções:**

#### Calendário Mensal

- Grade de dias do mês sobre fundo `background`
- Dot indicator: `primary` = todas concluídas, `tertiary` = parcial, sem dot = sem tarefas
- Dia selecionado: border `primary` com glow sutil
- Tap no dia → carrega lista via `GET /tasks/day?date=YYYY-MM-DD`

#### Lista do Dia Selecionado

- Cards com:
  - Título em `body-md` (`on-surface`)
  - Descrição em `body-md` (`on-surface-variant`)
  - Badge de nível (pill colorido)
  - Ícone de recorrência em `on-surface-variant`
  - Checkbox animado → `PATCH /tasks/{id}/complete`
  - Tag "OPCIONAL" em italic se `is_optional: true`

#### FAB

- Botão "+" circular em `primary`, posição bottom-right
- Navega para `/task/create`

---

### TELA 8 — Criar Tarefa

**Endpoint:** `POST /tasks`

**Campos:**

- Título (obrigatório)
- Descrição (opcional)
- Nível: chips selecionáveis (easy / medium / hard / no_rank) com cores semânticas
- Data inicial (date picker com estética dark)
- Data final (date picker)
- Recorrência: seletor (one_time / daily / weekly / monthly / custom)
  - Se `custom`: seletor de dias da semana (pills toggleáveis)
- É opcional? (toggle com thumb `primary`)

---

### TELA 9 — Workouts (Lista)

**Endpoint:** `GET /workouts`

**UI:**

- Lista de cards (`surface-container-low`) por workout
- Cada card:
  - Nome em `title-md` (`on-surface`)
  - Chips de dias da semana (`outline-variant` / `primary` se hoje)
  - Contador de exercícios em `label-sm` (`on-surface-variant`)
  - Badge "FEITO HOJE" em `primary` se `done_today: true`
  - Indicador ativo/inativo
- Tap → `/workout/[id]`
- FAB "+" → modal de criação de workout

---

### TELA 10 — Detalhe do Workout

**Endpoints:** `GET /workouts/{id}`, `PUT /workouts/{id}`, `DELETE /workouts/{id}`,
`POST /workouts/{id}/exercises`, `PATCH /workouts/{id}/exercises/reorder`

**Seções:**

#### Header do Workout

- Nome em `headline-lg-mobile`, descrição em `body-md` (`on-surface-variant`)
- Chips de dias da semana
- Menu: Editar (bottom sheet com form) | Deletar (com confirmação)

#### Lista de Exercícios

- Drag-to-reorder → `PATCH /workouts/{id}/exercises/reorder`
- Cada item em card `surface-container`:
  - Ícone RPG (espada/shield/raio) em container `rounded` com bg `primary` 15%
  - Nome do exercício em `body-md`
  - Séries × reps: "4 × 8-12" em `label-md` `secondary`
  - Observação em `label-sm` `on-surface-variant`
- Swipe left → deletar (`error`)
- Tap → editar (bottom sheet)

#### Adicionar Exercício

- Botão "ADICIONAR EXERCÍCIO" ghost `secondary`
- Bottom sheet com:
  - Search input → `GET /exercises?search=...`
  - Lista de resultados paginada (cursor-based)
  - Formulário de séries, reps, duração, nota
  - Opção "CRIAR EXERCÍCIO" → `POST /exercises`

#### Progresso

- Botão "VER PROGRESSO" → `GET /workouts/{id}/progress`
- Gráfico de linha por exercício (peso/reps) com cor `secondary`

#### CTA Principal

- Botão "INICIAR SESSÃO" em `primary`, full-width

---

### TELA 11 — Sessão de Treino (Execução)

**Endpoints:** `POST /workout-sessions`, `POST /workout-sessions/{id}/sets`,
`PUT /workout-sessions/{id}/sets/{setId}`, `DELETE /workout-sessions/{id}/sets/{setId}`,
`PUT /workout-sessions/{id}` (finalizar)

**Fluxo:**

1. Ao abrir → `POST /workout-sessions` (status: incomplete)
2. Para cada exercício do workout:
   - Nome + séries planejadas × reps alvo
   - Para cada série: inputs grandes de `reps` e `weight` (ou `duration`)
   - Botão "✓ REGISTRAR" → `POST /workout-sessions/{id}/sets`
   - Série registrada com check `primary` + possibilidade de editar/deletar
3. Botão "FINALIZAR TREINO" → `PUT /workout-sessions/{id}` (status: complete)
   - Animação de conclusão (glow dourado `tertiary`)
   - Redireciona para Home ou Histórico

**UI:**

- Timer de duração no header (contador crescente, cor `secondary`)
- Progress bar de séries concluídas em `primary`
- Cada exercício em accordion (`surface-container`)
- Inputs numéricos grandes (44px+ de altura) — fácil com mãos suadas
- Teclado numérico com `returnKeyType="done"`

---

### TELA 12 — Histórico

**Endpoints:** `GET /workout-sessions`, `GET /workout-sessions/missed`,
`GET /workout-sessions/{id}`

**Seções:**

#### Sessões Realizadas

- Lista com filtro de data (`from` / `to`)
- Card por sessão: nome do workout, data, chip de status colorido
  - `complete` → chip `primary`
  - `incomplete` → chip `tertiary`
  - `skipped` → chip `error`
- Tap → detalhe com todos os sets registrados

#### Treinos Perdidos

- Aba ou seção separada
- Cards com border 1px `error`, bg `error-container` 10%
- Data + nome do workout — estética de "missão falhada"

---

### TELA 13 — Perfil

**Endpoints:** `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/{id}`,
`POST /auth/logout`

**Seções:**

#### Info do Usuário

- Avatar circular `surface-container-high` com anel `primary`
- E-mail em `body-lg`
- "CAÇADOR DESDE 01/01/2024" em `label-sm` uppercase `on-surface-variant`

#### Sessões Ativas

- Lista de sessões com user agent e data
- Botão "REVOGAR" ghost `error` por sessão (com confirmação)

#### Ações

- Botão "SAIR" danger full-width → limpa SecureStore → Login

---

## Componentes UI Reutilizáveis

| Componente       | Descrição                                                         |
| ---------------- | ----------------------------------------------------------------- |
| `Button`         | Variantes: primary, secondary, ghost, danger; scale 0.98 no press |
| `Card`           | `surface-container-low`, border `outline-variant`, radius 12px    |
| `Badge`          | Pill colorido com 15% opacidade de fundo, texto full-strength     |
| `Input`          | Fundo `surface-container-lowest`, focus border `primary` + glow   |
| `OTPInput`       | 6 campos conectados, focus automático, paste support              |
| `ProgressBar`    | `rounded-full`, gradiente primary→secondary, pulse acima de 80%   |
| `ProgressRing`   | SVG stroke circular, cor `primary`, glow externo                  |
| `Avatar`         | Placeholder com ícone RPG + anel de progresso                     |
| `LoadingOverlay` | Spinner `primary` sobre fundo semitransparente                    |
| `EmptyState`     | Ícone RPG + headline + descrição para listas vazias               |
| `BottomSheet`    | Drag handle, fundo `surface-container-high`, radius top 16px      |
| `Skeleton`       | Shimmer animado em `surface-container-high`                       |
| `Toast`          | Notificação flutuante com variantes success/error/warning         |

---

## Tratamento de Erros e Estados

| Situação               | Comportamento                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| Token expirado (401)   | Interceptor limpa SecureStore + redireciona para Login                 |
| Rate limit (429)       | Toast warning: "Muitas tentativas. Aguarde antes de tentar novamente." |
| Sem internet           | Banner persistente no topo em `error-container`                        |
| Lista vazia            | EmptyState contextual                                                  |
| Erro de servidor (500) | Toast error genérico                                                   |
| Conflito (409)         | Mensagem inline no campo (e-mail já cadastrado)                        |
| Código inválido (422)  | Shake animation no OTPInput + mensagem de erro                         |

---

## HTML das Telas (Design)

> Cole abaixo o HTML gerado pela sua IA de design para cada tela.
> Organize por seção para facilitar a implementação.

---

### Splash / Onboarding

```html
<!DOCTYPE html>

<html class="dark" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Shadow Leveling | Initialization</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "secondary-fixed-dim": "#4cd7f6",
              "on-tertiary-container": "#3f2300",
              "tertiary-container": "#ca801e",
              surface: "#131314",
              "secondary-fixed": "#acedff",
              "on-surface-variant": "#cbc3d7",
              "surface-container-low": "#1c1b1c",
              "surface-container-high": "#2a2a2b",
              "on-secondary-fixed": "#001f26",
              "on-tertiary": "#482900",
              secondary: "#4cd7f6",
              "on-background": "#e5e2e3",
              primary: "#d0bcff",
              "on-primary-fixed-variant": "#5516be",
              "on-primary-fixed": "#23005c",
              "on-secondary": "#003640",
              "error-container": "#93000a",
              "on-secondary-container": "#00424e",
              "secondary-container": "#03b5d3",
              "surface-bright": "#3a393a",
              "tertiary-fixed": "#ffdcbb",
              "inverse-surface": "#e5e2e3",
              "surface-container-lowest": "#0e0e0f",
              "on-primary": "#3c0091",
              "on-error": "#690005",
              "surface-container": "#201f20",
              "surface-variant": "#353436",
              "inverse-primary": "#6d3bd7",
              "primary-fixed": "#e9ddff",
              "surface-container-highest": "#353436",
              tertiary: "#ffb869",
              "outline-variant": "#494454",
              outline: "#958ea0",
              "on-tertiary-fixed-variant": "#673d00",
              "on-error-container": "#ffdad6",
              "primary-container": "#a078ff",
              "inverse-on-surface": "#313031",
              "surface-tint": "#d0bcff",
              "on-surface": "#e5e2e3",
              "on-primary-container": "#340080",
              error: "#ffb4ab",
              "on-secondary-fixed-variant": "#004e5c",
              "surface-dim": "#131314",
              "tertiary-fixed-dim": "#ffb869",
              "primary-fixed-dim": "#d0bcff",
              "on-tertiary-fixed": "#2c1700",
              background: "#131314",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              sm: "8px",
              md: "16px",
              xs: "4px",
              base: "4px",
              "margin-mobile": "16px",
              xl: "40px",
              gutter: "16px",
              "margin-desktop": "32px",
              lg: "24px",
            },
            fontFamily: {
              "headline-lg": ["Inter"],
              "display-md": ["Inter"],
              "label-sm": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "body-lg": ["Inter"],
              "title-md": ["Inter"],
              "label-md": ["Inter"],
              "body-md": ["Inter"],
              "display-lg": ["Inter"],
            },
            fontSize: {
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
            },
          },
        },
      };
    </script>
    <style>
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }

      /* Custom radial glow for the splash screen effect */
      .brand-glow {
        background: radial-gradient(
          circle,
          rgba(208, 188, 255, 0.15) 0%,
          rgba(19, 19, 20, 0) 70%
        );
      }

      /* Subtle pulse for the status text */
      @keyframes pulse-opacity {
        0%,
        100% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
      }
      .animate-protocol-pulse {
        animation: pulse-opacity 2s infinite ease-in-out;
      }

      /* Loading bar progress simulation */
      @keyframes progress-fill {
        0% {
          width: 0%;
        }
        30% {
          width: 20%;
        }
        60% {
          width: 45%;
        }
        100% {
          width: 100%;
        }
      }
      .loading-progress-bar {
        animation: progress-fill 4s infinite linear;
      }
    </style>
  </head>
  <body
    class="font-body-md overflow-hidden bg-surface text-on-surface selection:bg-primary selection:text-on-primary"
  >
    <!-- Splash Screen Canvas -->
    <main
      class="px-margin-mobile relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <!-- Background Texture/Shadows -->
      <div class="absolute inset-0 z-0 bg-[#131314]">
        <div
          class="from-surface-container-low/40 absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] via-surface to-surface"
        ></div>
        <div
          class="brand-glow pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-60"
        ></div>
      </div>
      <!-- Central Branding Section -->
      <section
        class="relative z-10 flex flex-col items-center gap-lg text-center"
      >
        <!-- Logo Container with Shadow Elevation Logic -->
        <div class="group relative">
          <!-- Inner Glow -->
          <div
            class="absolute inset-0 scale-125 rounded-full bg-primary/20 opacity-50 blur-3xl transition-opacity duration-1000 group-hover:opacity-75"
          ></div>
          <!-- Main Logo Image -->
          <div
            class="relative h-40 w-40 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container p-xs shadow-2xl md:h-56 md:w-56"
          >
            <img
              alt="Shadow Leveling Logo"
              class="h-full w-full object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-d_ggX67TyM-dlCn9YAX39-e3w8beQLlFUhrjcEeeHRqkvgfgzYZmPDs5X9xAfzx5hYMqAnD1KYRMH6ypa0NRdbc2SGTaJeqjm8a2aQ4scnfijxAyJtQQRL5TLbkCiASvgTWWKfrOQPgu8fs2k4a7y84qU1Utn_G9_c72rMzuSD5EOhuEPc0PzyJFRiTyg6OW2wyvJ92fyLFDdY2ljnSZN8SZPiROReQ8NsYOMH3CRKZ8UakW2lAme8DBH8LKJo4J_lWcIARlnpk"
            />
          </div>
        </div>
        <!-- Brand Headline (Styled as Premium Anchor) -->
        <div class="mt-md">
          <h1
            class="font-display-md text-display-md uppercase italic tracking-tighter text-primary"
          >
            SHADOW LEVELING
          </h1>
          <p
            class="font-label-md mt-xs text-label-md tracking-[0.4em] text-on-surface-variant opacity-80"
          >
            PREMIUM ATHLETIC PROTOCOL
          </p>
        </div>
      </section>
      <!-- Bottom Loading State (As requested) -->
      <footer
        class="absolute bottom-16 left-0 z-20 flex w-full flex-col items-center gap-md px-xl"
      >
        <!-- Minimalist Status Text -->
        <div class="animate-protocol-pulse">
          <span
            class="font-label-sm text-label-sm uppercase tracking-[0.5em] text-primary-fixed-dim"
          >
            INITIALIZING PROTOCOL...
          </span>
        </div>
        <!-- Progress Track -->
        <div
          class="bg-surface-container-highest h-[2px] w-full max-w-xs overflow-hidden rounded-full border border-outline-variant/10"
        >
          <div
            class="loading-progress-bar h-full bg-primary shadow-[0_0_12px_rgba(208,188,255,0.6)]"
          ></div>
        </div>
        <!-- Sub-status / Versioning -->
        <div class="mt-xs">
          <span
            class="font-label-sm text-[10px] tracking-widest text-on-surface-variant opacity-40"
          >
            VERSION 4.2.0-S // SECURE_LINK_ESTABLISHED
          </span>
        </div>
      </footer>
      <!-- Decorative Corner Elements (Cyber-Athletic Aesthetic) -->
      <div
        class="pointer-events-none absolute left-8 top-8 h-12 w-12 border-l border-t border-outline-variant/40"
      ></div>
      <div
        class="pointer-events-none absolute right-8 top-8 h-12 w-12 border-r border-t border-outline-variant/40"
      ></div>
      <div
        class="pointer-events-none absolute bottom-8 left-8 h-12 w-12 border-b border-l border-outline-variant/40"
      ></div>
      <div
        class="pointer-events-none absolute bottom-8 right-8 h-12 w-12 border-b border-r border-outline-variant/40"
      ></div>
    </main>
    <!-- Note: Navigation Shells (TopAppBar, BottomNavBar) are suppressed per request for Splash Screen -->
  </body>
</html>
```

---

### Login

```html
<!DOCTYPE html>

<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Shadow Leveling - Entrar</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary": "#003640",
              "surface-container": "#201f20",
              "tertiary-container": "#ca801e",
              outline: "#958ea0",
              "surface-container-lowest": "#0e0e0f",
              "on-error": "#690005",
              "on-background": "#e5e2e3",
              "surface-bright": "#3a393a",
              "secondary-fixed-dim": "#4cd7f6",
              "error-container": "#93000a",
              "primary-fixed": "#e9ddff",
              "outline-variant": "#494454",
              background: "#131314",
              "on-tertiary": "#482900",
              "inverse-surface": "#e5e2e3",
              "surface-dim": "#131314",
              "on-primary-fixed-variant": "#5516be",
              "secondary-fixed": "#acedff",
              "tertiary-fixed": "#ffdcbb",
              "inverse-on-surface": "#313031",
              "surface-variant": "#353436",
              "surface-tint": "#d0bcff",
              "surface-container-low": "#1c1b1c",
              "primary-container": "#a078ff",
              "on-tertiary-fixed-variant": "#673d00",
              "on-error-container": "#ffdad6",
              primary: "#d0bcff",
              "on-surface": "#e5e2e3",
              "surface-container-highest": "#353436",
              "on-secondary-fixed": "#001f26",
              "on-secondary-container": "#00424e",
              "surface-container-high": "#2a2a2b",
              "secondary-container": "#03b5d3",
              "inverse-primary": "#6d3bd7",
              "tertiary-fixed-dim": "#ffb869",
              secondary: "#4cd7f6",
              "primary-fixed-dim": "#d0bcff",
              "on-primary-container": "#340080",
              tertiary: "#ffb869",
              surface: "#131314",
              "on-tertiary-fixed": "#2c1700",
              "on-tertiary-container": "#3f2300",
              "on-primary-fixed": "#23005c",
              "on-secondary-fixed-variant": "#004e5c",
              error: "#ffb4ab",
              "on-primary": "#3c0091",
              "on-surface-variant": "#cbc3d7",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              "margin-mobile": "16px",
              base: "4px",
              "margin-desktop": "32px",
              md: "16px",
              lg: "24px",
              xs: "4px",
              gutter: "16px",
              xl: "40px",
              sm: "8px",
            },
            fontFamily: {
              "display-md": ["Inter"],
              "headline-lg": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "label-sm": ["Inter"],
              "display-lg": ["Inter"],
              "label-md": ["Inter"],
              "body-md": ["Inter"],
              "body-lg": ["Inter"],
              "title-md": ["Inter"],
            },
            fontSize: {
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
            },
          },
        },
      };
    </script>
    <style>
      body {
        background-color: #131314;
        color: #e5e2e3;
        font-family: "Inter", sans-serif;
      }
      .cyber-glow {
        box-shadow: 0 0 15px rgba(208, 188, 255, 0.3);
      }
      .input-focus-glow:focus-within {
        box-shadow: 0 0 10px rgba(208, 188, 255, 0.2);
        border-color: #d0bcff;
      }
    </style>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body
    class="p-margin-mobile md:p-margin-desktop relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-dim"
  >
    <!-- Background Decor -->
    <div
      class="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden opacity-20"
    >
      <div
        class="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary blur-[120px]"
      ></div>
      <div
        class="absolute bottom-[-5%] right-[-5%] h-[30%] w-[30%] rounded-full bg-secondary blur-[100px]"
      ></div>
    </div>
    <main class="z-10 w-full max-w-[440px]">
      <!-- Logo/Identity Area -->
      <div class="mb-xl flex flex-col items-center">
        <div
          class="bg-surface-container-high cyber-glow mb-md flex h-16 w-16 items-center justify-center rounded-xl border border-outline-variant/30"
        >
          <span
            class="material-symbols-outlined text-[40px] text-primary"
            data-icon="sword"
            >swords</span
          >
        </div>
        <h1
          class="font-display-md text-display-md uppercase tracking-widest text-primary drop-shadow-[0_0_8px_rgba(208,188,255,0.5)]"
        >
          SHADOW LEVELING
        </h1>
        <p
          class="font-label-sm mt-2 text-label-sm uppercase tracking-[0.2em] text-outline"
        >
          Elite Task Protocol
        </p>
      </div>
      <!-- Auth Card -->
      <div
        class="bg-surface-container-low relative overflow-hidden rounded-xl border border-outline-variant/20 p-lg shadow-2xl md:p-xl"
      >
        <!-- Subtle Texture -->
        <div class="absolute right-0 top-0 p-4 opacity-10">
          <span
            class="material-symbols-outlined text-display-lg"
            data-icon="shield"
            >shield</span
          >
        </div>
        <div class="mb-lg">
          <h2
            class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg"
          >
            Entrar
          </h2>
          <div class="mt-2 h-1 w-12 rounded-full bg-primary"></div>
        </div>
        <form class="space-y-lg" onsubmit="return false;">
          <!-- Email Field -->
          <div class="space-y-sm">
            <label
              class="font-label-md block text-label-md uppercase tracking-wider text-on-surface-variant"
              >Email</label
            >
            <div
              class="input-focus-glow bg-surface-container-lowest group relative rounded-lg border border-outline-variant/50 transition-all"
            >
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary"
                data-icon="mail"
                >mail</span
              >
              <input
                class="font-body-md w-full border-none bg-transparent py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-0"
                placeholder="nome@exemplo.com"
                type="email"
              />
            </div>
          </div>
          <!-- Password Field -->
          <div class="space-y-sm">
            <div class="flex items-end justify-between">
              <label
                class="font-label-md block text-label-md uppercase tracking-wider text-on-surface-variant"
                >Senha</label
              >
              <a
                class="font-label-sm text-label-sm text-primary transition-all hover:underline"
                href="#"
                >Esqueci minha senha</a
              >
            </div>
            <div
              class="input-focus-glow bg-surface-container-lowest group relative rounded-lg border border-outline-variant/50 transition-all"
            >
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary"
                data-icon="lock"
                >lock</span
              >
              <input
                class="font-body-md w-full border-none bg-transparent py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/50 focus:ring-0"
                placeholder="••••••••"
                type="password"
              />
              <button
                class="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                type="button"
              >
                <span class="material-symbols-outlined" data-icon="visibility"
                  >visibility</span
                >
              </button>
            </div>
          </div>
          <!-- Submit Button -->
          <button
            class="font-title-md cyber-glow mt-lg flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-on-primary transition-all hover:bg-primary-container active:scale-[0.98]"
            type="submit"
          >
            <span>Enviar código</span>
            <span class="material-symbols-outlined" data-icon="bolt">bolt</span>
          </button>
        </form>
        <!-- Secondary Action -->
        <div class="mt-xl border-t border-outline-variant/10 pt-lg text-center">
          <p class="font-body-md text-on-surface-variant">
            Novo no Shadow?
            <a
              class="ml-1 font-semibold text-secondary transition-colors hover:text-secondary-fixed"
              href="#"
              >Criar conta</a
            >
          </p>
        </div>
      </div>
      <!-- System Status Footer -->
      <div class="mt-lg flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span class="font-label-sm text-label-sm text-outline"
            >PROTOCOLO ATIVO</span
          >
        </div>
        <div class="flex gap-4">
          <span
            class="material-symbols-outlined text-sm text-outline"
            data-icon="shield_lock"
            >shield_lock</span
          >
          <span
            class="material-symbols-outlined text-sm text-outline"
            data-icon="verified_user"
            >verified_user</span
          >
        </div>
      </div>
    </main>
    <!-- Visual Anchor - Cyber Athlete Imagery (Hidden on small screens, decorative on large) -->
    <div
      class="pointer-events-none absolute bottom-10 right-10 hidden h-[300px] w-[300px] opacity-10 lg:block"
    >
      <img
        class="h-full w-full object-contain grayscale"
        data-alt="A futuristic, high-contrast digital illustration of a cybernetic athlete performing a focused sprint within a dark void. Glowing purple neon data streams and polygonal geometric patterns swirl around the figure, emphasizing speed and technological enhancement. The aesthetic is clean, minimalist, and intensely modern, mirroring the deep blacks and electric purple accents of the Shadow Leveling brand identity. Dramatic side-lighting creates sharp silhouettes and a professional gaming command center atmosphere."
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3r7PVG1xXBZYjFqPZNHHf56061tGU-Dywl61jHjiBZbZ0XMUm7YwWxCC-cBthI2TnDOMYtaemJe2-5DjVjANTYLZyFYU8al6qk9Sb7tqJgXtNwRdUxlXnHom3iMBKsqIj4tKqoMxWOh5_TRc-iCEwt1dSZX62EOCg6nEy41OeZ5na-y9zM8LuIn-8GVa0qupMhmTm98UcEaeqY9A5z7Uw3mauNLn4w7WycHIzyIf6tGf7bOeAOJxzU-9TAHh3okZYx-4vMFNVTPo"
      />
    </div>
  </body>
</html>
```

---

### Verificar Código (Login / Registro)

```html
<!DOCTYPE html>

<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <style>
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }
      /* Custom glow for the Cyber-Athletic aesthetic */
      .glow-primary {
        box-shadow: 0 0 15px rgba(208, 188, 255, 0.3);
      }
      .glow-secondary {
        box-shadow: 0 0 15px rgba(76, 215, 246, 0.3);
      }
      .otp-input:focus {
        box-shadow: 0 0 12px rgba(208, 188, 255, 0.5);
        border-color: #d0bcff;
      }
    </style>
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary": "#003640",
              "surface-container": "#201f20",
              "tertiary-container": "#ca801e",
              outline: "#958ea0",
              "surface-container-lowest": "#0e0e0f",
              "on-error": "#690005",
              "on-background": "#e5e2e3",
              "surface-bright": "#3a393a",
              "secondary-fixed-dim": "#4cd7f6",
              "error-container": "#93000a",
              "primary-fixed": "#e9ddff",
              "outline-variant": "#494454",
              background: "#131314",
              "on-tertiary": "#482900",
              "inverse-surface": "#e5e2e3",
              "surface-dim": "#131314",
              "on-primary-fixed-variant": "#5516be",
              "secondary-fixed": "#acedff",
              "tertiary-fixed": "#ffdcbb",
              "inverse-on-surface": "#313031",
              "surface-variant": "#353436",
              "surface-tint": "#d0bcff",
              "surface-container-low": "#1c1b1c",
              "primary-container": "#a078ff",
              "on-tertiary-fixed-variant": "#673d00",
              "on-error-container": "#ffdad6",
              primary: "#d0bcff",
              "on-surface": "#e5e2e3",
              "surface-container-highest": "#353436",
              "on-secondary-fixed": "#001f26",
              "on-secondary-container": "#00424e",
              "surface-container-high": "#2a2a2b",
              "secondary-container": "#03b5d3",
              "inverse-primary": "#6d3bd7",
              "tertiary-fixed-dim": "#ffb869",
              secondary: "#4cd7f6",
              "primary-fixed-dim": "#d0bcff",
              "on-primary-container": "#340080",
              tertiary: "#ffb869",
              surface: "#131314",
              "on-tertiary-fixed": "#2c1700",
              "on-tertiary-container": "#3f2300",
              "on-primary-fixed": "#23005c",
              "on-secondary-fixed-variant": "#004e5c",
              error: "#ffb4ab",
              "on-primary": "#3c0091",
              "on-surface-variant": "#cbc3d7",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              "margin-mobile": "16px",
              base: "4px",
              "margin-desktop": "32px",
              md: "16px",
              lg: "24px",
              xs: "4px",
              gutter: "16px",
              xl: "40px",
              sm: "8px",
            },
            fontFamily: {
              "display-md": ["Inter"],
              "headline-lg": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "label-sm": ["Inter"],
              "display-lg": ["Inter"],
              "label-md": ["Inter"],
              "body-md": ["Inter"],
              "body-lg": ["Inter"],
              "title-md": ["Inter"],
            },
            fontSize: {
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
            },
          },
        },
      };
    </script>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body
    class="text-on-background font-body-md flex min-h-screen flex-col bg-background selection:bg-primary selection:text-on-primary"
  >
    <!-- Hero Branding Section (Transactional Suppression of Nav) -->
    <header class="flex w-full justify-center pb-lg pt-xl">
      <h1
        class="font-display-md text-display-md uppercase tracking-widest text-primary drop-shadow-[0_0_12px_rgba(208,188,255,0.4)]"
      >
        SHADOW LEVELING
      </h1>
    </header>
    <main class="px-margin-mobile flex flex-grow items-center justify-center">
      <div
        class="bg-surface-container-low relative w-full max-w-[440px] overflow-hidden rounded-xl border border-outline-variant/20 p-lg md:p-xl"
      >
        <!-- Cyber Decor Elements -->
        <div
          class="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/5 blur-3xl"
        ></div>
        <!-- Title & Subtitle -->
        <div class="mb-xl text-center">
          <h2
            class="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-sm uppercase tracking-tight"
          >
            Verifique seu e-mail
          </h2>
          <p class="font-body-md text-on-surface-variant">
            Insira o código de 6 dígitos enviado para
            <span class="font-semibold text-secondary">jo***@gmail.com</span>
          </p>
        </div>
        <!-- OTP Input Section -->
        <form action="#" class="space-y-xl" method="POST">
          <div class="flex justify-between gap-2 md:gap-sm">
            <!-- Individual digit boxes -->
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
            <input
              class="otp-input font-display-md bg-surface-container-highest aspect-square w-full rounded-lg border border-outline-variant text-center text-display-md text-primary outline-none transition-all duration-200 focus:ring-0"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]*"
              type="text"
            />
          </div>
          <!-- Action Button -->
          <button
            class="font-label-md glow-primary flex w-full items-center justify-center gap-sm rounded-lg bg-primary px-lg py-md text-label-md uppercase tracking-widest text-on-primary transition-all hover:brightness-110 active:scale-[0.98]"
            type="submit"
          >
            <span>Verificar</span>
            <span class="material-symbols-outlined text-[20px]" data-icon="bolt"
              >bolt</span
            >
          </button>
        </form>
        <!-- Re-send Section -->
        <div class="mt-xl space-y-md text-center">
          <p class="font-body-md text-on-surface-variant">
            Não recebeu o código?
          </p>
          <a
            class="font-label-md group relative inline-block text-label-md uppercase tracking-wider text-secondary transition-colors duration-200 hover:text-primary"
            href="#"
          >
            Reenviar código
            <span
              class="absolute bottom-0 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full"
            ></span>
          </a>
        </div>
      </div>
    </main>
    <!-- Footer Visual Accents -->
    <footer class="flex flex-col items-center gap-sm py-lg">
      <div class="flex items-center gap-xs">
        <span class="h-1.5 w-1.5 rounded-full bg-secondary"></span>
        <span class="h-1.5 w-1.5 rounded-full bg-secondary/40"></span>
        <span class="h-1.5 w-1.5 rounded-full bg-secondary/20"></span>
      </div>
      <p
        class="font-label-sm text-label-sm uppercase tracking-tighter text-outline opacity-50"
      >
        Quest Authorization Module v2.4.0
      </p>
    </footer>
    <!-- Background Atmospheric Image -->
    <div class="pointer-events-none fixed inset-0 -z-10 opacity-20">
      <img
        alt=""
        class="h-full w-full object-cover brightness-[0.2] grayscale"
        data-alt="A dark cinematic background featuring blurred digital HUD elements and high-tech interface lines in a deep space setting. The lighting is dominated by subtle, moody purple and cyan glows that bleed from the edges of the frame. The overall atmosphere is intense and high-performance, reflecting a futuristic cyber-athletic command center aesthetic with clean minimalist structures."
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbUcmTW9xpeAjKj5jPlWRgM5ck371GB5wB15U2QDOrVsl7cnyOM1z2fNBQNYJa2dbuv9Hs0aL4VxReUHr4i7mm2Z-UWCZxeHfDO4of8dPWyfutsaJgj-XS1d2hPMSTy6iqOnoMS5fy14KA7kHOU81hkDrClICL17XI6iwyQS7H3zb6pP6uD7IGZ8LwSWRDOnb8i4nFGoZGebDYiRXqkEnz70WtD6-jEsjk1Bnkvx5InBt8FtCk7rTyNDxeA1dfEt6gg9EBuCedJzk"
      />
    </div>
  </body>
</html>
```

---

### Registro

```html
<!DOCTYPE html>

<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Shadow Leveling - Criar Conta</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary": "#003640",
              "surface-container": "#201f20",
              "tertiary-container": "#ca801e",
              outline: "#958ea0",
              "surface-container-lowest": "#0e0e0f",
              "on-error": "#690005",
              "on-background": "#e5e2e3",
              "surface-bright": "#3a393a",
              "secondary-fixed-dim": "#4cd7f6",
              "error-container": "#93000a",
              "primary-fixed": "#e9ddff",
              "outline-variant": "#494454",
              background: "#131314",
              "on-tertiary": "#482900",
              "inverse-surface": "#e5e2e3",
              "surface-dim": "#131314",
              "on-primary-fixed-variant": "#5516be",
              "secondary-fixed": "#acedff",
              "tertiary-fixed": "#ffdcbb",
              "inverse-on-surface": "#313031",
              "surface-variant": "#353436",
              "surface-tint": "#d0bcff",
              "surface-container-low": "#1c1b1c",
              "primary-container": "#a078ff",
              "on-tertiary-fixed-variant": "#673d00",
              "on-error-container": "#ffdad6",
              primary: "#d0bcff",
              "on-surface": "#e5e2e3",
              "surface-container-highest": "#353436",
              "on-secondary-fixed": "#001f26",
              "on-secondary-container": "#00424e",
              "surface-container-high": "#2a2a2b",
              "secondary-container": "#03b5d3",
              "inverse-primary": "#6d3bd7",
              "tertiary-fixed-dim": "#ffb869",
              secondary: "#4cd7f6",
              "primary-fixed-dim": "#d0bcff",
              "on-primary-container": "#340080",
              tertiary: "#ffb869",
              surface: "#131314",
              "on-tertiary-fixed": "#2c1700",
              "on-tertiary-container": "#3f2300",
              "on-primary-fixed": "#23005c",
              "on-secondary-fixed-variant": "#004e5c",
              error: "#ffb4ab",
              "on-primary": "#3c0091",
              "on-surface-variant": "#cbc3d7",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              "margin-mobile": "16px",
              base: "4px",
              "margin-desktop": "32px",
              md: "16px",
              lg: "24px",
              xs: "4px",
              gutter: "16px",
              xl: "40px",
              sm: "8px",
            },
            fontFamily: {
              "display-md": ["Inter"],
              "headline-lg": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "label-sm": ["Inter"],
              "display-lg": ["Inter"],
              "label-md": ["Inter"],
              "body-md": ["Inter"],
              "body-lg": ["Inter"],
              "title-md": ["Inter"],
            },
            fontSize: {
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
            },
          },
        },
      };
    </script>
    <style>
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }
      .strength-segment {
        height: 4px;
        border-radius: 2px;
        flex-grow: 1;
        background-color: #353436;
        transition: all 0.3s ease;
      }
      .strength-segment.active-purple {
        background-color: #d0bcff;
        box-shadow: 0 0 8px rgba(208, 188, 255, 0.6);
      }
      .cyber-grid {
        background-image:
          linear-gradient(
            to right,
            rgba(208, 188, 255, 0.05) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(208, 188, 255, 0.05) 1px,
            transparent 1px
          );
        background-size: 40px 40px;
      }
    </style>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body
    class="text-on-background font-body-md flex min-h-screen flex-col bg-background"
  >
    <!-- Hero Backdrop / Visual Decoration -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div class="cyber-grid absolute inset-0"></div>
      <div
        class="absolute -right-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]"
      ></div>
      <div
        class="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-[120px]"
      ></div>
    </div>
    <main
      class="px-margin-mobile relative z-10 flex flex-grow items-center justify-center py-xl"
    >
      <div class="w-full max-w-md">
        <!-- Brand Identity -->
        <div class="mb-xl text-center">
          <h2
            class="font-display-md mb-sm text-display-md tracking-tight text-primary drop-shadow-[0_0_12px_rgba(208,188,255,0.4)]"
          >
            SHADOW LEVELING
          </h2>
          <div
            class="gap-base bg-surface-container-high inline-flex items-center rounded-full border border-outline-variant/30 px-md py-xs"
          >
            <span class="material-symbols-outlined text-[14px] text-secondary"
              >shield</span
            >
            <span
              class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant"
              >Iniciando Protocolo de Registro</span
            >
          </div>
        </div>
        <!-- Registration Card -->
        <div
          class="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg shadow-2xl backdrop-blur-sm"
        >
          <header class="mb-lg">
            <h1
              class="font-headline-lg-mobile text-headline-lg-mobile mb-xs text-on-surface"
            >
              Criar Conta
            </h1>
            <p class="font-body-md text-on-surface-variant opacity-70">
              Comece sua jornada para a excelência.
            </p>
          </header>
          <form class="space-y-lg">
            <!-- Email Field -->
            <div class="space-y-xs">
              <label
                class="font-label-md block text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                Email de Recrutamento
              </label>
              <div class="relative">
                <span
                  class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline"
                  >mail</span
                >
                <input
                  class="w-full rounded-lg border border-outline-variant/30 bg-background py-md pl-xl pr-md text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="nome@exemplo.com"
                  type="email"
                />
              </div>
            </div>
            <!-- Password Field -->
            <div class="space-y-xs">
              <label
                class="font-label-md block text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                Código de Acesso
              </label>
              <div class="relative">
                <span
                  class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline"
                  >lock</span
                >
                <input
                  class="w-full rounded-lg border border-outline-variant/30 bg-background py-md pl-xl pr-md text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              <!-- Strength Indicator -->
              <div class="pt-sm">
                <div class="mb-xs flex items-center justify-between">
                  <span
                    class="font-label-sm text-label-sm uppercase text-on-surface-variant"
                    >Nível de Segurança</span
                  >
                  <span
                    class="font-label-sm text-label-sm uppercase text-primary"
                    >Intermediário</span
                  >
                </div>
                <div class="flex gap-xs">
                  <div class="strength-segment active-purple"></div>
                  <div class="strength-segment active-purple"></div>
                  <div class="strength-segment"></div>
                  <div class="strength-segment"></div>
                </div>
              </div>
            </div>
            <!-- Confirm Password Field -->
            <div class="space-y-xs">
              <label
                class="font-label-md block text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                Confirmar Código
              </label>
              <div class="relative">
                <span
                  class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline"
                  >verified_user</span
                >
                <input
                  class="w-full rounded-lg border border-outline-variant/30 bg-background py-md pl-xl pr-md text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
            </div>
            <!-- Primary Action -->
            <div class="pt-md">
              <button
                class="font-title-md flex w-full items-center justify-center gap-sm rounded-lg bg-primary py-lg text-title-md text-on-primary shadow-[0_4px_15px_rgba(208,188,255,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
                type="submit"
              >
                Criar conta
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>
          <!-- Alternative Action -->
          <div
            class="mt-xl border-t border-outline-variant/10 pt-lg text-center"
          >
            <p class="font-body-md text-on-surface-variant">
              Já possui credenciais?
              <a
                class="font-title-md ml-xs text-secondary decoration-secondary/30 hover:underline"
                href="#"
                >Já tenho conta</a
              >
            </p>
          </div>
        </div>
        <!-- Decorative Footer -->
        <div
          class="mt-xl flex justify-center gap-xl opacity-40 contrast-125 grayscale"
        >
          <img
            alt="Energy"
            class="h-6 w-6"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb3h4Zx_yc5zhAmCyuRp6bPWOHB3xNc3zd3cpBTUpD1MxhBLBHwKATOu4srYJ9nfC2ZSBquuI8GR47TpysS9AnWTO0xJDaR7oi2cF62xMrvj0Xh_joj7tyM_V3gsRbTpwMLxPuGLtA3lDpaoet7QaDkF1By5m_3pK7m1O3YYnWqWOwDRQqHbR-w8r4BgeJ3Kcx_gx9hICeHAHxRveKhEWdxz_BpdOVKxUjWHVmw2Z9ctmAeLa11Fb7mG4tdF8hfg2nz5iJuy8fQdE"
          />
          <img
            alt="Def"
            class="h-6 w-6"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCM6hGTlIzruRy9-I4sH-z-BuTITIwQjXfXrdCcz7Uj8NRsJH9w7JJC2Y1E5-D54ODcHWdTyIWfVS7YrjQm7iGFGvfao-NAgiDIlTiNDR3xIBK6RAlgpPSEnU005eJ_w_CDjtHn_NQA2UhMw44QbJ8989r5c6JTudjCiZ1PdDuQJHcF1MpeX-d1WjhYUVJK1fM9cThJj5x4AKTUZY12UEylwcHwOCtGwYfVHMjuJ6eUfsX7vJWvtEoa98JcJ9c8bWG99q462MS5QEo"
          />
          <img
            alt="Atk"
            class="h-6 w-6"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxwBOLeqi_s5Hv0iEra7w4LRz_MGbySJaFPZyjlg_bvT8EtmIR1On955OFWudyxzKGMOSxieSNcafvJB99mWgCWJmQ3NDN51sJbhnCuLrMnhIAHK0184NGrBrSoawQzAbfB5TmnAfe-s3r_ND7al7_5RbM2J3Y1Wvre44-UcaB4Z1h356FOVmwuixWD72eV3mSsnIKD3ygcKbGecT5o7BF9pap3YrMvztRXlzqpuFMAhhrmjjvSWZGQRiew0CUmi1rzxv0uq2ch84"
          />
        </div>
      </div>
    </main>
    <!-- Background Decoration Image -->
    <div
      class="pointer-events-none fixed bottom-0 right-0 z-[-1] h-full w-full opacity-10 md:w-1/2"
    >
      <img
        class="h-full w-full object-cover object-center"
        data-alt="A moody, high-contrast dark gym interior with glowing purple LED strips outlining the modern equipment. The atmosphere is intense and elite, with a polished concrete floor reflecting the neon lights. The aesthetic is cyber-athletic, clean, and futuristic, perfectly matching a high-end RPG fitness application's dark mode visual language."
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoJD57nG-vkq5jKfDdKdxtoRBYMWK458SAAVFftRnKO9-XEDedUti3jtXiL__jgCJbSciJmCphxIM30bhFBh5Lbtyzbyt2YLzaTEe4fdGSSksuBOe5ImDXIA5sstxnBdh9N0cBp5HD5FiHyoQSnfB-3UinVRbLWxT3GFGhqblqru1tha7Yz1pr61KC6q9FzW92P9zNpmFx6WTxbWJvGrU-TRiKYW94AiEokWfclzx0y5BsSUShexVLBWjRnnPvX0WjSqmgoi9xGHw"
      />
    </div>
  </body>
</html>
```

---

### Home / Dashboard

```html
<!DOCTYPE html>

<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SHADOW LEVELING - Dashboard</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-surface": "#e5e2e3",
              "on-secondary": "#003640",
              "surface-container-high": "#2a2a2b",
              "on-error-container": "#ffdad6",
              "outline-variant": "#494454",
              "on-secondary-fixed-variant": "#004e5c",
              "on-tertiary-fixed-variant": "#673d00",
              "surface-tint": "#d0bcff",
              primary: "#d0bcff",
              "tertiary-container": "#ca801e",
              "on-primary": "#3c0091",
              "on-tertiary-container": "#3f2300",
              "surface-container-low": "#1c1b1c",
              background: "#131314",
              "on-surface-variant": "#cbc3d7",
              "tertiary-fixed": "#ffdcbb",
              outline: "#958ea0",
              surface: "#131314",
              "error-container": "#93000a",
              "inverse-surface": "#e5e2e3",
              tertiary: "#ffb869",
              "secondary-fixed-dim": "#4cd7f6",
              "inverse-on-surface": "#313031",
              "on-secondary-container": "#00424e",
              "secondary-fixed": "#acedff",
              "on-error": "#690005",
              "surface-container-lowest": "#0e0e0f",
              "surface-variant": "#353436",
              "on-tertiary-fixed": "#2c1700",
              "secondary-container": "#03b5d3",
              "on-tertiary": "#482900",
              "on-background": "#e5e2e3",
              "primary-fixed-dim": "#d0bcff",
              "on-primary-container": "#340080",
              "surface-container": "#201f20",
              "on-primary-fixed-variant": "#5516be",
              "surface-bright": "#3a393a",
              "surface-dim": "#131314",
              "primary-fixed": "#e9ddff",
              secondary: "#4cd7f6",
              "tertiary-fixed-dim": "#ffb869",
              "primary-container": "#a078ff",
              "inverse-primary": "#6d3bd7",
              "on-primary-fixed": "#23005c",
              error: "#ffb4ab",
              "on-secondary-fixed": "#001f26",
              "surface-container-highest": "#353436",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              xl: "40px",
              "margin-desktop": "32px",
              "margin-mobile": "16px",
              lg: "24px",
              gutter: "16px",
              sm: "8px",
              base: "4px",
              md: "16px",
              xs: "4px",
            },
            fontFamily: {
              "title-md": ["Inter"],
              "body-lg": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "display-md": ["Inter"],
              "label-sm": ["Inter"],
              "body-md": ["Inter"],
              "label-md": ["Inter"],
              "headline-lg": ["Inter"],
              "display-lg": ["Inter"],
            },
            fontSize: {
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
            },
          },
        },
      };
    </script>
    <style>
      body {
        font-family: "Inter", sans-serif;
      }
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }
      .inner-glow {
        box-shadow: inset 0 0 10px rgba(208, 188, 255, 0.1);
      }
      .ring-glow {
        filter: drop-shadow(0 0 8px rgba(208, 188, 255, 0.4));
      }
    </style>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body class="text-on-background min-h-screen bg-background pb-24">
    <!-- TopAppBar -->
    <header
      class="px-margin-mobile md:px-margin-desktop sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background text-primary dark:bg-background dark:text-primary"
    >
      <div class="flex items-center gap-3">
        <div
          class="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary transition-all duration-200 active:scale-95"
        >
          <img
            alt="User avatar"
            class="h-full w-full object-cover"
            data-alt="A professional close-up portrait of a determined young man with short hair, lit by dramatic cinematic side lighting in a dark gym environment. The color palette is dominated by deep blacks and cool purples, echoing a high-performance cyber-athletic aesthetic. The focus is sharp on his confident expression, conveying a sense of discipline and elite focus."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjSamdS0fesJ81-JFy6z0eJZowA-8mw6_d3QUvXBqPSlfzS_s2MfqVVBJgA24IzipPOM-OzTkmUvZgHGq0ZLXWC3GtJ06g4vR80ID_eVJDYKohrBxCWYV4cjhmhAbaPyDQe8QipEf2WPhMYucwXIRc9WbxIJC70J-3_hiZ6MpSPDKK4lLmNNETg1R9kQXVnRN0VBfFDJbW8b7Q8MNkg1ptpOTSrzA6h74B-xM3f8hxfsxEuhmr77Wq0WuPjXZp9OpnrmKF0kWPKpM"
          />
          <div
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-background bg-tertiary"
          ></div>
        </div>
        <div class="flex flex-col">
          <h1 class="font-title-md text-title-md leading-tight text-on-surface">
            Bom dia, Jonas!
          </h1>
          <span class="font-label-md text-label-md text-on-surface-variant"
            >Quinta, 15 de jan</span
          >
        </div>
      </div>
      <button
        class="material-symbols-outlined hover:bg-surface-container-high rounded-full p-2 text-primary transition-all duration-200 active:scale-95"
        data-icon="notifications"
      >
        notifications
      </button>
    </header>
    <main
      class="px-margin-mobile md:px-margin-desktop mx-auto max-w-4xl space-y-xl py-lg"
    >
      <!-- XP / Progress Section -->
      <section
        class="bg-surface-container-low inner-glow relative overflow-hidden rounded-xl border border-outline-variant p-lg"
      >
        <div class="absolute left-0 top-0 h-full w-1 bg-primary"></div>
        <div class="flex flex-col items-center gap-xl md:flex-row">
          <!-- Circular Progress -->
          <div class="relative flex h-48 w-48 items-center justify-center">
            <svg class="h-full w-full -rotate-90 transform">
              <circle
                class="text-surface-container-highest"
                cx="96"
                cy="96"
                fill="transparent"
                r="80"
                stroke="currentColor"
                stroke-width="12"
              ></circle>
              <circle
                class="ring-glow text-primary"
                cx="96"
                cy="96"
                fill="transparent"
                r="80"
                stroke="currentColor"
                stroke-dasharray="502.6"
                stroke-dashoffset="314.1"
                stroke-linecap="round"
                stroke-width="12"
              ></circle>
            </svg>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span
                class="font-display-md text-display-md uppercase italic text-primary"
                >3 / 8</span
              >
              <span
                class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant"
                >Missões</span
              >
            </div>
          </div>
          <div class="flex-1 space-y-md">
            <div>
              <h2
                class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile uppercase italic text-primary md:text-headline-lg"
              >
                Próximo Nível
              </h2>
              <p
                class="font-body-md mt-base text-body-md text-on-surface-variant"
              >
                Complete as missões de hoje para atingir o Nível 24.
              </p>
            </div>
            <div class="space-y-sm">
              <div class="font-label-md flex justify-between text-label-md">
                <span>RANK: ELITE</span>
                <span>1,240 / 1,500 XP</span>
              </div>
              <div
                class="bg-surface-container-highest h-3 w-full overflow-hidden rounded-full"
              >
                <div
                  class="h-full w-[82%] bg-secondary shadow-[0_0_10px_rgba(76,215,246,0.5)]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- Treinos do Dia -->
      <section class="space-y-md">
        <div class="flex items-end justify-between">
          <h3
            class="font-label-md text-label-md uppercase tracking-widest text-primary"
          >
            Treinos do Dia
          </h3>
          <a
            class="font-label-sm text-label-sm uppercase text-secondary hover:underline"
            href="#"
            >Ver Tudo</a
          >
        </div>
        <div class="grid grid-cols-1 gap-md md:grid-cols-2">
          <!-- Training Card 1 -->
          <div
            class="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container p-md transition-all duration-300 hover:border-secondary"
          >
            <div
              class="bg-surface-container-highest flex h-16 w-16 items-center justify-center rounded-lg"
            >
              <span
                class="material-symbols-outlined text-secondary"
                style="font-variation-settings: 'FILL' 1;"
                >fitness_center</span
              >
            </div>
            <div class="flex-1">
              <h4 class="font-title-md text-title-md text-on-surface">
                Full Body A
              </h4>
              <div class="mt-xs flex items-center gap-sm">
                <span
                  class="font-label-sm rounded bg-error-container/10 px-2 py-0.5 text-label-sm uppercase text-error"
                  >Pendente</span
                >
                <span class="text-label-md text-on-surface-variant"
                  >45 min</span
                >
              </div>
            </div>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant transition-colors hover:bg-secondary hover:text-on-secondary"
            >
              <span class="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
          <!-- Training Card 2 -->
          <div
            class="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container/50 p-md opacity-80"
          >
            <div
              class="bg-surface-container-highest flex h-16 w-16 items-center justify-center rounded-lg"
            >
              <span class="material-symbols-outlined text-on-surface-variant"
                >directions_run</span
              >
            </div>
            <div class="flex-1">
              <h4 class="font-title-md text-title-md text-on-surface">
                Cardio Leve
              </h4>
              <div class="mt-xs flex items-center gap-sm">
                <span
                  class="font-label-sm rounded bg-secondary-container/10 px-2 py-0.5 text-label-sm uppercase text-secondary"
                  >Concluído</span
                >
                <span class="text-label-md text-on-surface-variant"
                  >20 min</span
                >
              </div>
            </div>
            <span
              class="material-symbols-outlined text-secondary"
              style="font-variation-settings: 'FILL' 1;"
              >check_circle</span
            >
          </div>
        </div>
      </section>
      <!-- Missões Ativas -->
      <section class="space-y-md">
        <h3
          class="font-label-md text-label-md uppercase tracking-widest text-primary"
        >
          Missões Diárias
        </h3>
        <div class="space-y-sm">
          <!-- Mission 1 -->
          <div
            class="bg-surface-container-lowest group flex cursor-pointer items-center gap-md rounded-xl border border-outline-variant p-md transition-colors hover:bg-surface-container"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b5e20]/20"
            >
              <span
                class="material-symbols-outlined text-[#4caf50]"
                data-icon="swords"
                >swords</span
              >
            </div>
            <div class="flex-1">
              <span class="font-label-sm text-label-sm uppercase text-[#4caf50]"
                >Fácil</span
              >
              <h5 class="font-body-md text-body-md font-bold text-on-surface">
                Consumir 3L de Água
              </h5>
            </div>
            <span class="font-label-md text-label-md text-tertiary"
              >+50 XP</span
            >
          </div>
          <!-- Mission 2 -->
          <div
            class="bg-surface-container-lowest group flex cursor-pointer items-center gap-md rounded-xl border border-outline-variant p-md transition-colors hover:bg-surface-container"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbc02d]/20"
            >
              <span
                class="material-symbols-outlined text-[#fbc02d]"
                data-icon="shield"
                >shield</span
              >
            </div>
            <div class="flex-1">
              <span class="font-label-sm text-label-sm uppercase text-[#fbc02d]"
                >Médio</span
              >
              <h5 class="font-body-md text-body-md font-bold text-on-surface">
                15min de Meditação
              </h5>
            </div>
            <span class="font-label-md text-label-md text-tertiary"
              >+120 XP</span
            >
          </div>
          <!-- Mission 3 (Done) -->
          <div
            class="bg-surface-container-lowest group flex items-center gap-md rounded-xl border border-outline-variant p-md opacity-40"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#4caf50]/10"
            >
              <span
                class="material-symbols-outlined text-[#4caf50]"
                data-icon="swords"
                >swords</span
              >
            </div>
            <div class="flex-1">
              <span class="font-label-sm text-label-sm uppercase text-[#4caf50]"
                >Fácil</span
              >
              <h5
                class="font-body-md text-body-md font-bold text-on-surface line-through"
              >
                Check-in na Academia
              </h5>
            </div>
            <span class="material-symbols-outlined text-secondary"
              >done_all</span
            >
          </div>
        </div>
      </section>
    </main>
    <!-- BottomNavBar -->
    <nav
      class="pb-safe bg-surface-container-low fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container px-4 shadow-[0_-4px_10px_rgba(208,188,255,0.1)] dark:bg-surface-container"
    >
      <!-- Hoje (Active) -->
      <a
        class="flex flex-col items-center justify-center font-bold text-primary transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-primary"
        href="#"
      >
        <span
          class="material-symbols-outlined mb-1"
          style="font-variation-settings: 'FILL' 1;"
          >home</span
        >
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Hoje</span
        >
      </a>
      <!-- Missões -->
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary hover:opacity-100 active:scale-90 dark:text-on-surface-variant dark:hover:text-secondary"
        href="#"
      >
        <span class="material-symbols-outlined mb-1">swords</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Missões</span
        >
      </a>
      <!-- Treinos -->
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary hover:opacity-100 active:scale-90 dark:text-on-surface-variant dark:hover:text-secondary"
        href="#"
      >
        <span class="material-symbols-outlined mb-1">fitness_center</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Treinos</span
        >
      </a>
      <!-- Progresso -->
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary hover:opacity-100 active:scale-90 dark:text-on-surface-variant dark:hover:text-secondary"
        href="#"
      >
        <span class="material-symbols-outlined mb-1">monitoring</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Progresso</span
        >
      </a>
      <!-- Perfil -->
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary hover:opacity-100 active:scale-90 dark:text-on-surface-variant dark:hover:text-secondary"
        href="#"
      >
        <span class="material-symbols-outlined mb-1">person</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Perfil</span
        >
      </a>
    </nav>
    <!-- Contextual FAB -->
    <button
      class="right-margin-mobile fixed bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg transition-all duration-200 active:scale-95"
    >
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1;"
        >add</span
      >
    </button>
  </body>
</html>
```

---

### Tarefas

```html
<!-- COLE O HTML AQUI -->
```

---

### Criar Tarefa

```html
<!-- COLE O HTML AQUI -->
```

---

### Workouts (Lista)

```html
<!DOCTYPE html>
<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-surface": "#e5e2e3",
              "on-secondary": "#003640",
              "surface-container-high": "#2a2a2b",
              "on-error-container": "#ffdad6",
              "outline-variant": "#494454",
              "on-secondary-fixed-variant": "#004e5c",
              "on-tertiary-fixed-variant": "#673d00",
              "surface-tint": "#d0bcff",
              primary: "#d0bcff",
              "tertiary-container": "#ca801e",
              "on-primary": "#3c0091",
              "on-tertiary-container": "#3f2300",
              "surface-container-low": "#1c1b1c",
              background: "#131314",
              "on-surface-variant": "#cbc3d7",
              "tertiary-fixed": "#ffdcbb",
              outline: "#958ea0",
              surface: "#131314",
              "error-container": "#93000a",
              "inverse-surface": "#e5e2e3",
              tertiary: "#ffb869",
              "secondary-fixed-dim": "#4cd7f6",
              "inverse-on-surface": "#313031",
              "on-secondary-container": "#00424e",
              "secondary-fixed": "#acedff",
              "on-error": "#690005",
              "surface-container-lowest": "#0e0e0f",
              "surface-variant": "#353436",
              "on-tertiary-fixed": "#2c1700",
              "secondary-container": "#03b5d3",
              "on-tertiary": "#482900",
              "on-background": "#e5e2e3",
              "primary-fixed-dim": "#d0bcff",
              "on-primary-container": "#340080",
              "surface-container": "#201f20",
              "on-primary-fixed-variant": "#5516be",
              "surface-bright": "#3a393a",
              "surface-dim": "#131314",
              "primary-fixed": "#e9ddff",
              secondary: "#4cd7f6",
              "tertiary-fixed-dim": "#ffb869",
              "primary-container": "#a078ff",
              "inverse-primary": "#6d3bd7",
              "on-primary-fixed": "#23005c",
              error: "#ffb4ab",
              "on-secondary-fixed": "#001f26",
              "surface-container-highest": "#353436",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              xl: "40px",
              "margin-desktop": "32px",
              "margin-mobile": "16px",
              lg: "24px",
              gutter: "16px",
              sm: "8px",
              base: "4px",
              md: "16px",
              xs: "4px",
            },
            fontFamily: {
              "title-md": ["Inter"],
              "body-lg": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "display-md": ["Inter"],
              "label-sm": ["Inter"],
              "body-md": ["Inter"],
              "label-md": ["Inter"],
              "headline-lg": ["Inter"],
              "display-lg": ["Inter"],
            },
            fontSize: {
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
            },
          },
        },
      };
    </script>
    <style>
      body {
        font-family: "Inter", sans-serif;
      }
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }
      .glow-primary {
        box-shadow: 0 0 15px rgba(208, 188, 255, 0.2);
      }
    </style>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body class="text-on-background min-h-screen bg-background pb-24">
    <!-- TopAppBar -->
    <header
      class="px-margin-mobile md:px-margin-desktop sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background dark:bg-background"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-primary bg-primary-container"
        >
          <img
            alt="User avatar"
            class="h-full w-full object-cover"
            data-alt="A professional close-up portrait of a determined athlete in a dark gym environment. Soft neon purple backlighting highlights the contours of the face and shoulders, creating a high-performance cyber-athletic aesthetic. The lighting is moody and focused, with deep shadows and vibrant lavender accents that reflect the elite fitness brand identity."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDX7xAVt6_eBmWqTph2GPRom_rj-mBMnRrep7AcaqcaJZ67HhkEDlRJey9vKdERUCj-2a5T1HnyqIwTyJq0NeFUOCgVYu43ZYDxwO7zuW50iaCQnfoajKu_J1Koo0nrpydXNG4Fd-Hm8F4UtJUotBwgxbm65lE2GZ1ZsRQgUUZcGi2-8JZN5G-4-agfaRg2LTIbDu6eibDqovY7Df77CramaBpyQp8w2Ae9Nvwaj9nK4_i6kxTiWJlA4pEWnguPiN-y4oPBs_JSmjQ"
          />
        </div>
        <h1
          class="font-title-md text-title-md uppercase tracking-tight text-primary"
        >
          Meus Treinos
        </h1>
      </div>
      <button
        class="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-on-primary active:scale-95"
      >
        <span class="material-symbols-outlined">add</span>
      </button>
    </header>
    <!-- Main Content Canvas -->
    <main class="px-margin-mobile md:px-margin-desktop mx-auto max-w-5xl py-lg">
      <!-- Search & Filter Row -->
      <div class="mb-lg flex gap-md">
        <div
          class="bg-surface-container-lowest flex flex-1 items-center gap-sm rounded-xl border border-outline-variant px-md py-sm"
        >
          <span class="material-symbols-outlined text-on-surface-variant"
            >search</span
          >
          <input
            class="w-full border-none bg-transparent text-body-md placeholder:text-on-surface-variant focus:ring-0"
            placeholder="Buscar treino..."
            type="text"
          />
        </div>
        <button
          class="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container px-md text-primary"
        >
          <span class="material-symbols-outlined">tune</span>
        </button>
      </div>
      <!-- Section: Treinos Hoje -->
      <section class="mb-xl">
        <div class="mb-md flex items-center justify-between">
          <h2
            class="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary"
          >
            Programado para Hoje
          </h2>
          <span class="h-2 w-2 animate-pulse rounded-full bg-secondary"></span>
        </div>
        <!-- Active Workout Card -->
        <div
          class="overflow-hidden rounded-xl border-l-4 border-secondary bg-surface-container shadow-xl transition-all duration-300 hover:translate-x-1"
        >
          <div class="flex flex-col items-start gap-lg p-md">
            <div class="flex-1">
              <div class="mb-base flex items-start justify-between">
                <h3
                  class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg"
                >
                  Hipertrofia A
                </h3>
                <span
                  class="font-label-sm text-label-sm uppercase tracking-widest text-secondary"
                  >Ativo</span
                >
              </div>
              <p
                class="font-label-md mb-md text-label-md text-on-surface-variant"
              >
                Peito, Tríceps e Ombro
              </p>
              <div class="mb-lg flex gap-xl">
                <div class="flex items-center gap-xs">
                  <span
                    class="material-symbols-outlined text-[18px] text-outline"
                    >fitness_center</span
                  >
                  <span class="font-label-sm text-label-sm text-on-surface"
                    >8 Exercícios</span
                  >
                </div>
                <div class="flex items-center gap-xs">
                  <span
                    class="material-symbols-outlined text-[18px] text-outline"
                    >schedule</span
                  >
                  <span class="font-label-sm text-label-sm text-on-surface"
                    >65 min</span
                  >
                </div>
              </div>
            </div>

            <button
              class="font-label-md flex w-full items-center justify-center gap-sm rounded-xl bg-secondary px-xl py-md text-label-md text-on-secondary shadow-[0_0_20px_rgba(76,215,246,0.3)] transition-all duration-200 active:scale-95 md:w-auto"
            >
              <span
                class="material-symbols-outlined"
                style="font-variation-settings: 'FILL' 1;"
                >play_arrow</span
              >INICIAR
            </button>
          </div>
        </div>
      </section>
      <!-- Section: Todos os Treinos -->
      <section>
        <h2
          class="font-label-md mb-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant"
        >
          Sua Biblioteca
        </h2>
        <!-- Bento Grid for Workouts -->
        <div class="grid grid-cols-1 gap-md md:grid-cols-2">
          <!-- Card Treino B -->
          <div
            class="hover:bg-surface-container-high group rounded-xl border border-outline-variant bg-surface-container p-md transition-all duration-300"
          >
            <div class="mb-md flex items-start justify-between">
              <div>
                <h3
                  class="font-title-md text-title-md text-on-surface transition-colors group-hover:text-primary"
                >
                  Hipertrofia B
                </h3>
                <div class="mt-base flex gap-xs">
                  <span
                    class="font-label-sm text-label-sm text-on-surface-variant"
                    >Ter, Qui, Sáb</span
                  >
                </div>
              </div>
              <button
                class="text-on-surface-variant transition-colors hover:text-primary"
              >
                <span class="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div
              class="bg-surface-container-lowest mb-md flex items-center justify-between rounded-lg p-md"
            >
              <div class="flex flex-col">
                <span class="font-label-sm text-label-sm uppercase text-outline"
                  >Exercícios</span
                >
                <span class="font-title-md text-title-md">10</span>
              </div>
              <div class="flex flex-col text-right">
                <span class="font-label-sm text-label-sm uppercase text-outline"
                  >Frequência</span
                >
                <span class="font-title-md text-title-md">3x / sem</span>
              </div>
            </div>
            <div class="flex gap-sm">
              <span
                class="bg-surface-variant font-label-sm rounded px-2 py-1 text-label-sm text-on-surface-variant"
                >Costas</span
              >
              <span
                class="bg-surface-variant font-label-sm rounded px-2 py-1 text-label-sm text-on-surface-variant"
                >Bíceps</span
              >
              <span
                class="bg-surface-variant font-label-sm rounded px-2 py-1 text-label-sm text-on-surface-variant"
                >Abdômen</span
              >
            </div>
          </div>
          <!-- Card Treino C -->
          <div
            class="hover:bg-surface-container-high group rounded-xl border border-outline-variant bg-surface-container p-md transition-all duration-300"
          >
            <div class="mb-md flex items-start justify-between">
              <div>
                <h3
                  class="font-title-md text-title-md text-on-surface transition-colors group-hover:text-primary"
                >
                  Lower Body Alpha
                </h3>
                <div class="mt-base flex gap-xs">
                  <span
                    class="font-label-sm text-label-sm text-on-surface-variant"
                    >Seg, Sex</span
                  >
                </div>
              </div>
              <button
                class="text-on-surface-variant transition-colors hover:text-primary"
              >
                <span class="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div
              class="bg-surface-container-lowest mb-md flex items-center justify-between rounded-lg p-md"
            >
              <div class="flex flex-col">
                <span class="font-label-sm text-label-sm uppercase text-outline"
                  >Exercícios</span
                >
                <span class="font-title-md text-title-md">7</span>
              </div>
              <div class="flex flex-col text-right">
                <span class="font-label-sm text-label-sm uppercase text-outline"
                  >Frequência</span
                >
                <span class="font-title-md text-title-md">2x / sem</span>
              </div>
            </div>
            <div class="flex gap-sm">
              <span
                class="bg-surface-variant font-label-sm rounded px-2 py-1 text-label-sm text-on-surface-variant"
                >Quadríceps</span
              >
              <span
                class="bg-surface-variant font-label-sm rounded px-2 py-1 text-label-sm text-on-surface-variant"
                >Posterior</span
              >
            </div>
          </div>
          <!-- Empty/New Slot Card -->
          <div
            class="group flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-md transition-colors hover:border-primary"
          >
            <span
              class="material-symbols-outlined mb-sm text-4xl text-outline group-hover:text-primary"
              >add_circle</span
            >
            <span
              class="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface"
              >Novo Modelo de Treino</span
            >
          </div>
        </div>
      </section>
    </main>
    <!-- BottomNavBar -->
    <nav
      class="bg-surface-container-low pb-safe fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container px-4 shadow-[0_-4px_10px_rgba(208,188,255,0.1)]"
    >
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">home</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Hoje</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">swords</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Missões</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center font-bold text-primary transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-primary"
        href="#"
      >
        <span
          class="material-symbols-outlined"
          style='font-variation-settings: "FILL" 1;'
          >fitness_center</span
        >
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Treinos</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">monitoring</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Progresso</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:text-secondary active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">person</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Perfil</span
        >
      </a>
    </nav>
  </body>
</html>
```

---

### Detalhe do Workout

<!DOCTYPE html>

<html class="dark" lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Pull Day - Detalhe do Treino</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-surface": "#e5e2e3",
                    "on-secondary": "#003640",
                    "surface-container-high": "#2a2a2b",
                    "on-error-container": "#ffdad6",
                    "outline-variant": "#494454",
                    "on-secondary-fixed-variant": "#004e5c",
                    "on-tertiary-fixed-variant": "#673d00",
                    "surface-tint": "#d0bcff",
                    "primary": "#d0bcff",
                    "tertiary-container": "#ca801e",
                    "on-primary": "#3c0091",
                    "on-tertiary-container": "#3f2300",
                    "surface-container-low": "#1c1b1c",
                    "background": "#131314",
                    "on-surface-variant": "#cbc3d7",
                    "tertiary-fixed": "#ffdcbb",
                    "outline": "#958ea0",
                    "surface": "#131314",
                    "error-container": "#93000a",
                    "inverse-surface": "#e5e2e3",
                    "tertiary": "#ffb869",
                    "secondary-fixed-dim": "#4cd7f6",
                    "inverse-on-surface": "#313031",
                    "on-secondary-container": "#00424e",
                    "secondary-fixed": "#acedff",
                    "on-error": "#690005",
                    "surface-container-lowest": "#0e0e0f",
                    "surface-variant": "#353436",
                    "on-tertiary-fixed": "#2c1700",
                    "secondary-container": "#03b5d3",
                    "on-tertiary": "#482900",
                    "on-background": "#e5e2e3",
                    "primary-fixed-dim": "#d0bcff",
                    "on-primary-container": "#340080",
                    "surface-container": "#201f20",
                    "on-primary-fixed-variant": "#5516be",
                    "surface-bright": "#3a393a",
                    "surface-dim": "#131314",
                    "primary-fixed": "#e9ddff",
                    "secondary": "#4cd7f6",
                    "tertiary-fixed-dim": "#ffb869",
                    "primary-container": "#a078ff",
                    "inverse-primary": "#6d3bd7",
                    "on-primary-fixed": "#23005c",
                    "error": "#ffb4ab",
                    "on-secondary-fixed": "#001f26",
                    "surface-container-highest": "#353436"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "xl": "40px",
                    "margin-desktop": "32px",
                    "margin-mobile": "16px",
                    "lg": "24px",
                    "gutter": "16px",
                    "sm": "8px",
                    "base": "4px",
                    "md": "16px",
                    "xs": "4px"
            },
            "fontFamily": {
                    "title-md": ["Inter"],
                    "body-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "display-md": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-lg": ["Inter"],
                    "display-lg": ["Inter"]
            },
            "fontSize": {
                    "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "display-md": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.03em", "fontWeight": "800"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.08em", "fontWeight": "700"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "headline-lg": ["28px", {"lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.04em", "fontWeight": "800"}]
            }
          },
        },
      }
    </script>
<style>
        body { background-color: #131314; color: #e5e2e3; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-header { backdrop-filter: blur(12px); background-color: rgba(19, 19, 20, 0.8); }
        .card-inner-glow { box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05); }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="pb-24">
<!-- TopAppBar -->
<header class="fixed top-0 left-0 w-full z-50 glass-header border-b border-outline-variant flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 transition-all">
<div class="flex items-center gap-4">
<button class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-transform active:scale-95">
<span class="material-symbols-outlined text-on-surface">arrow_back</span>
</button>
<h1 class="font-title-md text-title-md text-primary italic uppercase tracking-tighter">Pull Day</h1>
</div>
<button class="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md uppercase tracking-wider shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all active:scale-95">
            Iniciar Treino
        </button>
</header>
<main class="mt-20 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
<!-- Hero Section/Stats -->
<section class="mb-lg grid grid-cols-2 md:grid-cols-4 gap-gutter">
<div class="bg-surface-container p-md rounded-xl border border-outline-variant card-inner-glow">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Duração Est.</p>
<p class="font-title-md text-title-md text-secondary">65 min</p>
</div>
<div class="bg-surface-container p-md rounded-xl border border-outline-variant card-inner-glow">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Volume</p>
<p class="font-title-md text-title-md text-primary">24 Séries</p>
</div>
<div class="bg-surface-container p-md rounded-xl border border-outline-variant card-inner-glow">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Intensidade</p>
<p class="font-title-md text-title-md text-tertiary">Alta</p>
</div>
<div class="bg-surface-container p-md rounded-xl border border-outline-variant card-inner-glow">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">XP Estimado</p>
<p class="font-title-md text-title-md text-on-surface">450 XP</p>
</div>
</section>
<!-- Exercises List -->
<div class="space-y-gutter">
<!-- Exercise Card 1 -->
<div class="flex items-stretch bg-surface-container rounded-xl border border-outline-variant overflow-hidden group transition-all hover:border-primary/50 card-inner-glow">
<div class="w-12 flex flex-col items-center justify-center bg-surface-container-lowest border-r border-outline-variant">
<span class="font-display-md text-display-md text-outline-variant/30 italic">01</span>
</div>
<div class="flex-grow p-md">
<div class="flex justify-between items-start mb-base">
<h3 class="font-title-md text-title-md text-on-surface uppercase tracking-tight">Barra Fixa</h3>
<span class="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-tertiary/20">Força</span>
</div>
<div class="flex items-center gap-4 mb-sm">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">rebase_edit</span>
<span class="font-label-md text-label-md text-on-surface">4 x 10</span>
</div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">timer</span>
<span class="font-label-md text-label-md text-on-surface">90s</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-3">Focar na amplitude total e retração escapular.</p>
</div>
<div class="w-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-outline">drag_indicator</span>
</div>
</div>
<!-- Exercise Card 2 -->
<div class="flex items-stretch bg-surface-container rounded-xl border border-outline-variant overflow-hidden group transition-all hover:border-primary/50 card-inner-glow">
<div class="w-12 flex flex-col items-center justify-center bg-surface-container-lowest border-r border-outline-variant">
<span class="font-display-md text-display-md text-outline-variant/30 italic">02</span>
</div>
<div class="flex-grow p-md">
<div class="flex justify-between items-start mb-base">
<h3 class="font-title-md text-title-md text-on-surface uppercase tracking-tight">Remada Curvada</h3>
<span class="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-secondary/20">Hipertrofia</span>
</div>
<div class="flex items-center gap-4 mb-sm">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">rebase_edit</span>
<span class="font-label-md text-label-md text-on-surface">3 x 12</span>
</div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">timer</span>
<span class="font-label-md text-label-md text-on-surface">60s</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-3">Manter a coluna neutra e puxar o peso em direção ao umbigo.</p>
</div>
<div class="w-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-outline">drag_indicator</span>
</div>
</div>
<!-- Exercise Card 3 -->
<div class="flex items-stretch bg-surface-container rounded-xl border border-outline-variant overflow-hidden group transition-all hover:border-primary/50 card-inner-glow">
<div class="w-12 flex flex-col items-center justify-center bg-surface-container-lowest border-r border-outline-variant">
<span class="font-display-md text-display-md text-outline-variant/30 italic">03</span>
</div>
<div class="flex-grow p-md">
<div class="flex justify-between items-start mb-base">
<h3 class="font-title-md text-title-md text-on-surface uppercase tracking-tight">Puxada Alta (Pulldown)</h3>
<span class="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-secondary/20">Hipertrofia</span>
</div>
<div class="flex items-center gap-4 mb-sm">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">rebase_edit</span>
<span class="font-label-md text-label-md text-on-surface">3 x 15</span>
</div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">timer</span>
<span class="font-label-md text-label-md text-on-surface">45s</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-3">Cadência controlada na fase excêntrica (3 segundos).</p>
</div>
<div class="w-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-outline">drag_indicator</span>
</div>
</div>
<!-- Exercise Card 4 -->
<div class="flex items-stretch bg-surface-container rounded-xl border border-outline-variant overflow-hidden group transition-all hover:border-primary/50 card-inner-glow">
<div class="w-12 flex flex-col items-center justify-center bg-surface-container-lowest border-r border-outline-variant">
<span class="font-display-md text-display-md text-outline-variant/30 italic">04</span>
</div>
<div class="flex-grow p-md">
<div class="flex justify-between items-start mb-base">
<h3 class="font-title-md text-title-md text-on-surface uppercase tracking-tight">Rosca Direta (Barra W)</h3>
<span class="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">Isolado</span>
</div>
<div class="flex items-center gap-4 mb-sm">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">rebase_edit</span>
<span class="font-label-md text-label-md text-on-surface">4 x 10</span>
</div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-primary text-sm">timer</span>
<span class="font-label-md text-label-md text-on-surface">60s</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-3">Não balançar o corpo. Cotovelos travados ao lado das costelas.</p>
</div>
<div class="w-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-outline">drag_indicator</span>
</div>
</div>
</div>
<!-- Add Exercise Placeholder -->
<button class="w-full mt-lg border-2 border-dashed border-outline-variant p-lg rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-all active:scale-[0.99]">
<span class="material-symbols-outlined text-3xl">add_circle</span>
<span class="font-label-md text-label-md uppercase tracking-widest">Adicionar Exercício</span>
</button>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe bg-surface-container border-t border-outline-variant bg-surface-container-low shadow-[0_-4px_10px_rgba(208,188,255,0.1)] rounded-t-xl">
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90">
<span class="material-symbols-outlined">home</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest">Hoje</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90">
<span class="material-symbols-outlined">swords</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest">Missões</span>
</button>
<button class="flex flex-col items-center justify-center text-primary dark:text-primary font-bold transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">fitness_center</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest">Treinos</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90">
<span class="material-symbols-outlined">monitoring</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest">Progresso</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90">
<span class="material-symbols-outlined">person</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest">Perfil</span>
</button>
</nav>
</body></html>
---

### Sessão de Treino (Execução)

```html
<!DOCTYPE html>

<html class="dark" lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <style>
      .material-symbols-outlined {
        font-variation-settings:
          "FILL" 0,
          "wght" 400,
          "GRAD" 0,
          "opsz" 24;
      }
      /* Custom scrollbar for a cleaner UI */
      ::-webkit-scrollbar {
        width: 4px;
      }
      ::-webkit-scrollbar-track {
        background: #131314;
      }
      ::-webkit-scrollbar-thumb {
        background: #494454;
        border-radius: 10px;
      }
    </style>
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-variant": "#353436",
              "on-tertiary": "#482900",
              "on-tertiary-container": "#3f2300",
              "primary-container": "#a078ff",
              "on-background": "#e5e2e3",
              "error-container": "#93000a",
              tertiary: "#ffb869",
              "inverse-on-surface": "#313031",
              "on-error-container": "#ffdad6",
              "surface-bright": "#3a393a",
              "on-tertiary-fixed-variant": "#673d00",
              primary: "#d0bcff",
              background: "#131314",
              "surface-tint": "#d0bcff",
              "on-tertiary-fixed": "#2c1700",
              "surface-container-lowest": "#0e0e0f",
              "on-secondary-fixed-variant": "#004e5c",
              "on-primary-container": "#340080",
              outline: "#958ea0",
              "on-secondary": "#003640",
              "on-surface": "#e5e2e3",
              "primary-fixed": "#e9ddff",
              "on-primary-fixed-variant": "#5516be",
              "on-error": "#690005",
              "on-surface-variant": "#cbc3d7",
              "tertiary-fixed": "#ffdcbb",
              error: "#ffb4ab",
              "surface-container": "#201f20",
              "surface-container-high": "#2a2a2b",
              "on-secondary-fixed": "#001f26",
              "surface-dim": "#131314",
              secondary: "#4cd7f6",
              "secondary-fixed": "#acedff",
              "outline-variant": "#494454",
              "on-primary-fixed": "#23005c",
              surface: "#131314",
              "secondary-container": "#03b5d3",
              "secondary-fixed-dim": "#4cd7f6",
              "surface-container-low": "#1c1b1c",
              "on-primary": "#3c0091",
              "on-secondary-container": "#00424e",
              "inverse-primary": "#6d3bd7",
              "surface-container-highest": "#353436",
              "tertiary-fixed-dim": "#ffb869",
              "tertiary-container": "#ca801e",
              "primary-fixed-dim": "#d0bcff",
              "inverse-surface": "#e5e2e3",
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px",
            },
            spacing: {
              md: "16px",
              base: "4px",
              lg: "24px",
              xl: "40px",
              sm: "8px",
              "margin-mobile": "16px",
              xs: "4px",
              gutter: "16px",
              "margin-desktop": "32px",
            },
            fontFamily: {
              "body-lg": ["Inter"],
              "label-md": ["Inter"],
              "display-lg": ["Inter"],
              "headline-lg": ["Inter"],
              "label-sm": ["Inter"],
              "body-md": ["Inter"],
              "title-md": ["Inter"],
              "display-md": ["Inter"],
              "headline-lg-mobile": ["Inter"],
            },
            fontSize: {
              "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
              "label-md": [
                "14px",
                {
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: "600",
                },
              ],
              "display-lg": [
                "48px",
                {
                  lineHeight: "56px",
                  letterSpacing: "-0.04em",
                  fontWeight: "800",
                },
              ],
              "headline-lg": [
                "28px",
                {
                  lineHeight: "36px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
              "label-sm": [
                "12px",
                {
                  lineHeight: "16px",
                  letterSpacing: "0.08em",
                  fontWeight: "700",
                },
              ],
              "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
              "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
              "display-md": [
                "36px",
                {
                  lineHeight: "44px",
                  letterSpacing: "-0.03em",
                  fontWeight: "800",
                },
              ],
              "headline-lg-mobile": [
                "24px",
                {
                  lineHeight: "32px",
                  letterSpacing: "-0.02em",
                  fontWeight: "700",
                },
              ],
            },
          },
        },
      };
    </script>
    <style>
      body {
        min-height: max(884px, 100dvh);
      }
    </style>
  </head>
  <body
    class="text-on-background font-body-md flex min-h-screen flex-col bg-background"
  >
    <!-- TopAppBar -->
    <header
      class="docked full-width px-margin-mobile md:px-margin-desktop top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background dark:bg-background"
    >
      <div class="flex items-center gap-3">
        <div
          class="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary"
        >
          <img
            alt="User avatar"
            class="h-full w-full object-cover"
            data-alt="A high-contrast profile portrait of a focused athlete in a dark gym environment, illuminated by sharp purple rim lighting. The style is sleek and professional, mirroring the cyber-athletic brand identity with a deep black background and electric purple highlights. The athlete has a disciplined expression, embodying personal growth and peak performance."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpvtutERtg6v5Gf0F8YUbX6GH6qpm1yLLDuepUnqHaFFdj6TLgbToaVxUVMMuTjaOT-CWL-5aCy9uJxNIBpaEOyaxAi6qrHZv-tUfdrD4tAac-W2ohqdCBODs81BZADRtr8qR4kQA-XloD3FO_gX8IjPdbEjCl1hOSoDqbQt0LLeG6SAbeuiJjxbbi1-tNFfzkpMw7k5jTgnzFwk-PjdDpj-K1nbnxx6ShZxq2KWSUqgeG3MJYkGRYdoutB2-xzlw8200eKe4xV-Y"
          />
          <div
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-secondary"
          ></div>
        </div>
        <div class="flex flex-col">
          <h1
            class="font-title-md text-title-md uppercase italic tracking-tighter text-primary"
          >
            PULL DAY
          </h1>
          <div class="flex items-center gap-1 opacity-80">
            <span class="material-symbols-outlined text-[14px]">timer</span>
            <span class="font-label-sm text-label-sm">12:45</span>
          </div>
        </div>
      </div>
      <button
        class="font-label-md rounded-lg bg-error-container px-4 py-1.5 text-label-md text-on-error-container transition-all duration-200 active:scale-95"
      >
        Encerrar
      </button>
    </header>
    <main class="px-margin-mobile flex-1 py-6 pb-32">
      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="mb-2 flex items-end justify-between">
          <span
            class="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant"
            >Exercício 2 de 6</span
          >
          <span class="font-label-sm text-label-sm text-primary"
            >33% Concluído</span
          >
        </div>
        <div
          class="bg-surface-container-high h-2 w-full overflow-hidden rounded-full"
        >
          <div
            class="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(208,188,255,0.4)]"
          ></div>
        </div>
      </div>
      <!-- Active Exercise Card -->
      <section
        class="bg-surface-container-low mb-6 overflow-hidden rounded-xl border border-outline-variant"
      >
        <div class="relative h-48 w-full">
          <img
            alt="Remada Curvada"
            class="h-full w-full object-cover opacity-60"
            data-alt="A cinematic, low-angle shot of a gym athlete performing a barbell row with perfect form. The lighting is dramatic and dark-mode oriented, with vibrant cyan and electric purple light streaks cutting through the smoky gym atmosphere. The focus is on the muscular tension and the metallic texture of the weight plates, maintaining a high-performance cyber-athletic aesthetic."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP6gVTaJrwhOR_KZFWbPTnAbArpvwWQz4rKEn-0uhwW_0Z6uUDUgomlQ7rHRwZo2-2UhgBKomUGdkf8MudVYA1CwntW5O9e0gkDlhSQW3-VGfshSRcucZhR8nP3HY1htizL5QU1rJwVvYMx5fEiSeIfMqem8JmzoKYzw46dxfBIfp26-z6vlRUYQF-Kkz8V5QqXWUkeMpPxE3q5eC0y-NQdl85Pq7ymr-T2lCv5PclYyP3Iu9IN7V9vBBSwV_EYnqCMDOVA4x0i7E"
          />
          <div
            class="from-surface-container-low absolute inset-0 bg-gradient-to-t to-transparent"
          ></div>
          <div class="absolute bottom-4 left-4">
            <h2
              class="font-display-md text-display-md uppercase tracking-tighter text-on-surface"
            >
              REMADA CURVADA
            </h2>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="font-label-sm rounded bg-primary/20 px-2 py-0.5 text-label-sm text-primary"
                >COSTA</span
              >
              <span class="font-label-md text-label-md text-on-surface-variant"
                >3 séries × 12 reps</span
              >
            </div>
          </div>
        </div>
        <div class="space-y-4 p-4">
          <!-- Sets Header -->
          <div
            class="font-label-sm grid grid-cols-12 gap-2 px-2 text-label-sm uppercase tracking-widest text-on-surface-variant"
          >
            <div class="col-span-2 text-center">Série</div>
            <div class="col-span-4 text-center">Peso (kg)</div>
            <div class="col-span-4 text-center">Reps</div>
            <div class="col-span-2 text-center">Check</div>
          </div>
          <!-- Set 1 (Completed) -->
          <div
            class="bg-surface-container-high/30 grid grid-cols-12 items-center gap-2 rounded-lg border border-transparent p-2"
          >
            <div
              class="font-label-md col-span-2 text-center text-label-md text-on-surface-variant"
            >
              1
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-outline-variant bg-background p-2 text-center text-on-surface-variant opacity-50"
                disabled=""
                type="text"
                value="60"
              />
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-outline-variant bg-background p-2 text-center text-on-surface-variant opacity-50"
                disabled=""
                type="text"
                value="12"
              />
            </div>
            <div class="col-span-2 flex justify-center">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full border border-secondary bg-secondary/20 text-secondary"
              >
                <span class="material-symbols-outlined text-[20px]">check</span>
              </div>
            </div>
          </div>
          <!-- Set 2 (Active Focus) -->
          <div
            class="bg-surface-container-high grid scale-[1.02] grid-cols-12 items-center gap-2 rounded-lg border border-primary p-2 shadow-[0_0_15px_rgba(208,188,255,0.1)] transition-transform"
          >
            <div
              class="font-label-md col-span-2 text-center text-label-md text-primary"
            >
              2
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-primary bg-background p-2 text-center text-primary outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="60"
                type="number"
              />
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-primary bg-background p-2 text-center text-primary outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="12"
                type="number"
              />
            </div>
            <div class="col-span-2 flex justify-center">
              <button
                class="bg-surface-container-lowest flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                <span class="material-symbols-outlined text-[20px]"
                  >radio_button_unchecked</span
                >
              </button>
            </div>
          </div>
          <!-- Set 3 -->
          <div
            class="bg-surface-container-high/30 grid grid-cols-12 items-center gap-2 rounded-lg border border-transparent p-2"
          >
            <div
              class="font-label-md col-span-2 text-center text-label-md text-on-surface-variant"
            >
              3
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-outline-variant bg-background p-2 text-center text-on-surface-variant"
                placeholder="--"
                type="number"
              />
            </div>
            <div class="col-span-4">
              <input
                class="font-title-md w-full rounded border border-outline-variant bg-background p-2 text-center text-on-surface-variant"
                placeholder="--"
                type="number"
              />
            </div>
            <div class="col-span-2 flex justify-center">
              <button
                class="bg-surface-container-lowest flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant"
              >
                <span class="material-symbols-outlined text-[20px]"
                  >radio_button_unchecked</span
                >
              </button>
            </div>
          </div>
        </div>
      </section>
      <!-- Exercise Navigation -->
      <div class="mt-8 flex items-center justify-between gap-4">
        <button
          class="font-label-md hover:bg-surface-container-high flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 text-label-md text-on-surface transition-all active:scale-95"
        >
          <span class="material-symbols-outlined">chevron_left</span> Anterior
        </button>
        <button
          class="font-label-md flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-label-md text-on-primary shadow-[0_4px_10px_rgba(208,188,255,0.3)] transition-all active:scale-95"
        >
          Próximo <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </main>
    <!-- Floating Rest Timer Overlay -->
    <div
      class="bg-surface-container-high fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-secondary/50 px-6 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      <div class="relative flex items-center justify-center">
        <svg class="h-10 w-10 rotate-[-90deg]">
          <circle
            cx="20"
            cy="20"
            fill="transparent"
            r="18"
            stroke="#353436"
            stroke-width="3"
          ></circle>
          <circle
            cx="20"
            cy="20"
            fill="transparent"
            r="18"
            stroke="#4cd7f6"
            stroke-dasharray="113"
            stroke-dashoffset="30"
            stroke-width="3"
          ></circle>
        </svg>
        <span
          class="material-symbols-outlined absolute text-[18px] text-secondary"
          >coffee</span
        >
      </div>
      <div class="flex flex-col">
        <span
          class="font-label-sm text-label-sm uppercase text-on-surface-variant"
          >Descanso</span
        >
        <span class="font-title-md text-title-md leading-none text-secondary"
          >00:45</span
        >
      </div>
      <button
        class="bg-surface-container-lowest flex h-8 w-8 items-center justify-center rounded-full border border-secondary/20 text-secondary hover:bg-secondary/10"
      >
        <span class="material-symbols-outlined text-[18px]">add</span>
      </button>
    </div>
    <!-- BottomNavBar -->
    <nav
      class="pb-safe bg-surface-container-low fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container px-4 shadow-[0_-4px_10px_rgba(208,188,255,0.1)] dark:bg-surface-container"
    >
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">home</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Hoje</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">swords</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Missões</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center font-bold text-primary transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-primary"
        href="#"
      >
        <span
          class="material-symbols-outlined"
          style="font-variation-settings: 'FILL' 1;"
          >fitness_center</span
        >
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Treinos</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">monitoring</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Progresso</span
        >
      </a>
      <a
        class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 transition-all duration-300 ease-in-out hover:-translate-y-1 active:scale-90 dark:text-on-surface-variant"
        href="#"
      >
        <span class="material-symbols-outlined">person</span>
        <span class="font-label-sm text-label-sm uppercase tracking-widest"
          >Perfil</span
        >
      </a>
    </nav>
  </body>
</html>
```

---

### Histórico

```html
<!-- COLE O HTML AQUI -->
```

---

### Perfil

```html
<!-- COLE O HTML AQUI -->
```

---

## Ordem de Implementação Sugerida

1. **Infraestrutura** — Expo Router, Axios + interceptors, SecureStore, Zustand, design tokens no tailwind.config
2. **Autenticação** — Login → Verify → Registro → Verify → Splash redirect
3. **Home** — Dashboard com métricas do dia
4. **Tarefas** — Calendário, lista do dia, criar tarefa, concluir tarefa
5. **Workouts** — Lista, detalhe, adicionar exercício, reordenar
6. **Sessão de Treino** — Fluxo completo de execução e registro de sets
7. **Histórico** — Sessões passadas e treinos perdidos
8. **Perfil** — Info do usuário, sessões ativas, logout
9. **Polish** — Animações (Reanimated/Moti), skeleton loaders, empty states, glow effects
