import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ["flat", "low", "medium", "high"] }],
      // xxs não existe na escala nativa; sem registrar, `cn("text-xxs", …)`
      // não trataria como font-size e a merge falharia em silêncio
      "font-size": [{ text: ["xxs"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
