// Tipos para palette.js. O arquivo continua .js porque tailwind.config.js o
// carrega via require em tempo de build, fora do pipeline do TS.
export declare const color: {
  readonly white: "#FFFFFF";

  readonly "gray-50": "#DCDCDD";
  readonly "gray-100": "#B5B4B8";
  readonly "gray-200": "#908D94";
  readonly "gray-300": "#6C6971";
  readonly "gray-400": "#49474D";
  readonly "gray-500": "#29282C";
  readonly "gray-600": "#1A191C";
  readonly "gray-700": "#111113";

  readonly "purple-50": "#E5D6FF";
  readonly "purple-100": "#CAA4FF";
  readonly "purple-200": "#B26CFF";
  readonly "purple-300": "#8113D3";
  readonly "purple-400": "#6E00B3";
  readonly "purple-500": "#41006C";
  readonly "purple-600": "#1E0037";

  readonly "purple-grad-from": "#9F1FFF";
  readonly "purple-grad-to": "#7A0FD0";

  readonly success: "#22C55E";
  readonly warning: "#F59E0B";
  readonly error: "#EF4444";
  readonly info: "#3B82F6";
};

export declare const difficulty: {
  readonly easy: "#22C55E";
  readonly medium: "#F59E0B";
  readonly hard: "#EF4444";
  readonly "no-rank": "#908D94";
};
