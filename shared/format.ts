// Number formatting shared by the app and the emails, so prices look the same everywhere.

const SWEDISH_NUMBER = new Intl.NumberFormat("sv-SE");

// 4000000 -> "4 000 000", 3.5 -> "3,5"
export function formatNumber(n: number): string {
  return SWEDISH_NUMBER.format(n);
}

// 4500000 -> "4 500 000 kr"
export function formatPrice(price: number): string {
  return `${formatNumber(price)} kr`;
}
