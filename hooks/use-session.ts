/**
 * useSession — SEP-10 session state and sign-in/sign-out actions.
 *
 * Reads session cookie presence via a lightweight /api/auth/me-like endpoint.
 * The JWT itself is httpOnly and never accessible in JS; we track sign-in
 * state by whether the token endpoint succeeded.
 */
"use client";

import * as React from "react";
import { useWalletStore } from "@/stores/wallet";
import { signWalletTransaction } from "@/lib/wallet-kit";

interface SessionState {
  isSignedIn: boolean;
  address: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export function useSession(): SessionState {
  const address = useWalletStore((s) => s.address);
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function signIn(): Promise<void> {
    if (!address) {
      setError("Connect your wallet first");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get challenge from our route handler (which proxies the API).
      const challengeRes = await fetch(
        `/api/auth/challenge?account=${encodeURIComponent(address)}`,
      );
      if (!challengeRes.ok) throw new Error("Failed to get challenge");
      const { transaction } = (await challengeRes.json()) as { transaction: string };

      // 2. Sign the challenge with the wallet.
      const signed = await signWalletTransaction(transaction, { address });

      // 3. Exchange for JWT (stored as httpOnly cookie).
      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: signed }),
      });
      if (!tokenRes.ok) throw new Error("Authentication failed");

      setIsSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    await fetch("/api/auth/signout", { method: "POST" });
    setIsSignedIn(false);
  }

  // Clear session when wallet disconnects.
  React.useEffect(() => {
    if (!address && isSignedIn) {
      void signOut();
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isSignedIn, address, isLoading, signIn, signOut, error };
}
