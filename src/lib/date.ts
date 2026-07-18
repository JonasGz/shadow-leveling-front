import type { DayOfWeek } from "../types/api.types";

const MONTHS_ABBR = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "05 JAN 2026" */
export function formatDayMonthYear(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "05/01" */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/** "05/01/2026" */
export function formatDateSlash(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "05 de janeiro de 2026" */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** "14:30" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Agrupa um timestamp em "Hoje" / "Ontem" / "DD/MM". */
export function dayLabel(iso: string): string {
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000,
  );
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return formatDayMonth(iso);
}

/** "agora", "há 5 min", "há 2 h", "há 3 d" ou "DD/MM" a partir de 7 dias. */
export function relativeTime(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "agora";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `há ${days} d`;
  return formatDayMonth(iso);
}

/** Segundos → "MM:SS". Passa de 60min sem quebrar ("90:00"). */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  return `${pad2(m)}:${pad2(totalSeconds % 60)}`;
}

/** "2026-01-05" — dia do calendário UTC, para filtros de range da API. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Data (dia local) da sessão como meio-dia UTC daquele dia, para a coluna DATE
// do backend gravar o dia do calendário do usuário e não escorregar de fuso.
export function localCalendarDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T12:00:00.000Z`;
}

// --- Dias da semana ---

export const DAY_ORDER: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** "Dom", "Seg", … */
export const DAY_SHORT: Record<DayOfWeek, string> = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

/** "DOM", "SEG", … — mesma tabela de DAY_SHORT, em caixa alta. */
export const DAY_UPPER = Object.fromEntries(
  DAY_ORDER.map((day) => [day, DAY_SHORT[day].toUpperCase()]),
) as Record<DayOfWeek, string>;

/** Dia da semana do relógio local do dispositivo. */
export function dayOfWeekFromDate(d: Date = new Date()): DayOfWeek {
  return DAY_ORDER[d.getDay()];
}
