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

export function formatDayMonthYear(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function formatDateSlash(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  return `${pad2(m)}:${pad2(totalSeconds % 60)}`;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function localCalendarDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T12:00:00.000Z`;
}

export const DAY_ORDER: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DAY_SHORT: Record<DayOfWeek, string> = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

export const DAY_UPPER = Object.fromEntries(
  DAY_ORDER.map((day) => [day, DAY_SHORT[day].toUpperCase()]),
) as Record<DayOfWeek, string>;

export function dayOfWeekFromDate(d: Date = new Date()): DayOfWeek {
  return DAY_ORDER[d.getDay()];
}
