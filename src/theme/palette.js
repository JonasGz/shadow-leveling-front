// Fonte única de verdade das cores. Objeto PLANO: cada chave é exatamente o
// sufixo da classe Tailwind gerada a partir dela.
//
//   <View className="bg-purple-100">
//     <Text className="text-purple-100">
//     <Icon color={color["purple-100"]} />
//
// O prefixo (bg-/text-/border-) diz qual propriedade pintar; o sufixo diz qual
// cor. Ler o mesmo sufixo em lugares diferentes é o que permite reconhecer de
// imediato que são a mesma tinta — por isso a escala é literal (purple-300) e
// não semântica (primary/secondary/surface-low), que era como estava antes e
// escondia ~10 apelidos apontando para o mesmo hex.
//
// Consumido por tailwind.config.js via require, então classe e JS não podem
// divergir. Tipos em ./palette.d.ts.
//
// Referência canônica do design system: design-system.html na raiz do repo.
const color = {
  white: "#FFFFFF",

  // Escala neutra, do texto mais claro ao fundo mais escuro.
  "gray-50": "#DCDCDD", // texto claro / on-accent
  "gray-100": "#B5B4B8",
  "gray-200": "#908D94", // texto secundário
  "gray-300": "#6C6971", // borda/ícone discreto
  "gray-400": "#49474D", // borda em superfície escura
  "gray-500": "#29282C", // superfície elevada
  "gray-600": "#1A191C", // superfície de card
  "gray-700": "#111113", // fundo base do app

  // Roxo: a cor de marca. 300 é o acento primário.
  "purple-50": "#E5D6FF",
  "purple-100": "#CAA4FF",
  "purple-200": "#B26CFF",
  "purple-300": "#8113D3",
  "purple-400": "#6E00B3",
  "purple-500": "#41006C",
  "purple-600": "#1E0037",

  // Estes seguem semânticos de propósito: cada um é um hex único, sem apelido
  // duplicado, e o nome já carrega a intenção. `bg-error` diz mais que
  // `bg-red-500`.
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

// Dificuldade é vocabulário de domínio, não de cor.
const difficulty = {
  easy: color.success,
  medium: color.warning,
  hard: color.error,
  "no-rank": color["gray-200"],
};

module.exports = { color, difficulty };
