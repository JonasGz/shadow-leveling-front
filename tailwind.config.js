const { palette } = require("./src/theme/palette");

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
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Semantic surface tokens (PULSE). Components only know these names;
        // the underlying values moved from purple-tinged to neutral dark.
        background: palette.surface.bg,
        surface: {
          DEFAULT: palette.surface.default,
          dim: palette.surface.bg,
          bright: palette.surface.raised,
          lowest: palette.surface.bg,
          low: palette.surface.default,
          container: palette.surface.default,
          high: palette.surface.raised,
          highest: palette.surface.raised,
        },
        "on-surface": palette.text.DEFAULT,
        "on-surface-variant": palette.text.muted,
        outline: palette.neutral[400], // neutral border on dark surfaces
        "outline-variant": palette.neutral[300],
        "card-border": palette.border.DEFAULT,
        "card-border-strong": palette.border.strong,
        "surface-tint": palette.purple[200],
        primary: {
          DEFAULT: palette.purple[300], // #8113D3 accent
          container: palette.purple[400],
          fixed: palette.purple[50],
          "fixed-dim": palette.purple[100],
        },
        "on-primary": palette.neutral[50],
        "on-primary-fixed": palette.surface.bg,
        "on-primary-fixed-variant": palette.purple[400],
        secondary: {
          // secondary accent is the lighter purple (purple-200), distinct from
          // the primary purple-300 so two accents side-by-side read separately.
          DEFAULT: palette.purple[200],
          container: palette.purple[300],
          fixed: palette.purple[50],
          "fixed-dim": palette.purple[100],
        },
        "on-secondary": palette.surface.bg,
        "on-secondary-fixed": palette.surface.bg,
        "on-secondary-fixed-variant": palette.purple[600],
        // tertiary collapes the old orange onto the purple accent family.
        tertiary: {
          DEFAULT: palette.purple[200],
          container: palette.purple[300],
          fixed: palette.purple[50],
          "fixed-dim": palette.purple[100],
        },
        "on-tertiary": palette.surface.bg,
        "on-tertiary-fixed": palette.surface.bg,
        "on-tertiary-fixed-variant": palette.purple[600],
        error: {
          DEFAULT: palette.semantic.error,
          container: palette.semantic.error,
        },
        "on-error": palette.neutral[50],
        "on-error-container": palette.neutral[50],
        // Semantic surface aliases for the Toast/Badge etc.
        success: palette.semantic.success,
        warning: palette.semantic.warning,
        info: palette.semantic.info,
        difficulty: {
          // Aligned to PULSE semantic hues.
          easy: palette.semantic.success,
          medium: palette.semantic.warning,
          hard: palette.semantic.error,
          "no-rank": palette.neutral[200],
        },
      },
      fontFamily: {
        sans: ["OpenSans_400Regular", "System"],
        // ponytail: token defined so phase-C data components can opt in; the
        // font itself is not loaded yet — add @expo-google-fonts/jetbrains-mono
        // when the first consumer lands.
        mono: ["JetBrains Mono", "monospace"],
      },
      // Letter-spacing disabled app-wide: every tracking-* resolves to 0.
      letterSpacing: {
        tighter: "0px",
        tight: "0px",
        normal: "0px",
        wide: "0px",
        wider: "0px",
        widest: "0px",
      },
      fontSize: {
        // PULSE type scale.
        display: ["40px", { lineHeight: "48px", fontWeight: "800" }],
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h2: ["28px", { lineHeight: "34px", fontWeight: "700" }],
        h3: ["24px", { lineHeight: "30px", fontWeight: "600" }],
        title: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        subtitle: ["18px", { lineHeight: "26px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        button: ["15px", { lineHeight: "20px", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        // Oversized display tokens for hero titles (above the base 40px scale).
        "display-xxl": ["56px", { lineHeight: "58px", fontWeight: "800" }],
        "display-xl": ["48px", { lineHeight: "52px", fontWeight: "800" }],
        // Aliases for legacy names → closest PULSE value.
        "display-lg": ["40px", { lineHeight: "48px", fontWeight: "800" }], // →display
        "display-md": ["40px", { lineHeight: "48px", fontWeight: "800" }], // →display
        "headline-lg": ["28px", { lineHeight: "34px", fontWeight: "700" }], // →h2
        "headline-mobile": ["24px", { lineHeight: "30px", fontWeight: "600" }], // →h3
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }], // →title
        "title-lg": ["24px", { lineHeight: "30px", fontWeight: "700" }], // →h3
        "title-xl": ["28px", { lineHeight: "34px", fontWeight: "700" }], // →h2
        "title-xxl": ["32px", { lineHeight: "40px", fontWeight: "700" }], // →h1
        "body-lg": ["18px", { lineHeight: "26px", fontWeight: "400" }], // →subtitle weight 400-ish
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }], // →body
        "label-md": ["15px", { lineHeight: "20px", fontWeight: "600" }], // →button
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }], // →caption
      },
      borderRadius: {
        // PULSE radius scale (reduces existing ~4px).
        sm: "4px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        "2xl": "28px",
        "3xl": "36px",
        full: "9999px",
      },
      spacing: {
        // PULSE numeric scale (1=4 … 16=64) in addition to the legacy named
        // tokens, which are kept as a subset so existing class names still work.
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
        // Legacy named subset of the same scale.
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
      boxShadow: elevation,
      transitionDuration: motion.duration,
      transitionTimingFunction: { DEFAULT: motion.ease },
    },
  },
  plugins: [],
};
