import { useEffect, useRef, useState } from "react";

interface Options {
  enabled?: boolean;
  minLength?: number;
  delayMs?: number;
  onSkip?: () => void;
}

export function useDebouncedSearch(
  query: string,
  run: (query: string, isCurrent: () => boolean) => Promise<void>,
  { enabled = true, minLength = 0, delayMs = 350, onSkip }: Options = {},
) {
  const [searching, setSearching] = useState(false);

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
