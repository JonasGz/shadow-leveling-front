import {
  DAY_SHORT,
  DAY_UPPER,
  dayLabel,
  dayOfWeekFromDate,
  formatDayMonth,
  formatDuration,
  localCalendarDate,
  relativeTime,
  toISODate,
} from "./date";

describe("toISODate", () => {
  it("corta o timestamp no dia UTC", () => {
    expect(toISODate(new Date("2026-01-05T22:30:00.000Z"))).toBe("2026-01-05");
  });
});

describe("localCalendarDate", () => {
  // A garantia que importa: meio-dia UTC, para o dia do calendário local não
  // escorregar de fuso ao virar DATE no backend.
  it("usa meio-dia UTC do dia local corrente", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 23, 45));
    expect(localCalendarDate()).toBe("2026-01-05T12:00:00.000Z");
    jest.useRealTimers();
  });

  it("mantém o dia local mesmo às 00:30", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 0, 30));
    expect(localCalendarDate()).toBe("2026-01-05T12:00:00.000Z");
    jest.useRealTimers();
  });
});

describe("relativeTime", () => {
  const now = new Date(2026, 0, 20, 12, 0, 0);
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  beforeEach(() => jest.useFakeTimers().setSystemTime(now));
  afterEach(() => jest.useRealTimers());

  it("cobre cada faixa", () => {
    expect(relativeTime(ago(30_000))).toBe("agora");
    expect(relativeTime(ago(5 * 60_000))).toBe("há 5 min");
    expect(relativeTime(ago(2 * 3_600_000))).toBe("há 2 h");
    expect(relativeTime(ago(3 * 86_400_000))).toBe("há 3 d");
  });

  it("vira data a partir de 7 dias", () => {
    expect(relativeTime(ago(8 * 86_400_000))).toBe("12/01");
  });

  it("não retorna tempo negativo para timestamp futuro", () => {
    expect(relativeTime(new Date(now.getTime() + 60_000).toISOString())).toBe(
      "agora",
    );
  });
});

describe("dayLabel", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 0, 20, 9)));
  afterEach(() => jest.useRealTimers());

  it("distingue hoje, ontem e datas anteriores", () => {
    // 23h de ontem ainda é "Ontem", não "há 1 dia" — o corte é por dia
    // civil, não por 24h corridas.
    expect(dayLabel(new Date(2026, 0, 20, 1).toISOString())).toBe("Hoje");
    expect(dayLabel(new Date(2026, 0, 19, 23).toISOString())).toBe("Ontem");
    expect(dayLabel(new Date(2026, 0, 12).toISOString())).toBe("12/01");
  });
});

describe("dias da semana", () => {
  it("DAY_UPPER é DAY_SHORT em caixa alta, com acento", () => {
    expect(DAY_UPPER.saturday).toBe("SÁB");
    expect(DAY_SHORT.saturday).toBe("Sáb");
  });

  it("mapeia getDay() para o DayOfWeek certo", () => {
    expect(dayOfWeekFromDate(new Date(2026, 0, 18))).toBe("sunday");
    expect(dayOfWeekFromDate(new Date(2026, 0, 24))).toBe("saturday");
  });
});

describe("formatDuration", () => {
  it("formata MM:SS com zero à esquerda", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(9)).toBe("00:09");
    expect(formatDuration(60)).toBe("01:00");
    expect(formatDuration(605)).toBe("10:05");
  });

  it("não quebra passando de uma hora", () => {
    expect(formatDuration(5400)).toBe("90:00");
  });
});

describe("formatDayMonth", () => {
  it("preenche com zero à esquerda", () => {
    expect(formatDayMonth(new Date(2026, 0, 5).toISOString())).toBe("05/01");
  });
});
