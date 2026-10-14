"use client";

import { create } from "zustand";

import { stellarConfig, type StellarNetwork } from "@/lib/stellar";

export interface WalletState {
  address: string | null;
  network: StellarNetwork;
  walletNetworkPassphrase: string | null;
  isConnecting: boolean;
  isInitialized: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  restore: () => Promise<void>;
  refreshNetwork: () => Promise<void>;
  setAddress: (address: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function selectNetworkMismatch(state: WalletState): boolean {
  return (
    state.walletNetworkPassphrase !== null &&
    state.walletNetworkPassphrase !== stellarConfig.networkPassphrase
  );
}

async function readWalletNetwork(): Promise<string | null> {
  try {
    const { getWalletKitNetwork } = await import("@/lib/wallet-kit");
    const { networkPassphrase } = await getWalletKitNetwork();
    return networkPassphrase;
  } catch {
    return null;
  }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  network: stellarConfig.network,
  walletNetworkPassphrase: null,
  isConnecting: false,
  isInitialized: false,
  error: null,

  connect: async () => {
    if (get().isConnecting) {
      return;
    }
    set({ isConnecting: true, error: null });
    try {
      const { connectWallet } = await import("@/lib/wallet-kit");
      const address = await connectWallet();
      const walletNetworkPassphrase = await readWalletNetwork();
      set({ address, walletNetworkPassphrase, isConnecting: false, isInitialized: true });
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  },

  refreshNetwork: async () => {
    const walletNetworkPassphrase = await readWalletNetwork();
    set({ walletNetworkPassphrase });
  },

  disconnect: async () => {
    try {
      const { disconnectWallet } = await import("@/lib/wallet-kit");
      await disconnectWallet();
    } catch {
      // Ignore failures while disconnecting; local state is cleared regardless.
    }
    set({ address: null, walletNetworkPassphrase: null, error: null });
  },

  restore: async () => {
    try {
      const { getWalletAddress } = await import("@/lib/wallet-kit");
      const address = await getWalletAddress();
      const walletNetworkPassphrase = await readWalletNetwork();
      set({ address, walletNetworkPassphrase, isInitialized: true });
    } catch {
      set({ isInitialized: true });
    }
  },

  setAddress: (address) => set({ address }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      address: null,
      walletNetworkPassphrase: null,
      isConnecting: false,
      error: null,
    }),
}));
