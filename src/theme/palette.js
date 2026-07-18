// Single source of truth for the PULSE design system palette. PULSE is
// dark-only: a neutral grey base with purple as the accent. Consumed by
// tailwind.config.js which exposes semantic token names the components use.
//
// Canonical reference: design-system.html at the repo root (CSS variables
// --color-*, --font-*, --radius-*, --space-*, --elevation-*, --duration-*).
const palette = {
  neutral: {
    50: "#DCDCDD", // lightest text / on-accent
    100: "#B5B4B8",
    200: "#908D94", // muted text
    300: "#6C6971",
    400: "#49474D",
    500: "#29282C", // surface-raised
    600: "#111113", // base background
  },
  purple: {
    50: "#E5D6FF",
    100: "#CAA4FF",
    200: "#B26CFF", // secondary accent (distinct from primary)
    300: "#8113D3", // primary accent
    400: "#6E00B3",
    500: "#41006C",
    600: "#1E0037",
  },
  semantic: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  surface: {
    bg: "#111113", // neutral-600
    default: "#1A191C",
    raised: "#29282C", // neutral-500
  },
  text: {
    DEFAULT: "#FFF", // neutral-50
    muted: "#908D94", // neutral-200
  },
  border: {
    DEFAULT: "rgba(255, 255, 255, 0.07)", // neutral-300
    strong: "#8113D34D", // purple-300 @ 30% — emphasized card border
  },
};

module.exports = { palette, ...palette };
