export const STROOPS_PER_UNIT = 10_000_000n;

export function stroopsToXlm(stroops: bigint): string {
  const negative = stroops < 0n;
  const value = negative ? -stroops : stroops;
  const whole = value / STROOPS_PER_UNIT;
  const fraction = (value % STROOPS_PER_UNIT).toString().padStart(7, "0").replace(/0+$/, "");
  const formatted = fraction.length > 0 ? `${whole}.${fraction}` : whole.toString();
  return negative ? `-${formatted}` : formatted;
}

export function formatXlm(stroops: bigint, maximumFractionDigits = 2): string {
  const value = Number(stroopsToXlm(stroops));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatXlmWithSymbol(stroops: bigint, maximumFractionDigits = 2): string {
  return `${formatXlm(stroops, maximumFractionDigits)} XLM`;
}

export function formatAddress(address: string, visible = 4): string {
  if (address.length <= visible * 2 + 3) {
    return address;
  }
  return `${address.slice(0, visible)}…${address.slice(-visible)}`;
}

export function formatDate(date: Date | string | number): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatRelativeTime(date: Date | string | number, now: Date = new Date()): string {
  const value = date instanceof Date ? date : new Date(date);
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  let duration = seconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "year");
}
