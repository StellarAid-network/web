/**
 * formatAmount — converts a bigint on-chain amount to a decimal string.
 * Mirrors the SDK's formatAmount but lives here so the web bundle only
 * imports what it needs.
 */

export function formatAmount(
  value: bigint,
  decimals: number = 7,
  displayDecimals?: number,
): string {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;
  const sign = negative ? "-" : "";

  if (decimals === 0) {
    return `${sign}${whole.toString()}`;
  }

  const fullFraction = fraction.toString().padStart(decimals, "0");
  const full = `${sign}${whole.toString()}.${fullFraction}`;

  if (displayDecimals !== undefined && displayDecimals < decimals) {
    // Round to displayDecimals.
    const rounded = Number(absolute) / (10 ** decimals);
    const display = rounded.toFixed(displayDecimals);
    return negative ? `-${display}` : display;
  }

  return full;
}
