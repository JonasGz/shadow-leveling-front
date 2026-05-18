# Shadow Leveling — Frontend

App mobile de **tracker de treinos gamificado**, inspirado na estética sombria
e de alta performance de Solo Leveling. O usuário cadastra treinos, executa
sessões registrando suas séries, acompanha o histórico e gerencia missões
diárias — tudo com uma identidade visual "Cyber-Athletic" (dark mode de alto
contraste, roxo elétrico e ciano).

Este repositório contém **apenas o frontend** (React Native + Expo). O backend
(Go + PostgreSQL + Redis) é um projeto separado que expõe a API REST consumida
aqui.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 + React Native 0.81 |
| Linguagem | TypeScript (strict) |
| Navegação | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Estilização | [NativeWind v4](https://www.nativewind.dev/) (TailwindCSS) |
| Estado global | [Zustand](https://github.com/pmndrs/zustand) |
| HTTP | [Axios](https://axios-http.com/) com interceptors de Bearer Token |
| Formulários | React Hook Form + [Zod](https://zod.dev/) |
| Storage seguro | `expo-secure-store` (token de sessão) |
| Animação/Visual | `expo-linear-gradient`, `react-native-reanimated` |

---

## Pré-requisitos

- **Node.js** 18+ e npm
- **Expo Go** instalado no dispositivo/simulador, ou um simulador iOS / emulador Android
- O **backend** rodando e acessível (por padrão em `http://localhost:8080`)

---

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie o template e ajuste a URL da API:

```bash
cp .env.example .env
```

```env
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

> O arquivo `.env` **não é versionado** (está no `.gitignore`). Apenas o
> `.env.example` vai para o repositório, como referência.

**Atenção ao host conforme onde você roda:**

| Ambiente | URL da API |
|---|---|
| Simulador iOS | `http://localhost:8080` |
| Emulador Android | `http://10.0.2.2:8080` |
| Dispositivo físico | `http://<IP-da-sua-máquina>:8080` |

### 3. Rodar o app

```bash
# Recomendado no simulador iOS (usa localhost, evita erro de rede)
npx expo start --localhost
# pressione "i" (iOS) ou "a" (Android)
```

Outros scripts disponíveis:

```bash
npm run ios       # expo start --ios
npm run android   # expo start --android
npm run web       # expo start --web
npm start         # expo start
```

> **Dica:** só pode existir **um Metro bundler** ativo por vez. Se aparecer
> "Metro waiting on ...:8082" (porta diferente de 8081), há um processo antigo
> rodando — finalize-o antes (`pkill -f "expo start"`).

---

## Estrutura do projeto

```
app/                        # Rotas (Expo Router, file-based)
├── _layout.tsx             # Root: bootstrap de auth + ToastProvider
├── (auth)/                 # Fluxo não autenticado
│   ├── login.tsx           # → /login-verify
│   ├── login-verify.tsx    # OTP de login
│   ├── register.tsx        # → /register-verify
│   └── register-verify.tsx # OTP de registro
├── (tabs)/                 # App autenticado (tab bar)
│   ├── index.tsx           # Home / Dashboard
│   ├── workouts.tsx        # Lista de treinos
│   ├── history.tsx         # Histórico de sessões
│   └── profile.tsx         # Perfil + sessões ativas
├── workout/
│   ├── create.tsx          # Criar treino
│   └── [id]/
│       ├── index.tsx       # Detalhe do treino
│       ├── add-exercise.tsx# Buscar/criar exercício e adicionar
│       └── session.tsx     # Execução da sessão (registro de séries)
└── session/
    └── [id]/
        ├── index.tsx       # Detalhe de uma sessão (séries registradas)
        └── complete.tsx    # Tela de conclusão (resumo + status)

src/
├── components/ui/          # Button, Card, Badge, Input, OTPInput,
│                           # EmptyState, Toast
├── services/               # Camada de API (Axios)
│   ├── api.ts              # Instância + interceptors (token / 401)
│   ├── auth.service.ts
│   ├── workouts.service.ts
│   ├── exercises.service.ts
│   └── sessions.service.ts
├── stores/                 # Zustand (auth, workouts)
└── types/api.types.ts      # Tipos da API
```

---

## Funcionalidades implementadas

| Fluxo | Telas | Endpoints |
|---|---|---|
| **Autenticação** | Login, Registro, verificação OTP (2FA por e-mail) | `/auth/login`, `/auth/register`, `/auth/*/verify`, `/auth/*/resend` |
| **Treinos** | Lista (Hoje / Biblioteca), detalhe, criar | `GET/POST /workouts`, `GET /workouts/{id}` |
| **Exercícios** | Busca paginada (cursor) + criar inline | `GET/POST /exercises`, `POST /workouts/{id}/exercises` |
| **Sessão de treino** | Execução com registro de séries, timer de descanso, conclusão com resumo | `POST /workout-sessions`, `POST /workout-sessions/{id}/sets`, `PUT /workout-sessions/{id}` |
| **Histórico** | Sessões realizadas + treinos perdidos, detalhe da sessão | `GET /workout-sessions`, `GET /workout-sessions/missed`, `GET /workout-sessions/{id}` |
| **Perfil** | Dados do usuário, sessões ativas (revogar), logout | `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `POST /auth/logout` |

> A **Home/Dashboard** ainda é um stub — próxima tela a ser implementada.
> O sistema de **XP / níveis** está propositalmente fora do escopo atual.

---

## Autenticação

O backend usa **Bearer Token** (não JWT) com verificação em duas etapas:

1. `POST /auth/login` (ou `/register`) → backend envia um código de 6 dígitos por e-mail
2. `POST /auth/login/verify` com o código → retorna um token de 64 caracteres

O token é guardado de forma segura no **`expo-secure-store`**. O Axios
([src/services/api.ts](src/services/api.ts)) injeta automaticamente o header
`Authorization: Bearer <token>` em toda requisição, e um interceptor de resposta
limpa o token e redireciona para o login em caso de `401`.

---

## Design System

Tema escuro "Cyber-Athletic". Tokens definidos em
[tailwind.config.js](tailwind.config.js):

- **Fundo:** `#131314` · **Superfícies:** escala `surface-lowest` → `surface-highest`
- **Primária:** `#d0bcff` (roxo elétrico) · **Secundária:** `#4cd7f6` (ciano) · **Terciária:** `#ffb869` (âmbar)
- **Tipografia:** Inter — escala `display` / `headline` / `title` / `body` / `label`
- Espaçamento em grid de 4px, bordas `sm`/`md`/`lg`/`xl`/`full`

O detalhamento completo de telas, fluxos e o HTML de referência de cada tela
está em [PRD.md](PRD.md).

---

## Convenções

- **TypeScript strict** — valide com `npx tsc --noEmit` antes de commitar.
- Componentes de UI reutilizáveis vivem em `src/components/ui/`.
- Toda chamada de API passa pelos `services/`; telas não usam Axios direto.
- Estado de servidor compartilhado fica em stores Zustand (`src/stores/`).
- Estilização exclusivamente via `className` (NativeWind) — sem `StyleSheet`,
  exceto para sombras/glow (`shadow*`) e gradientes.

---

## Observações conhecidas

- **Ícones:** as telas usam glifos Unicode/emoji no lugar dos Material Symbols
  do design original (`@expo/vector-icons` ainda não foi adicionado).
- **`user_agent` das sessões:** em apps RN costuma vir genérico
  (`okhttp`/`expo`); o Perfil exibe o que o backend retornar, com fallback.
- **Avatar:** a API não tem endpoint de foto de perfil — o Perfil mostra um
  placeholder com a inicial; o botão de editar avisa "em breve".
- O app **não foi testado de ponta a ponta** contra um backend ativo; o código
  de integração está implementado conforme o guia da API, mas a validação
  end-to-end (login real → gravação) ainda está pendente.

---

## Licença

Projeto privado. Uso interno.