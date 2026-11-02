import { startOfToday, toIsoDate } from "@/utils/date-format";

export function isValidShowingDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function isShowingDateInPast(date: string) {
  return date < toIsoDate(startOfToday());
}

export function normalizeShowingTime(time: string) {
  if (!time) return null;
  const match = time.match(/^([01]?\d|2[0-3])(?:[.:]([0-5]\d))?$/);
  if (!match) return undefined;
  return `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`;
}
