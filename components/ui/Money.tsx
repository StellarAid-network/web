/**
 * <Money> component — renders a Stellar amount with consistent formatting.
 *
 * - Default: 2 decimal places displayed, full 7-decimal value in a tooltip.
 * - Set showFull to always show all 7 decimal places.
 */
"use client";

import * as React from "react";
import { formatAmount } from "@/lib/format-amount";

export interface MoneyProps {
  /** Raw on-chain amount as bigint (in stroops / smallest unit). */
  value: bigint | string;
  /** Number of decimal places the asset uses (default: 7 for Stellar). */
  decimals?: number;
  /** Asset code shown as suffix (e.g. "XLM", "USDC"). */
  asset?: string;
  /** When true, always renders all decimal places. Default: false (2 dp). */
  showFull?: boolean;
  className?: string;
}

export function Money({
  value,
  decimals = 7,
  asset,
  showFull = false,
  className,
}: MoneyProps): React.ReactElement {
  const bigValue = typeof value === "bigint" ? value : BigInt(value);
  const fullStr = formatAmount(bigValue, decimals);
  const shortStr = formatAmount(bigValue, decimals, 2);

  const display = showFull ? fullStr : shortStr;
  const label = asset ? `${display} ${asset}` : display;
  const tooltip = showFull ? undefined : `${fullStr}${asset ? ` ${asset}` : ""}`;

  return (
    <span
      className={className}
      title={tooltip}
      aria-label={tooltip ?? label}
    >
      {label}
    </span>
  );
}
