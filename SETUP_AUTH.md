# Setup de autenticação — frontend

O app entra por Google, Apple ou email + código, todos **sem senha**. Google e
Apple usam login **nativo**, então o app precisa de um **EAS dev build** (não roda
no Expo Go). Este guia lista as variáveis e credenciais necessárias.

## Resumo

| Env (`.env`) | Obrigatória? | O que é |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | sim | URL do backend |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | login Google | client ID **Web** do Google |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | login Google (iOS) | client ID **iOS** do Google |

Apple no app **não usa env** — usa o `bundleIdentifier` do `app.json`
(`com.jonasgz.shadowleveling`), já configurado com `usesAppleSignIn: true`.

## Google

1. [Google Cloud Console](https://console.cloud.google.com) → mesmo projeto do backend.
2. *APIs & Services → Credentials → Create credentials → OAuth client ID*:
   - **Web application** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (também vai no backend).
   - **iOS** (bundle `com.jonasgz.shadowleveling`) → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
   - **Android** (package `com.jonasgz.shadowleveling` + SHA‑1) → não vira env, mas
     é necessário pro login Android funcionar. Pegue o SHA‑1 com `eas credentials`.

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234-ios.apps.googleusercontent.com
```

> O ID token gerado tem `aud` = web client id, então o backend precisa ter esse
> mesmo id em `GOOGLE_CLIENT_IDS`.

## Apple

1. [Apple Developer](https://developer.apple.com) → *Identifiers* → no App ID
   `com.jonasgz.shadowleveling`, habilite **Sign in with Apple**.
2. Nada de env no app. O backend aceita o bundle id via `APPLE_CLIENT_IDS`.

## Dev build (obrigatório para Google/Apple)

As libs nativas (`@react-native-google-signin/google-signin`,
`expo-apple-authentication`) **não funcionam no Expo Go**. Gere um dev build:

```bash
eas build --profile development --platform ios      # ou android
# instale o build no device, depois:
npx expo start --dev-client
```

O login por **email + código** funciona no Expo Go normalmente (não precisa de
credencial nem dev build) — bom para testar o fluxo passwordless isolado.
