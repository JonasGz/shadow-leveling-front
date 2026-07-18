# Performance

Notas de performance do app. Números medidos, não estimados.

## Como medir o bundle

```bash
npx expo export --platform ios --output-dir /tmp/export-check
ls -lh /tmp/export-check/_expo/static/js/ios/*.hbc
```

Rode antes e depois de qualquer mudança que mexa em dependências ou imports.

## Histórico

| Quando                       | Bundle iOS (Hermes) | O que mudou             |
| ---------------------------- | ------------------- | ----------------------- |
| Antes do refactor            | 7,69 MB             | baseline                |
| Imports de ícone por subpath | 5,88 MB             | −1,81 MB (−23,5%)       |
| + `@shopify/flash-list`      | **6,02 MB**         | +0,14 MB (custo da lib) |

Saldo: **−1,67 MB (−21,7%)** contra o baseline.

### Por que o barrel do lucide custava 1,8 MB

`import { Timer } from "lucide-react-native"` puxa o barrel, que reexporta
~1500 ícones. O Metro **não** faz tree-shaking por padrão, então todos entravam
no bundle. Verificado grepando o `.hbc` por ícones que o app nunca usa:

```bash
HBC=$(ls /tmp/export-check/_expo/static/js/ios/*.hbc)
strings "$HBC" | grep -c 1cscit   # chave do path do ícone "banana"
```

Antes: presente. Depois: ausente.

**Regra:** importe ícone sempre por subpath.

```ts
import Timer from "lucide-react-native/icons/timer"; // ✅
import { Timer } from "lucide-react-native"; // ❌ puxa 1500
```

O nome do módulo é kebab-case (`ArrowLeftRight` → `arrow-left-right`,
`Share2` → `share-2`). Cuidado com aliases: `Home` é alias de `House`, e o
módulo real é `house` — `lucide-react-native/icons/home` tem `.d.ts` mas não
tem `.mjs`, então o TypeScript aceita e **quebra em runtime**.

Tipos (`LucideIcon`) continuam vindo da raiz — são apagados na compilação e não
custam bundle.

## Re-renders

Duas coisas já resolvidas, não desfaça sem medir:

- **Timers da sessão** (`src/components/session/`): `SessionClock` e `RestTimer`
  são donos da própria contagem. Enquanto o `elapsed` era estado da tela, cada
  segundo re-renderizava o pager e todas as linhas de série do treino inteiro.
- **Poll do feed de grupo** (`app/group/[id]/index.tsx`): compara uma assinatura
  (scores + id do item mais novo) antes de chamar `setState`. O poll de 15s não
  causa re-render quando nada mudou.

`ExercisePage` e `SetRow` são memoizados, e os callbacks passados a eles são
mantidos estáveis de propósito (ver o `liveStateRef` em `session.tsx`). Trocar
esses callbacks por closures inline anula o memo.

## Ainda não medido

Falta um profiling de runtime real (React DevTools) — o refactor priorizou
correções estruturais inequívocas. Para investigar jank:

1. Metro rodando → `j` abre o React Native DevTools.
2. Aba Profiler, gravar a interação (scroll do feed, digitar na busca).
3. Olhar commits mais caros e contagem de re-render.

Alvos prováveis, em ordem: scroll do feed de grupo em grupos grandes, busca de
exercícios ao digitar rápido.
