// Swedish labels for our property types, used by the app and the notification mails.
// The values come from the database enum public.property_type: a new value fails tsc here until it has a label.

import type { Enums } from "./database.types.ts";

export const PROPERTY_TYPE_LABELS: Record<Enums<"property_type">, string> = {
  villa: "Villa",
  radhus: "Radhus",
  lagenhet: "Lägenhet",
  fritidshus: "Fritidshus",
  tomt: "Tomt",
  other: "Övrigt",
};

// lagenhet -> "Lägenhet", null -> null
export function propertyTypeLabel(type: Enums<"property_type"> | null): string | null {
  return type ? PROPERTY_TYPE_LABELS[type] : null;
}
