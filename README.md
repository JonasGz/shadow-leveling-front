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

| Camada          | Tecnologia                                                             |
| --------------- | ---------------------------------------------------------------------- |
| Framework       | [Expo](https://expo.dev) SDK 54 + React Native 0.81                    |
| Linguagem       | TypeScript (strict)                                                    |
| Navegação       | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Estilização     | [NativeWind v4](https://www.nativewind.dev/) (TailwindCSS)             |
| Estado global   | [Zustand](https://github.com/pmndrs/zustand)                           |
| HTTP            | [Axios](https://axios-http.com/) com interceptors de Bearer Token      |
| Formulários     | React Hook Form + [Zod](https://zod.dev/)                              |
| Storage seguro  | `expo-secure-store` (token de sessão)                                  |
| Animação/Visual | `expo-linear-gradient`, `react-native-reanimated`                      |

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

| Ambiente           | URL da API                        |
| ------------------ | --------------------------------- |
| Simulador iOS      | `http://localhost:8080`           |
| Emulador Android   | `http://10.0.2.2:8080`            |
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

| Fluxo                | Telas                                                                    | Endpoints                                                                                  |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Autenticação**     | Login, Registro, verificação OTP (2FA por e-mail)                        | `/auth/login`, `/auth/register`, `/auth/*/verify`, `/auth/*/resend`                        |
| **Treinos**          | Lista (Hoje / Biblioteca), detalhe, criar                                | `GET/POST /workouts`, `GET /workouts/{id}`                                                 |
| **Exercícios**       | Busca paginada (cursor) + criar inline                                   | `GET/POST /exercises`, `POST /workouts/{id}/exercises`                                     |
| **Sessão de treino** | Execução com registro de séries, timer de descanso, conclusão com resumo | `POST /workout-sessions`, `POST /workout-sessions/{id}/sets`, `PUT /workout-sessions/{id}` |
| **Histórico**        | Sessões realizadas + treinos perdidos, detalhe da sessão                 | `GET /workout-sessions`, `GET /workout-sessions/missed`, `GET /workout-sessions/{id}`      |
| **Perfil**           | Dados do usuário, sessões ativas (revogar), logout                       | `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `POST /auth/logout`    |
| **Gamificação**      | Nível, título e constância semanal no dashboard e no perfil              | `GET /me/level`                                                                            |
| **Grupos**           | Lista, detalhe, ranking, feed com reações e comentários                  | `GET/POST /groups`, `GET /groups/{id}/ranking`, `GET /groups/{id}/feed`                    |
| **Missões**          | Tarefas do dia e resumo semanal                                          | `GET /tasks/day`, `GET /user-metrics/today`, `GET /user-metrics/weekly`                    |
| **Assistente de IA** | Chat guiado, consentimento 18+, preview e criação da proposta            | `POST /ai/workout-chat`, `PATCH /auth/me/ai-consent`, `POST /ai/report`                    |

---

## Como funciona a progressão

> Esta seção descreve o jogo do ponto de vista de quem usa o app. O cálculo
> acontece no backend; o app apenas exibe o que `GET /me/level` devolve.

Cada treino concluído dá XP. XP sobe seu nível. E o nível te dá um **título** —
que é o que aparece no seu perfil.

### Os oito títulos

| Título          | A partir do nível | Quando você chega (treinando 4× por semana) |
| --------------- | ----------------- | ------------------------------------------- |
| **Novato**      | 1                 | no primeiro treino                          |
| **Caçador**     | 10                | ~1ª semana                                  |
| **Incansável**  | 25                | ~2ª semana                                  |
| **Inquebrável** | 50                | ~3ª semana                                  |
| **Comandante**  | 100               | ~1 mês                                      |
| **Lendário**    | 200               | ~1,5 mês                                    |
| **Monarca**     | 500               | ~2,5 meses                                  |
| **Soberano**    | 1000              | ~3 meses                                    |

### Por que fica mais rápido com o tempo

Cada nível custa sempre a mesma coisa: **50 XP**. O que muda é o quanto você
ganha por treino — e isso cresce conforme você sobe.

| Seu nível | Você ganha por treino | Quantos níveis isso vale |
| --------- | --------------------- | ------------------------ |
| 1         | 40 XP                 | ~1 nível                 |
| 25        | 200 XP                | 4 níveis                 |
| 100       | 400 XP                | 8 níveis                 |
| 1000      | 1.264 XP              | 25 níveis                |

No começo, um treino te dá um nível. Mais para frente, o mesmo treino te dá 25.
É o oposto do que costuma acontecer em jogos, onde cada nível fica mais caro que
o anterior — aqui, quanto mais longe você chega, mais rápido avança.

### Os dois bônus

Além do ganho base, dois bônus se somam. Ambos dependem da **sua meta semanal**
(quantos dias por semana você se comprometeu a treinar), configurável no app.

**1. Bônus da semana — até +25%**

Cresce conforme você avança na sua meta e chega ao máximo quando você a cumpre.

Se sua meta é 4 treinos por semana, o 4º treino te dá +25%. Se é 7, o 7º te dá
os mesmos +25%. **Ninguém é penalizado por treinar menos vezes** — o que conta é
cumprir o que você mesmo definiu.

Toda segunda-feira ele zera e a corrida recomeça.

**2. Bônus de constância — a partir de +20%, sem limite**

Este é o que premia não faltar. A cada semana em que você bate sua meta, ele
cresce:

| Semanas seguidas | Bônus |
| ---------------- | ----- |
| 1                | +20%  |
| 2                | +32%  |
| 4                | +43%  |
| 7                | +50%  |
| 15               | +67%  |
| 52 (um ano)      | +141% |

Ele sobe rápido nas primeiras semanas — que é quando é mais fácil desistir — e
depois nunca para de crescer. Um ano de constância mais que dobra o XP de cada
treino.

**Se você não bater a meta em uma semana, este bônus zera.** Mas seu recorde de
semanas seguidas fica guardado no perfil para sempre.

### Os dois contadores do perfil

- **Dias seguidos** — dias consecutivos em que você treinou. É seu histórico de
  constância diária; não afeta o XP.
- **Semanas seguidas** — semanas consecutivas batendo sua meta. É este que
  aumenta seu bônus, e é o número que continua crescendo mesmo depois de você
  chegar a Soberano.

A semana vai de **segunda a domingo**.
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

## Assistente de treino com IA

Um chat guiado ([app/ai/](app/ai/)) que faz seis perguntas — dias por semana,
tempo de treino, objetivo, foco muscular, duração e onde treina — e devolve uma
**proposta** de treino para o usuário revisar.

A proposta **não é um treino**. Ela vive apenas no estado da tela até o usuário
confirmar; só então `createWorkoutFromProposal`
([src/services/ai.service.ts](src/services/ai.service.ts)) cria os treinos de
verdade, pelas mesmas rotas que o fluxo manual usa. Um treino por dia do plano,
sequencialmente — o assistente propõe, o usuário cria.

O servidor é stateless, então o app reenvia o histórico da conversa a cada
turno. Nada é guardado em disco.

A resposta chega em um de quatro estados:

| Estado     | O que a tela faz                                                     |
| ---------- | -------------------------------------------------------------------- |
| `question` | renderiza a próxima pergunta                                         |
| `proposal` | mostra o preview com os dias, exercícios, séries e repetições        |
| `refusal`  | recusa; se `health_stop`, **encerra** e oferece a criação manual     |
| `error`    | mensagem genérica de indisponibilidade                               |

**Menção a saúde encerra a conversa.** Se o usuário citar lesão, dor, gravidez
ou medicação, o assistente não adapta o treino — ele encaminha a um
profissional. É uma decisão de produto, não uma limitação técnica.

**Consentimento antes da primeira mensagem.** A tela
[app/ai/consent.tsx](app/ai/consent.tsx) coleta o aceite e a data de nascimento
(18+) antes de qualquer texto sair do dispositivo. Um `428` do backend leva o
usuário para lá; `403` é menor de idade, `429` é o limite diário, e `404`
significa backend sem provider configurado — nesse caso o app segue funcionando
normalmente na criação manual.

O botão de report envia a proposta para revisão sem sair do app, como exige a
política de conteúdo gerado por IA do Google Play.

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
