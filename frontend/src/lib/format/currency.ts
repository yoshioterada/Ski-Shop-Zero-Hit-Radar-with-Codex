const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

/** Formats product prices and opportunity loss values as readable Japanese yen. */
export function formatYen(value: number): string {
  return yenFormatter.format(value).replace("￥", "¥");
}
