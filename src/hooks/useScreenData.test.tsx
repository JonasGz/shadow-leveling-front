import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useScreenData } from "./useScreenData";

// useFocusEffect só existe com um navigator montado; para o hook em si, focar
// uma vez ao montar é equivalente e mantém o teste sem árvore de navegação.
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(cb, [cb]);
  },
}));

describe("useScreenData", () => {
  it("carrega ao montar e expõe os dados", async () => {
    const { result } = await renderHook(() => useScreenData(async () => "ok"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("ok");
    expect(result.current.error).toBe(false);
  });

  it("marca erro quando o loader rejeita", async () => {
    const { result } = await renderHook(() =>
      useScreenData(async () => {
        throw new Error("falhou");
      }),
    );

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("refresh alterna refreshing e limpa erro anterior", async () => {
    let shouldFail = true;
    const { result } = await renderHook(() =>
      useScreenData(async () => {
        if (shouldFail) throw new Error("falhou");
        return "recuperado";
      }),
    );

    await waitFor(() => expect(result.current.error).toBe(true));

    shouldFail = false;
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe(false);
    expect(result.current.data).toBe("recuperado");
    expect(result.current.refreshing).toBe(false);
  });

  it("descarta a resposta de uma carga já substituída", async () => {
    const resolvers: Array<(v: string) => void> = [];
    const { result } = await renderHook(() =>
      useScreenData(() => new Promise<string>((res) => resolvers.push(res))),
    );

    await waitFor(() => expect(resolvers).toHaveLength(1));

    // Dispara a segunda carga antes da primeira responder.
    let second!: Promise<void>;
    await act(async () => {
      second = result.current.reload();
    });
    await waitFor(() => expect(resolvers).toHaveLength(2));

    // A primeira responde por último e deve ser ignorada.
    await act(async () => {
      resolvers[1]("nova");
      resolvers[0]("antiga");
      await second;
    });

    expect(result.current.data).toBe("nova");
  });

  it("setData permite atualização local", async () => {
    const { result } = await renderHook(() =>
      useScreenData(async () => "inicial"),
    );
    await waitFor(() => expect(result.current.data).toBe("inicial"));

    await act(async () => result.current.setData("editado"));
    expect(result.current.data).toBe("editado");
  });
});
