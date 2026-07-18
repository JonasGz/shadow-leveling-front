import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

interface Result<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  /** Recarrega mostrando o spinner de pull-to-refresh. */
  refresh: () => Promise<void>;
  /** Recarrega mostrando o loading de tela cheia. */
  reload: () => Promise<void>;
  /** Para atualizações locais otimistas (ex.: trocar o avatar já carregado). */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Carrega dados de tela: busca ao focar, expõe loading/error/refreshing e
 * ignora respostas de cargas que já foram substituídas.
 *
 * `deps` funciona como em useCallback — mude-as para refazer a busca (ex.: o
 * range de datas do histórico). O loader em si não precisa ser memoizado.
 */
export function useScreenData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): Result<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  // Cada carga recebe um id; só a mais recente pode gravar estado. Sem isso,
  // voltar rápido para a tela deixa a resposta antiga sobrescrever a nova.
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    setError(false);
    try {
      const result = await loaderRef.current();
      if (runIdRef.current !== runId) return;
      setData(result);
    } catch {
      if (runIdRef.current === runId) setError(true);
    } finally {
      if (runIdRef.current === runId) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    await run();
  }, [run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );

  return { data, loading, error, refreshing, refresh, reload, setData };
}
