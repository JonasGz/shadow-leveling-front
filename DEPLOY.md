# Deploy do app (Android APK)

Guia rápido para gerar um APK do Shadow Leveling e distribuir para
testers (você, amigos, etc.) sem passar pela Play Store.

---

## 1. Configurar a URL da API

O app lê o endereço do backend de uma variável de ambiente em tempo de
build — não está hardcoded. Veja [src/services/api.ts](src/services/api.ts):

```ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
```

Variáveis com prefixo `EXPO_PUBLIC_` são embutidas no bundle automaticamente
pelo Expo. Para apontar o app para o backend deployado:

1. Crie um arquivo `.env` na raiz do projeto (já está no `.gitignore`):

   ```env
   EXPO_PUBLIC_API_URL=https://sua-api-publica.com
   ```

2. Para outros devs/CI saberem quais envs existem, atualize `.env.example`
   na raiz (esse pode ser commitado).

> A URL precisa ser **HTTPS** em produção. Android bloqueia HTTP (cleartext)
> por padrão a partir do Android 9. Use o backend atrás de TLS — qualquer
> plataforma de deploy moderna entrega isso de graça.

---

## 2. Identificadores do app

Antes do primeiro build, configure o `package` Android no `app.json`. Sem
isso o EAS pede pra preencher e o app não tem identidade única no device.

Adicione dentro de `expo.android`:

```jsonc
"android": {
  "package": "com.seunome.shadowleveling",
  "versionCode": 1,
  // ...resto do que já existe
}
```

Convenção: domínio reverso. Pode ser qualquer string única — não precisa
ter o domínio registrado. Mas uma vez publicado, **não muda mais**.

Para iOS (caso queira gerar IPA no futuro), adicione também:

```jsonc
"ios": {
  "bundleIdentifier": "com.seunome.shadowleveling",
  // ...
}
```

---

## 3. EAS Build (gera o APK na nuvem)

O EAS é o serviço de build da Expo. Você não precisa de Android Studio nem
de SDK Android local — tudo roda nos servidores deles.

### Instalação inicial (uma vez por máquina)

```bash
npm install -g eas-cli
eas login
```

Faça login com a conta Expo (cria de graça em https://expo.dev se não
tiver).

### Configurar o projeto (uma vez por repositório)

Na raiz do projeto:

```bash
eas build:configure
```

Esse comando cria um arquivo `eas.json` com perfis de build. Edite para
incluir um perfil `preview` que gera APK (em vez de AAB):

```jsonc
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://sua-api-publica.com"
      }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

> Você pode declarar `EXPO_PUBLIC_API_URL` no `eas.json` (como acima) **ou**
> deixar o EAS usar o `.env` local — escolha um caminho e evite duplicar.
> Para o build na nuvem, declarar no `eas.json` é mais explícito.

### Rodar o build

```bash
eas build --platform android --profile preview
```

O que acontece:

1. EAS faz upload do código para o builder na nuvem.
2. Compila o APK lá (10–20 min na primeira vez, ~5 min nas seguintes).
3. Te dá um link tipo `https://expo.dev/artifacts/eas/xxxxxx.apk`.

Você acompanha o status em https://expo.dev (dashboard do seu projeto).

---

## 4. Instalar no celular

### No seu device

1. Abre o link do `.apk` no navegador do celular.
2. Baixa o arquivo.
3. Toca pra instalar — o Android pede pra habilitar "Instalar de fontes
   desconhecidas" pro navegador/Files. Aceita.
4. App instalado.

### Para os amigos

Compartilha o mesmo link do `.apk` (WhatsApp, Telegram, Drive, etc.). O
fluxo deles é igual.

> Link do APK do EAS expira em ~30 dias. Para distribuição mais durável,
> hospede o `.apk` em um Drive/GitHub Release/etc.

---

## 5. Atualizar versões depois

Cada novo build precisa de `versionCode` maior no `app.json` (senão o
Android recusa atualizar por cima do anterior). Suba `versionCode: 1` →
`2` → `3` e mantenha o `version` (string) descritivo:

```jsonc
"version": "1.0.1",
"android": {
  "versionCode": 2,
  // ...
}
```

Depois roda `eas build --platform android --profile preview` de novo.

---

## Comandos úteis

```bash
eas build:list                              # histórico de builds
eas build:view <build-id>                   # detalhes de um build
eas build:cancel                            # cancela build em andamento
eas whoami                                  # confirma conta logada
```

---

## Resumindo

1. Backend deployado em HTTPS → você tem `https://sua-api.com`.
2. Cria `.env` com `EXPO_PUBLIC_API_URL=https://sua-api.com` (e/ou põe
   no `eas.json`).
3. Configura `android.package` no `app.json`.
4. `eas build --platform android --profile preview` → APK na nuvem.
5. Compartilha o link `.apk`.
