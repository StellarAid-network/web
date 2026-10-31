/**
 * Giveaway claim and reclaim transaction building and execution.
 */

import { stellarConfig } from "../stellar";
import { signWalletTransaction } from "../wallet-kit";

export interface ClaimExecutionOptions {
  claimerAddress: string;
  balanceId: string;
  asset: {
    code: string;
    issuer?: string;
  };
  needsTrustline?: boolean;
}

export interface ClaimResult {
  success: boolean;
  txHash: string;
}

/**
 * Builds and submits a claim transaction, automatically bundling a changeTrust operation
 * if the user needs a trustline for non-native assets.
 */
export async function executeGiveawayClaim(options: ClaimExecutionOptions): Promise<ClaimResult> {
  const { claimerAddress, balanceId, asset, needsTrustline } = options;

  const { TransactionBuilder, Asset, Account, Operation } = await import("@stellar/stellar-sdk");

  // 1. Fetch account sequence number from Horizon
  const accRes = await fetch(`${stellarConfig.horizonUrl}/accounts/${claimerAddress}`);
  if (!accRes.ok) {
    throw new Error("Could not load account details from Horizon. Ensure your wallet is funded.");
  }
  const accountData = (await accRes.json()) as { sequence: string };
  const stellarAccount = new Account(claimerAddress, accountData.sequence);

  // 2. Base fee (100 stroops per operation)
  const opCount = needsTrustline ? 2 : 1;
  const fee = (100 * opCount).toString();

  const txBuilder = new TransactionBuilder(stellarAccount, {
    fee,
    networkPassphrase: stellarConfig.networkPassphrase,
  });

  // 3. Add changeTrust if non-native asset trustline is missing
  if (needsTrustline && asset.code !== "XLM" && asset.issuer) {
    const trustAsset = new Asset(asset.code, asset.issuer);
    txBuilder.addOperation(
      Operation.changeTrust({
        asset: trustAsset,
      }),
    );
  }

  // 4. Add claimClaimableBalance operation
  txBuilder.addOperation(
    Operation.claimClaimableBalance({
      balanceId,
    }),
  );

  txBuilder.setTimeout(60);
  const tx = txBuilder.build();

  // 5. Sign with wallet
  const signedXdr = await signWalletTransaction(tx.toXDR(), {
    address: claimerAddress,
  });

  // 6. Submit to Horizon
  const subRes = await fetch(`${stellarConfig.horizonUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signedXdr }).toString(),
  });

  if (!subRes.ok) {
    const errJson = (await subRes.json().catch(() => ({}))) as {
      extras?: { result_codes?: { operations?: string[]; transaction?: string } };
    };
    const opCodes = errJson.extras?.result_codes?.operations?.join(", ");
    const txCode = errJson.extras?.result_codes?.transaction;
    throw new Error(`Claim failed on Stellar network: ${opCodes || txCode || subRes.statusText}`);
  }

  const resData = (await subRes.json()) as { hash: string };
  return {
    success: true,
    txHash: resData.hash,
  };
}

/**
 * Reclaims an expired giveaway claimable balance back to the creator/sponsor.
 */
export async function executeReclaimExpired(options: {
  creatorAddress: string;
  balanceId: string;
}): Promise<ClaimResult> {
  const { creatorAddress, balanceId } = options;

  const { TransactionBuilder, Account, Operation } = await import("@stellar/stellar-sdk");

  const accRes = await fetch(`${stellarConfig.horizonUrl}/accounts/${creatorAddress}`);
  if (!accRes.ok) {
    throw new Error("Could not load creator account details from Horizon.");
  }
  const accountData = (await accRes.json()) as { sequence: string };
  const stellarAccount = new Account(creatorAddress, accountData.sequence);

  const txBuilder = new TransactionBuilder(stellarAccount, {
    fee: "100",
    networkPassphrase: stellarConfig.networkPassphrase,
  });

  txBuilder.addOperation(
    Operation.claimClaimableBalance({
      balanceId,
    }),
  );

  txBuilder.setTimeout(60);
  const tx = txBuilder.build();

  const signedXdr = await signWalletTransaction(tx.toXDR(), {
    address: creatorAddress,
  });

  const subRes = await fetch(`${stellarConfig.horizonUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signedXdr }).toString(),
  });

  if (!subRes.ok) {
    const errJson = (await subRes.json().catch(() => ({}))) as {
      extras?: { result_codes?: { operations?: string[]; transaction?: string } };
    };
    const opCodes = errJson.extras?.result_codes?.operations?.join(", ");
    const txCode = errJson.extras?.result_codes?.transaction;
    throw new Error(`Reclaim failed on Stellar network: ${opCodes || txCode || subRes.statusText}`);
  }

  const resData = (await subRes.json()) as { hash: string };
  return {
    success: true,
    txHash: resData.hash,
  };
}
