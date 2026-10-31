/**
 * <Address> component — renders a truncated Stellar address with
 * copy-to-clipboard and an optional explorer link.
 */
"use client";

import * as React from "react";
import { Copy, ExternalLink } from "lucide-react";
import { formatAddress } from "@/lib/format";
import { explorerAccountUrl } from "@/lib/stellar";

export interface AddressProps {
  /** Stellar address (G...). */
  value: string;
  /** Show truncated address (first 6 … last 6). Default: true. */
  truncate?: boolean;
  /** Show an explorer link icon. Default: false. */
  href?: boolean;
  className?: string;
}

export function Address({
  value,
  truncate = true,
  href = false,
  className,
}: AddressProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const display = truncate ? formatAddress(value) : value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${className ?? ""}`}>
      <span title={value} aria-label={`Stellar address: ${value}`}>
        {display}
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="Copy address to clipboard"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <span className="text-xs text-green-600" aria-live="polite">
            Copied
          </span>
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      {href && (
        <a
          href={explorerAccountUrl(value)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Stellar Explorer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}
