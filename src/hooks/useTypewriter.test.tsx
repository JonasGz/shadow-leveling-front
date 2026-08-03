import { act, renderHook } from "@testing-library/react-native";
import { useTypewriter, useRotatingPhrase } from "./useTypewriter";

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["setImmediate", "clearImmediate"] });
});
afterEach(() => jest.useRealTimers());

describe("useTypewriter", () => {
  it("reveals the text one character at a time", async () => {
    const { result } = await renderHook(() => useTypewriter("oi"));

    expect(result.current.shown).toBe("");
    expect(result.current.done).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    expect(result.current.shown).toBe("o");

    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    expect(result.current.shown).toBe("oi");
    expect(result.current.done).toBe(true);
  });

  it("shows everything at once when skipped", async () => {
    const { result } = await renderHook(() => useTypewriter("uma frase longa"));

    await act(async () => {
      result.current.skip();
    });
    expect(result.current.shown).toBe("uma frase longa");
    expect(result.current.done).toBe(true);
  });

  it("shows the full text when disabled", async () => {
    const { result } = await renderHook(() =>
      useTypewriter("histórico", false),
    );
    expect(result.current.shown).toBe("histórico");
    expect(result.current.done).toBe(true);
  });

  it("restarts on a new text", async () => {
    const { result, rerender } = await renderHook<
      ReturnType<typeof useTypewriter>,
      { t: string }
    >(({ t }) => useTypewriter(t), { initialProps: { t: "um" } });
    await act(async () => {
      jest.advanceTimersByTime(40);
    });
    expect(result.current.shown).toBe("um");

    await act(async () => {
      rerender({ t: "dois" });
    });
    expect(result.current.shown).toBe("");
    await act(async () => {
      jest.advanceTimersByTime(80);
    });
    expect(result.current.shown).toBe("dois");
  });
});

describe("useRotatingPhrase", () => {
  const phrases = ["um", "dois", "três"];

  it("cycles while active and wraps around", async () => {
    const { result } = await renderHook<string, unknown>(() =>
      useRotatingPhrase(phrases, true, 1000),
    );

    expect(result.current).toBe("um");
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe("dois");
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe("um");
  });

  it("stays put while inactive", async () => {
    const { result } = await renderHook(() =>
      useRotatingPhrase(phrases, false, 1000),
    );

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toBe("um");
  });

  it("restarts from the first phrase on a new wait", async () => {
    const { result, rerender } = await renderHook<string, { active: boolean }>(
      ({ active }) => useRotatingPhrase(phrases, active, 1000),
      { initialProps: { active: true } },
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe("dois");

    await act(async () => {
      rerender({ active: false });
    });
    await act(async () => {
      rerender({ active: true });
    });
    expect(result.current).toBe("um");
  });
});
