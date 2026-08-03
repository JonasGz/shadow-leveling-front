import { useEffect, useRef, useState } from "react";

const CHAR_MS = 20;

export function useTypewriter(text: string, enabled = true) {
  const [shown, setShown] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown("");
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setShown(text.slice(0, n));
      if (n >= text.length) clearInterval(id);
    }, CHAR_MS);
    return () => clearInterval(id);
  }, [text, enabled]);

  return {
    shown,
    done: shown.length >= text.length,
    skip: () => setShown(text),
  };
}

export function useRotatingPhrase(
  phrases: string[],
  active: boolean,
  everyMs: number,
) {
  const [index, setIndex] = useState(0);
  const ref = useRef(phrases);
  ref.current = phrases;

  useEffect(() => {
    if (!active) return;
    setIndex(0);
    const id = setInterval(
      () => setIndex((i) => (i + 1) % ref.current.length),
      everyMs,
    );
    return () => clearInterval(id);
  }, [active, everyMs]);

  return phrases[index % phrases.length];
}
