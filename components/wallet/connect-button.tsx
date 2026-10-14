"use client";

import * as React from "react";
import { LogOut, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/format";
import { useWalletStore } from "@/stores/wallet";

export function ConnectButton(): React.ReactElement {
  const address = useWalletStore((state) => state.address);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const error = useWalletStore((state) => state.error);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const restore = useWalletStore((state) => state.restore);
  const isInitialized = useWalletStore((state) => state.isInitialized);

  React.useEffect(() => {
    if (!isInitialized) {
      void restore();
    }
  }, [isInitialized, restore]);

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" title={address} disabled>
          <Wallet className="h-4 w-4" />
          {formatAddress(address)}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Disconnect wallet" onClick={disconnect}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={() => void connect()} disabled={isConnecting}>
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
