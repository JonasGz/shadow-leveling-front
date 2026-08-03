const color = {
  white: "#FFFFFF",

  "gray-50": "#DCDCDD",
  "gray-100": "#B5B4B8",
  "gray-200": "#908D94",
  "gray-300": "#6C6971",
  "gray-400": "#49474D",
  "gray-500": "#29282C",
  "gray-600": "#1A191C",
  "gray-700": "#111113",

  "purple-50": "#E5D6FF",
  "purple-100": "#CAA4FF",
  "purple-200": "#B26CFF",
  "purple-300": "#8113D3",
  "purple-400": "#6E00B3",
  "purple-500": "#41006C",
  "purple-600": "#1E0037",

  "purple-grad-from": "#9F1FFF",
  "purple-grad-to": "#7A0FD0",

  success: "#4ADE80",
  warning: "#FACC15",
  error: "#F87171",
  info: "#CAA4FF", // = purple-100, de propósito: info é o accent do app, não azul
};

const difficulty = {
  easy: color.success,
  medium: color.warning,
  hard: color.error,
  "no-rank": color["gray-200"],
};

module.exports = { color, difficulty };
