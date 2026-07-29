const adminDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats backend ISO date strings for dense admin dashboard tables. */
export function formatAdminDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  return adminDateFormatter.format(date);
}
