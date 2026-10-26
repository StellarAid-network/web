"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useWalletStore, selectNetworkMismatch } from "@/stores/wallet";
import { stellarConfig } from "@/lib/stellar";

export function NetworkMismatchBanner(): React.ReactElement | null {
  const mismatch = useWalletStore(selectNetworkMismatch);
  const walletPassphrase = useWalletStore((s) => s.walletNetworkPassphrase);

  if (!mismatch) return null;

  const expectedName = stellarConfig.network;
  const actualName = walletPassphrase?.includes("Public Global")
    ? "mainnet"
    : walletPassphrase?.includes("Standalone")
    ? "local"
    : "testnet";

  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <strong>Wrong network:</strong> your wallet is on{" "}
        <strong>{actualName}</strong> but this app requires{" "}
        <strong>{expectedName}</strong>. Switch your wallet network to continue.
      </span>
    </div>
  );
}
