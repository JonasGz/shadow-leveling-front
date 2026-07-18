import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// O tailwind.config define escalas próprias que o tailwind-merge não conhece de
// fábrica. Sem registrá-las aqui ele erra silenciosamente: `text-h1` cai no
// grupo de COR (porque não bate com a escala de tamanho padrão), então
// cn("text-h1", "text-gray-200") devolveria as duas — ou pior, descartaria a
// errada. Registrar os grupos é o que faz o merge realmente funcionar.
const FONT_SIZES = [
  "display",
  "display-xxl",
  "display-xl",
  "display-lg",
  "display-md",
  "h1",
  "h2",
  "h3",
  "headline-lg",
  "headline-mobile",
  "title",
  "title-md",
  "title-lg",
  "title-xl",
  "title-xxl",
  "subtitle",
  "body",
  "body-sm",
  "body-lg",
  "body-md",
  "button",
  "caption",
  "label-md",
  "label-sm",
];

// Espaçamento não precisa de registro: a escala é a numérica do Tailwind
// (1..16), que o tailwind-merge já conhece de fábrica. Os apelidos
// xs/sm/md/lg/xl foram removidos do config.

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
      // Elevação do design system: flat/low/medium/high no lugar da escala
      // sm/md/lg/xl que o tailwind-merge assume.
      shadow: [{ shadow: ["flat", "low", "medium", "high"] }],
      tracking: [{ tracking: ["label"] }],
    },
  },
});

/**
 * Compõe classes condicionais e resolve conflitos (a última vence).
 *
 *   cn("p-md", isWide && "p-lg")        → "p-lg"
 *   cn("text-body", className)          → className vence se também for text-*
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
