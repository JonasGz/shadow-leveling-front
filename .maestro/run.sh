#!/bin/bash
# Runner dos testes E2E (Maestro) para app Expo Go.
#
# O Expo Go não carrega o projeto sozinho com launchApp — é preciso
# disparar o deep link exp:// no simulador (mesmo mecanismo do `i` no
# expo start). Este wrapper faz isso ANTES de chamar o maestro, porque
# o openLink/runScript do Maestro não dispara o deep link no Expo Go iOS.
#
# Uso:
#   .maestro/run.sh                       # roda todos os flows
#   .maestro/run.sh 03_dashboard.yaml     # roda um flow específico
#
# Variáveis de ambiente (com defaults):
#   EXPO_URL   exp://127.0.0.1:8081
#   EMAIL      pana@dev.com
#   PASSWORD   pana123456
#   NICKNAME   ShadowHunter
#   WORKOUT_NAME / WORKOUT_DESC

set -e

cd "$(dirname "$0")/.."

EXPO_URL="${EXPO_URL:-exp://127.0.0.1:8081}"
MAESTRO="$HOME/.maestro/bin/maestro"
TARGET="${1:-.maestro/}"
[ "$TARGET" != ".maestro/" ] && TARGET=".maestro/$1"

# Encerra o Expo Go antes de reabrir, para o app montar com estado
# limpo (o React state do formulário persiste entre execuções enquanto
# o Expo Go fica vivo, acumulando texto nos campos).
echo "→ Encerrando Expo Go"
xcrun simctl terminate booted host.exp.Exponent 2>/dev/null || true
sleep 2

echo "→ Abrindo projeto no simulador via $EXPO_URL"
xcrun simctl openurl booted "$EXPO_URL"
echo "→ Aguardando o bundle JS carregar..."
sleep 10

echo "→ Rodando Maestro: $TARGET"
"$MAESTRO" test "$TARGET" \
  -e EMAIL="${EMAIL:-pana@dev.com}" \
  -e PASSWORD="${PASSWORD:-pana123456}" \
  -e NICKNAME="${NICKNAME:-ShadowHunter}" \
  -e WORKOUT_NAME="${WORKOUT_NAME:-Treino Peito}" \
  -e WORKOUT_DESC="${WORKOUT_DESC:-Foco em peitoral}"
