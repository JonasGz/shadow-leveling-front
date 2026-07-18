import { act, render, screen, userEvent } from "@testing-library/react-native";
import { RestTimer } from "./RestTimer";
import { SessionClock } from "./SessionClock";

describe("RestTimer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const advance = async (seconds: number) => {
    // act assíncrono: no React 19 o act síncrono não drena os updates
    // agendados pelo efeito do tick.
    await act(async () => {
      jest.advanceTimersByTime(seconds * 1000);
    });
  };

  it("conta para baixo a partir dos segundos iniciais", async () => {
    await render(<RestTimer seconds={60} onDismiss={jest.fn()} />);
    expect(screen.getByText("01:00")).toBeTruthy();

    await advance(1);
    expect(screen.getByText("00:59")).toBeTruthy();

    await advance(29);
    expect(screen.getByText("00:30")).toBeTruthy();
  });

  it("chama onDismiss ao zerar", async () => {
    const onDismiss = jest.fn();
    await render(<RestTimer seconds={3} onDismiss={onDismiss} />);

    await advance(2);
    expect(onDismiss).not.toHaveBeenCalled();

    await advance(1);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("o botão + soma 15s à contagem", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<RestTimer seconds={60} onDismiss={jest.fn()} />);

    await advance(10);
    expect(screen.getByText("00:50")).toBeTruthy();

    await user.press(
      screen.getByLabelText("Adicionar 15 segundos ao descanso"),
    );
    expect(screen.getByText("01:05")).toBeTruthy();
  });

  it("para de contar após desmontar", async () => {
    const onDismiss = jest.fn();
    const { unmount } = await render(
      <RestTimer seconds={2} onDismiss={onDismiss} />,
    );

    await unmount();
    await advance(5);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe("SessionClock", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("só conta quando running", async () => {
    const { rerender } = await render(<SessionClock running={false} />);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:00")).toBeTruthy();

    await rerender(<SessionClock running />);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:05")).toBeTruthy();
  });
});
