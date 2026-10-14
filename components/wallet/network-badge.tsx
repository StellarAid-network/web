"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { selectNetworkMismatch, useWalletStore } from "@/stores/wallet";

const LABELS: Record<string, string> = {
  testnet: "Testnet",
  mainnet: "Mainnet",
  local: "Local",
};

export function NetworkBadge(): React.ReactElement {
  const network = useWalletStore((state) => state.network);
  const mismatch = useWalletStore(selectNetworkMismatch);

  if (mismatch) {
    return (
      <span
        data-testid="network-badge"
        role="alert"
        className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
      >
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Wrong network
      </span>
    );
  }

  return (
    <span
      data-testid="network-badge"
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {LABELS[network] ?? network}
    </span>
  );
}
