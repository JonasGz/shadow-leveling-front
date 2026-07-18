const { color, difficulty } = require("./src/theme/palette");

// Elevation tokens (PULSE) translated to RN shadow props. tailwind/nativewind
// consumes box-shadow strings for web; on RN the NativeWind shadow* utilities
// (shadow-flat/low/medium/high) drive the platform shadow. We also expose the
// raw values via theme.extend.boxShadow for direct use.
const elevation = {
  flat: "none",
  low: "0px 1px 2px rgba(0,0,0,0.20), 0px 1px 3px rgba(0,0,0,0.12)",
  medium: "0px 2px 6px rgba(0,0,0,0.28), 0px 1px 2px rgba(0,0,0,0.20)",
  high: "0px 6px 16px rgba(0,0,0,0.40), 0px 2px 4px rgba(0,0,0,0.25)",
};

// Motion tokens (PULSE). `ease` is the CSS cubic-bezier; nativewind exposes
// transitionTimingFunction/transitionDuration utilities that read these.
const motion = {
  duration: { fast: "150ms", base: "200ms", slow: "300ms" },
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // A escala é literal (purple-300, gray-600), não semântica. Nomes como
      // `primary`/`secondary`/`surface-low` escondiam ~10 apelidos apontando
      // para o mesmo hex — `secondary` e `tertiary` eram idênticos, e
      // `secondary-container` era o mesmo que `primary`. Ver src/theme/palette.js.
      colors: {
        ...color,
        difficulty,
      },
      // 7 e 12 não existem na escala padrão (que vai de 5 em 5 a partir de 20),
      // e sem registrá-los `border-white/7` não gera CSS nenhum — a borda some
      // sem erro. São as duas bordas brancas do design system: /7 para card e
      // container, /12 para controle em repouso (input, chip, botão de ícone).
      opacity: {
        7: "0.07",
        12: "0.12",
      },
      fontFamily: {
        sans: ["OpenSans_400Regular", "System"],
        // ponytail: token defined so phase-C data components can opt in; the
        // font itself is not loaded yet — add @expo-google-fonts/jetbrains-mono
        // when the first consumer lands.
        mono: ["JetBrains Mono", "monospace"],
      },
      // letterSpacing removido: o bloco zerava tighter/tight/normal/wide/wider/
      // widest, então 34 das 48 classes de tracking do app não renderizavam
      // nada. O único valor real era `label` (0.5px), para label em caixa alta
      // — coberto agora pelo `tracking-wider` nativo (0.05em ≈ 0.6px a 12px).
      fontSize: {
        // Escala nativa do Tailwind com os valores do design system. Nomes
        // nativos de propósito: `text-xl` é o que qualquer dev já sabe ler, e o
        // tailwind-merge reconhece o grupo de fábrica — por isso src/lib/cn.ts
        // não registra classGroup de font-size.
        //
        // Antes existia uma escala semântica paralela (display/h1/title-md/
        // label-sm/…): 24 tokens para 13 valores distintos, 11 duplicatas
        // exatas e 10 nunca usados. Cada tupla embutia um fontWeight que 52%
        // dos call sites sobrescreviam (100% nos títulos), então a classe nunca
        // dizia a verdade. Peso agora é sempre explícito no <Text>.
        //
        // Todas as chaves são redeclaradas, inclusive as que batem com o
        // nativo, para a escala caber inteira numa leitura só.
        xs: ["12px", { lineHeight: "16px" }], // micro-label, caption
        sm: ["14px", { lineHeight: "20px" }], // texto secundário
        base: ["16px", { lineHeight: "24px" }], // corpo, label de controle
        lg: ["18px", { lineHeight: "26px" }],
        xl: ["20px", { lineHeight: "28px" }], // título de card/seção
        "2xl": ["24px", { lineHeight: "30px" }],
        "3xl": ["28px", { lineHeight: "34px" }],
        "4xl": ["32px", { lineHeight: "40px" }], // título de página
        "5xl": ["56px", { lineHeight: "58px" }], // hero de auth
      },
      // Quatro raios, um por papel. Antes eram ~11 valores com os papéis
      // misturados: card aparecia em 28px e 20px sem critério, e botão de
      // ícone em 10, 12 e 20. `rounded` e `rounded-md` eram o mesmo 8px.
      //
      // O salto container→controle (28→12) é o que mantém o aninhamento
      // harmônico sem auditoria: o elemento de dentro sempre lê menos redondo
      // que o de fora.
      borderRadius: {
        sm: "4px", // micro: tag, marcador
        lg: "12px", // controle: input, botão, chip, tile de ícone
        "2xl": "28px", // container: card, painel, modal, sheet
        full: "9999px", // pílula, avatar, círculo, track
      },
      // Escala única, numérica (1=4px … 16=64px). Os antigos xs/sm/md/lg/xl
      // eram apelidos exatos de 1/2/4/6/10 e conviviam com ela, então o mesmo
      // 16px atendia por `p-md` e `p-4` sem critério de qual usar.
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        11: "44px",
        12: "48px",
        13: "52px",
        14: "56px",
        15: "60px",
        16: "64px",
      },
      boxShadow: elevation,
      transitionDuration: motion.duration,
      transitionTimingFunction: { DEFAULT: motion.ease },
    },
  },
  plugins: [],
};
