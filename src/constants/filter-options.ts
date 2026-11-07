import { SelectOption } from "@/types/select-option";
import { formatPrice } from "@/utils/format-price";
import { Constants, type Enums } from "@shared/database.types";

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

// From the database enum public.property_type, in its order
export const PROPERTY_TYPES = Constants.public.Enums.property_type;

export type PropertyType = Enums<"property_type">;

// Checks a value from the UI (toggle groups give string[]) against the database's list
export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

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

// "Alla" resets a feed filter. FilterSelect has no way to clear a chosen value
export const ALL_VALUE = "all";
export const ALL_OPTION: SelectOption = { value: ALL_VALUE, label: "Alla" };

export const SORT_VALUES = [
  "newest",
  "oldest",
  "price-low",
  "price-high",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export const SORT_LABELS: Record<SortValue, string> = {
  newest: "Nyast",
  oldest: "Äldst",
  "price-low": "Lägst pris",
  "price-high": "Högst pris",
};

export const SORT_OPTIONS: SelectOption[] = SORT_VALUES.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));
