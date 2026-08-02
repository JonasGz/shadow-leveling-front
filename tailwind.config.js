const { color, difficulty } = require("./src/theme/palette");

const elevation = {
  flat: "none",
  low: "0px 1px 2px rgba(0,0,0,0.20), 0px 1px 3px rgba(0,0,0,0.12)",
  medium: "0px 2px 6px rgba(0,0,0,0.28), 0px 1px 2px rgba(0,0,0,0.20)",
  high: "0px 6px 16px rgba(0,0,0,0.40), 0px 2px 4px rgba(0,0,0,0.25)",
};

const motion = {
  duration: { fast: "150ms", base: "200ms", slow: "300ms" },
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...color,
        difficulty,
      },
      opacity: {
        7: "0.07",
        12: "0.12",
      },
      fontFamily: {
        sans: ["Poppins_400Regular", "System"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "26px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "30px" }],
        "3xl": ["28px", { lineHeight: "34px" }],
        "4xl": ["32px", { lineHeight: "40px" }],
        "5xl": ["56px", { lineHeight: "58px" }],
      },
      borderRadius: {
        sm: "4px",
        lg: "12px",
        "2xl": "28px",
        full: "9999px",
      },
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
