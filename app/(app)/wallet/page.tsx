"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { useSession } from "@/hooks/use-session";
import { Address } from "@/components/ui/Address";
import { Money } from "@/components/ui/Money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { stellarConfig, explorerAccountUrl } from "@/lib/stellar";
import { signWalletTransaction } from "@/lib/wallet-kit";

// ── Horizon types ─────────────────────────────────────────────────────────

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface HorizonAccount {
  id: string;
  sequence: string;
  balances: HorizonBalance[];
}

interface HorizonPayment {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  from?: string;
  to?: string;
  asset_code?: string;
  asset_type?: string;
  amount?: string;
}

// ── Data fetchers ─────────────────────────────────────────────────────────

async function fetchAccount(address: string): Promise<HorizonAccount> {
  const res = await fetch(`${stellarConfig.horizonUrl}/accounts/${address}`);
  if (!res.ok) throw new Error(`Account not found (${res.status})`);
  return res.json() as Promise<HorizonAccount>;
}

async function fetchPayments(address: string): Promise<HorizonPayment[]> {
  const res = await fetch(
    `${stellarConfig.horizonUrl}/accounts/${address}/payments?order=desc&limit=10`,
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { _embedded: { records: HorizonPayment[] } };
  return body._embedded?.records ?? [];
}

// ── USDC issuer for current network ───────────────────────────────────────

const USDC_ISSUERS: Record<string, string> = {
  testnet: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  mainnet: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  local: "",
};

// ── Component ─────────────────────────────────────────────────────────────

export default function WalletPage(): React.ReactElement {
  const router = useRouter();
  const { address, isNetworkMismatch } = useWallet();
  const { isSignedIn, signIn, isLoading: sessionLoading } = useSession();
  const [addingTrustline, setAddingTrustline] = React.useState(false);
  const [trustlineError, setTrustlineError] = React.useState<string | null>(null);

  // Redirect to home if wallet not connected.
  React.useEffect(() => {
    if (!address) router.push("/");
  }, [address, router]);

  const {
    data: account,
    isLoading: accountLoading,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ["account", address],
    queryFn: () => fetchAccount(address!),
    enabled: !!address,
    staleTime: 10_000,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", address],
    queryFn: () => fetchPayments(address!),
    enabled: !!address,
    staleTime: 30_000,
  });

  if (!address) return <div className="p-6">Redirecting…</div>;

  const xlmBalance = account?.balances.find((b) => b.asset_type === "native");
  const usdcIssuer = USDC_ISSUERS[stellarConfig.network] ?? "";
  const usdcBalance = account?.balances.find(
    (b) => b.asset_code === "USDC" && b.asset_issuer === usdcIssuer,
  );
  const hasUsdcTrustline = !!usdcBalance;

  // Convert Horizon balance string (e.g. "10.0000000") to stroops bigint.
  function toBigInt(balanceStr: string | undefined): bigint {
    if (!balanceStr) return 0n;
    const [whole = "0", frac = ""] = balanceStr.split(".");
    return BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, "0").slice(0, 7));
  }

  async function handleAddUsdcTrustline(): Promise<void> {
    if (!address || !usdcIssuer) return;
    setAddingTrustline(true);
    setTrustlineError(null);
    try {
      // Build the change_trust transaction via the API server's Horizon endpoint.
      const { TransactionBuilder, Asset, Account, Operation } = await import(
        "@stellar/stellar-sdk"
      );

      const accountData = await fetchAccount(address);
      const stellarAccount = new Account(address, accountData.sequence);
      const tx = new TransactionBuilder(stellarAccount, {
        fee: "100",
        networkPassphrase: stellarConfig.networkPassphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset("USDC", usdcIssuer),
          }),
        )
        .setTimeout(300)
        .build();

      const signed = await signWalletTransaction(tx.toXDR(), { address });

      const res = await fetch(`${stellarConfig.horizonUrl}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tx: signed }).toString(),
      });
      if (!res.ok) throw new Error("Transaction failed");

      await refetchAccount();
    } catch (err) {
      setTrustlineError(err instanceof Error ? err.message : "Failed to add trustline");
    } finally {
      setAddingTrustline(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Wallet</h1>

      {/* Address */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
        </CardHeader>
        <CardContent>
          <Address value={address} truncate={false} href />
        </CardContent>
      </Card>

      {/* Session */}
      {!isSignedIn && (
        <Card>
          <CardContent className="pt-4">
            <Button onClick={() => void signIn()} disabled={sessionLoading} size="sm">
              {sessionLoading ? "Signing in…" : "Sign in with wallet"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign a challenge to verify ownership and access social features.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accountLoading ? (
            <>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">XLM</span>
                <Money value={toBigInt(xlmBalance?.balance)} asset="XLM" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">USDC</span>
                {hasUsdcTrustline ? (
                  <Money value={toBigInt(usdcBalance?.balance)} asset="USDC" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">No trustline</span>
                    {usdcIssuer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleAddUsdcTrustline()}
                        disabled={addingTrustline || isNetworkMismatch}
                      >
                        {addingTrustline ? "Adding…" : "Add USDC trustline"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {trustlineError && (
                <p className="text-xs text-red-600" role="alert">{trustlineError}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !payments?.length ? (
            <p className="text-sm text-muted-foreground">No recent payments.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-xs">
                    {p.amount} {p.asset_code ?? "XLM"}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/${
                      stellarConfig.network === "mainnet" ? "public" : "testnet"
                    }/tx/${p.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
