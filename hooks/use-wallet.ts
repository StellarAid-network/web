/**
 * useWallet — primary hook for wallet state and actions.
 *
 * Wraps the Zustand wallet store and adds:
 * - signTransaction(xdr): signs via the active wallet module
 * - signMessage(message): signs an arbitrary message
 * - isNetworkMismatch: derived boolean
 */
"use client";

import { useWalletStore, selectNetworkMismatch } from "@/stores/wallet";
import { signWalletTransaction, signWalletMessage } from "@/lib/wallet-kit";

export function useWallet() {
  const store = useWalletStore();
  const isNetworkMismatch = useWalletStore(selectNetworkMismatch);

  async function signTransaction(xdr: string): Promise<string> {
    if (!store.address) throw new Error("Wallet not connected");
    return signWalletTransaction(xdr, { address: store.address });
  }

  async function signMessage(message: string): Promise<string> {
    if (!store.address) throw new Error("Wallet not connected");
    return signWalletMessage(message, { address: store.address });
  }

  return {
    address: store.address,
    network: store.network,
    isConnecting: store.isConnecting,
    isInitialized: store.isInitialized,
    isNetworkMismatch,
    error: store.error,
    connect: store.connect,
    disconnect: store.disconnect,
    restore: store.restore,
    refreshNetwork: store.refreshNetwork,
    signTransaction,
    signMessage,
  };
}
