import { SelectOption } from "@/types/select-option";

const range = (start: number, end: number, step = 1) =>
  Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => start + i * step);

export const ROOM_OPTIONS: SelectOption[] = range(1, 10).map((r) => ({
  value: String(r),
  label: r === 10 ? "10 eller fler" : `${r} rum`,
}));

export const MONTHLY_FEE_OPTIONS: SelectOption[] = [3000, 6000, 9000, 12000, 15000].map(
  (m, i, arr) => ({
    value: String(m),
    label:
      i === arr.length - 1
        ? `${m.toLocaleString("sv-SE")} kr eller mer`
        : `${m.toLocaleString("sv-SE")} kr`,
  }),
);

export const LIVING_AREA_OPTIONS: SelectOption[] = range(20, 200, 10).map((l) => ({
  value: String(l),
  label: l === 200 ? "200 kvm eller större" : `${l} kvm`,
}));