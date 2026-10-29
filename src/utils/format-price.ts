// 4500000 -> "4 500 000 kr"
export function formatPrice(price: number): string {
  return `${price.toLocaleString("sv-SE")} kr`;
}
