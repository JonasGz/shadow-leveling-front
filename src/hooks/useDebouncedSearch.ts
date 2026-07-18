import { useEffect, useRef, useState } from "react";

interface Options {
  /** Desliga a busca (ex.: modal fechado). */
  enabled?: boolean;
  /** Abaixo disso não consulta a API e chama onSkip. */
  minLength?: number;
  /** 350ms cobre a digitação sem disparar uma request por tecla. */
  delayMs?: number;
  /** Chamado quando a query é curta demais ou a busca está desligada. */
  onSkip?: () => void;
}

/**
 * Debounce de busca com proteção contra resposta fora de ordem.
 *
 * `run` recebe `isCurrent()`: consulte antes de gravar estado, senão uma
 * resposta lenta de uma query antiga sobrescreve a atual (digitar "ab" e
 * depois "abc" mostrava o resultado de "ab" se ele chegasse depois).
 *
 * ponytail: setTimeout no lugar de uma lib de debounce.
 */
export function useDebouncedSearch(
  query: string,
  run: (query: string, isCurrent: () => boolean) => Promise<void>,
  { enabled = true, minLength = 0, delayMs = 350, onSkip }: Options = {},
) {
  const [searching, setSearching] = useState(false);

  // Guardados em ref para o efeito não depender da identidade das funções —
  // assim o caller pode passar closures inline sem re-disparar a busca.
  const runRef = useRef(run);
  const onSkipRef = useRef(onSkip);
  runRef.current = run;
  onSkipRef.current = onSkip;

  useEffect(() => {
    const q = query.trim();

    if (!enabled || q.length < minLength) {
      setSearching(false);
      onSkipRef.current?.();
      return;
    }

    setSearching(true);
    let current = true;
    const timer = setTimeout(async () => {
      try {
        await runRef.current(q, () => current);
      } finally {
        if (current) setSearching(false);
      }
    }, delayMs);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, enabled, minLength, delayMs]);

  return { searching };
}
