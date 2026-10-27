/**
 * Giveaway eligibility and trustline evaluation utilities.
 */

import { stellarConfig } from "../stellar";
import { clientEnv } from "../env";
import type { GiveawayItem } from "../giveaways";

export interface EligibilityReport {
  eligible: boolean;
  accountAgeEligible: boolean;
  balanceEligible: boolean;
  reputationEligible: boolean;
  hasTrustline: boolean;
  needsTrustline: boolean;
  accountAgeSeconds: number;
  nativeBalance: string;
  reputationScore: number;
  reasons: string[];
}

export interface EligibilityCriteria {
  minAgeSeconds?: number;
  minBalanceXlm?: number;
  minReputationScore?: number;
}

/**
 * Stubbed reputation score lookup.
 * Returns score (0-100), defaults to 50 for active wallets.
 */
export async function getReputationScore(account: string): Promise<number> {
  if (!account) return 0;
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") return 65;
  // Stub implementation until API/SDK reputation indexer is queried
  return 50;
}

/**
 * Checks an account's eligibility to claim a specific giveaway.
 */
export async function checkGiveawayEligibility(
  account: string,
  giveaway: GiveawayItem,
  criteria: EligibilityCriteria = {},
): Promise<EligibilityReport> {
  const minAgeSeconds = criteria.minAgeSeconds ?? 86400; // 24 hours default
  const minBalanceXlm = criteria.minBalanceXlm ?? 1.5; // Reserve for base + entries
  const minReputationScore = criteria.minReputationScore ?? 0;

  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return {
      eligible: true,
      accountAgeEligible: true,
      balanceEligible: true,
      reputationEligible: true,
      hasTrustline: true,
      needsTrustline: giveaway.asset.code !== "XLM",
      accountAgeSeconds: 172800,
      nativeBalance: "25.0000000",
      reputationScore: 65,
      reasons: [],
    };
  }

  const reasons: string[] = [];
  let nativeBalance = "0";
  let hasTrustline = false;
  const isNonNative = giveaway.asset.code !== "XLM";
  let accountAgeSeconds = 0;

  try {
    const res = await fetch(`${stellarConfig.horizonUrl}/accounts/${account}`);
    if (!res.ok) {
      return {
        eligible: false,
        accountAgeEligible: false,
        balanceEligible: false,
        reputationEligible: false,
        hasTrustline: false,
        needsTrustline: isNonNative,
        accountAgeSeconds: 0,
        nativeBalance: "0",
        reputationScore: 0,
        reasons: ["Account does not exist on-chain or is unfunded."],
      };
    }

    const data = (await res.json()) as {
      balances: Array<{
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance: string;
      }>;
    };

    // 1. Balance & trustline check
    for (const b of data.balances) {
      if (b.asset_type === "native") {
        nativeBalance = b.balance;
      } else if (
        isNonNative &&
        b.asset_code === giveaway.asset.code &&
        (!giveaway.asset.issuer || b.asset_issuer === giveaway.asset.issuer)
      ) {
        hasTrustline = true;
      }
    }

    // 2. Account age check via first operation
    try {
      const opsRes = await fetch(
        `${stellarConfig.horizonUrl}/accounts/${account}/operations?order=asc&limit=1`,
      );
      if (opsRes.ok) {
        const opsData = (await opsRes.json()) as {
          _embedded?: { records?: Array<{ created_at: string }> };
        };
        const firstOp = opsData._embedded?.records?.[0];
        if (firstOp?.created_at) {
          const createdTime = new Date(firstOp.created_at).getTime();
          accountAgeSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
        }
      }
    } catch {
      accountAgeSeconds = 86400 * 7; // Fallback to 7 days if ops query fails
    }
  } catch {
    // If Horizon fails, treat with permissive fallback
    nativeBalance = "10";
    accountAgeSeconds = 86400 * 7;
    hasTrustline = true;
  }

  const accountAgeEligible = accountAgeSeconds >= minAgeSeconds;
  if (!accountAgeEligible) {
    reasons.push(
      `Account age must be at least ${Math.round(minAgeSeconds / 3600)}h (current: ${(accountAgeSeconds / 3600).toFixed(1)}h).`,
    );
  }

  const balanceEligible = parseFloat(nativeBalance) >= minBalanceXlm;
  if (!balanceEligible) {
    reasons.push(
      `Minimum balance of ${minBalanceXlm} XLM required for reserves (current: ${parseFloat(nativeBalance).toFixed(2)} XLM).`,
    );
  }

  const reputationScore = await getReputationScore(account);
  const reputationEligible = reputationScore >= minReputationScore;
  if (!reputationEligible) {
    reasons.push(
      `Reputation score must be at least ${minReputationScore} (current: ${reputationScore}).`,
    );
  }

  // Final eligibility
  const eligible = accountAgeEligible && balanceEligible && reputationEligible;

  return {
    eligible,
    accountAgeEligible,
    balanceEligible,
    reputationEligible,
    hasTrustline,
    needsTrustline: isNonNative,
    accountAgeSeconds,
    nativeBalance,
    reputationScore,
    reasons,
  };
}
