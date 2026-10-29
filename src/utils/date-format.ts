import { capitalize } from "@/utils/capitalize-string";

const pad = (n: number) => String(n).padStart(2, "0");

// Local date as "2026-10-29" (the format of showings.showing_date and <input type="date">)
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Local time as "11:00" (the format of <input type="time">)
export function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "2026-10-29" -> Date at local midnight.
// Built from numbers, since parsing a string without time zone differs between engines
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "11:00" -> Date today at that time (only the time is used)
export function parseTime(value: string): Date {
  const [hour, minute] = value.split(":").map(Number);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Today at local midnight
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// "Torsdag 29 oktober"
export function formatDateLabel(date: Date): string {
  return capitalize(
    date.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
}
