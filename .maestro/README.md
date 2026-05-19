# Testes E2E — Maestro

## Instalação

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Reinicie o terminal após instalar.

## Pré-requisito

O app precisa estar rodando no emulador/device antes de executar os flows:

```bash
npx expo start
```

No Expo Go, o `appId` é `host.exp.exponent`. Se você fizer um **build dev standalone**, troque pelo bundle ID real (`com.seunome.shadowleveling`).

## Variáveis de ambiente

| Variável      | Descrição                              |
|---------------|----------------------------------------|
| `EMAIL`       | E-mail da conta de teste               |
| `PASSWORD`    | Senha da conta de teste                |
| `NICKNAME`    | Nick para testar edição                |
| `WORKOUT_NAME`| Nome do treino a criar                 |
| `WORKOUT_DESC`| Descrição do treino                    |

## Como rodar

### Todos os flows em sequência
```bash
maestro test .maestro/ \
  -e EMAIL=seu@email.com \
  -e PASSWORD=suasenha \
  -e NICKNAME=ShadowHunter \
  -e WORKOUT_NAME="Treino Peito" \
  -e WORKOUT_DESC="Foco em peitoral"
```

### Flow individual
```bash
maestro test .maestro/01_nickname.yaml -e NICKNAME=Hunter99
```

### Com relatório visual
```bash
maestro test .maestro/ --format junit --output report.xml
```

## Flows disponíveis

| Arquivo | O que testa |
|---------|-------------|
| `00_login.yaml` | Login → redirecionamento para Home |
| `01_nickname.yaml` | Editar nick no perfil → verificar na header da Home |
| `02_create_workout.yaml` | Criar treino → adicionar exercício → verificar na lista |
| `03_dashboard.yaml` | Smoke test da Home: saudação, métricas, tab bar |
