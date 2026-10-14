import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import type { Networks } from "@creit.tech/stellar-wallets-kit/types";

import { stellarConfig } from "./stellar";

let initialized = false;

export interface WalletModuleInfo {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export function getWalletModules(): WalletModuleInfo[] {
  return [new FreighterModule(), new xBullModule(), new AlbedoModule()].map((module) => ({
    id: module.productId,
    name: module.productName,
    url: module.productUrl,
    icon: module.productIcon,
  }));
}

export function initWalletKit(): void {
  if (initialized) {
    return;
  }

  StellarWalletsKit.init({
    modules: [new FreighterModule(), new xBullModule(), new AlbedoModule()],
    network: stellarConfig.networkPassphrase as Networks,
    authModal: { showInstallLabel: true, hideUnsupportedWallets: false },
  });

  initialized = true;
}

export async function connectWallet(): Promise<string> {
  initWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function getWalletAddress(): Promise<string> {
  initWalletKit();
  const { address } = await StellarWalletsKit.getAddress();
  return address;
}

export async function signWalletTransaction(
  xdr: string,
  options?: { address?: string },
): Promise<string> {
  initWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: stellarConfig.networkPassphrase,
    address: options?.address,
  });
  return signedTxXdr;
}

export async function signWalletMessage(
  message: string,
  options?: { address?: string },
): Promise<string> {
  initWalletKit();
  const { signedMessage } = await StellarWalletsKit.signMessage(message, {
    networkPassphrase: stellarConfig.networkPassphrase,
    address: options?.address,
  });
  return signedMessage;
}

export async function getWalletKitNetwork(): Promise<{
  network: string;
  networkPassphrase: string;
}> {
  initWalletKit();
  return StellarWalletsKit.getNetwork();
}

export async function disconnectWallet(): Promise<void> {
  initWalletKit();
  await StellarWalletsKit.disconnect();
}
