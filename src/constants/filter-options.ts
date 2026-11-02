import { SelectOption } from "@/types/select-option";
import { formatPrice } from "@/utils/format-price";

const range = (start: number, end: number, step = 1) =>
  Array.from(
    { length: Math.floor((end - start) / step) + 1 },
    (_, i) => start + i * step,
  );

export const ROOM_OPTIONS: SelectOption[] = range(1, 10).map((r) => ({
  value: String(r),
  label: r === 10 ? "10 eller fler" : `${r} rum`,
}));

export const MONTHLY_FEE_OPTIONS: SelectOption[] = [
  3000, 6000, 9000, 12000, 15000,
].map((m, i, arr) => ({
  value: String(m),
  label:
    i === arr.length - 1 ? `${formatPrice(m)} eller mer` : `${formatPrice(m)}`,
}));

export const LIVING_AREA_OPTIONS: SelectOption[] = range(20, 200, 10).map(
  (l) => ({
    value: String(l),
    label: l === 200 ? "200 kvm eller större" : `${l} kvm`,
  }),
);

export const PROPERTY_TYPES = [
  "villa",
  "radhus",
  "lagenhet",
  "fritidshus",
  "tomt",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  villa: "Villa",
  radhus: "Radhus",
  lagenhet: "Lägenhet",
  fritidshus: "Fritidshus",
  tomt: "Tomt",
  other: "Övrigt",
};

export const PROPERTY_TYPES_OPTIONS: SelectOption[] = PROPERTY_TYPES.map(
  (type) => ({
    value: type,
    label: PROPERTY_TYPE_LABELS[type],
  }),
);
