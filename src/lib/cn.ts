import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Só o que o tailwind-merge não conhece de fábrica precisa ser registrado aqui;
// um grupo custom não registrado falha em silêncio (mantém as duas classes, e
// quem vence passa a depender da ordem de geração do CSS).
//
// Nem fontSize nem espaçamento entram na lista: os dois usam a escala nativa
// (text-xs…text-5xl, 1..16), que o tailwind-merge já reconhece. O config
// sobrescreve os *valores* dessas chaves, não os nomes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Elevação do design system: flat/low/medium/high no lugar da escala
      // sm/md/lg/xl que o tailwind-merge assume.
      shadow: [{ shadow: ["flat", "low", "medium", "high"] }],
    },
  },
});

/**
 * Compõe classes condicionais e resolve conflitos (a última vence).
 *
 *   cn("p-md", isWide && "p-lg")        → "p-lg"
 *   cn("text-base", className)          → className vence se também for text-*
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
