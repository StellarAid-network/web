import { clientEnv } from "./env";

export const NETWORK_PASSPHRASES = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015",
  local: "Standalone Network ; February 2017",
} as const;

export const DEFAULT_RPC_URLS = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban.stellar.org",
  local: "http://localhost:8000/soroban/rpc",
} as const;

export const DEFAULT_HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
  local: "http://localhost:8000",
} as const;

export type StellarNetwork = keyof typeof NETWORK_PASSPHRASES;

export interface StellarConfig {
  network: StellarNetwork;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
}

const network = clientEnv.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork;

export const stellarConfig: StellarConfig = {
  network,
  networkPassphrase: NETWORK_PASSPHRASES[network],
  rpcUrl: clientEnv.NEXT_PUBLIC_RPC_URL ?? DEFAULT_RPC_URLS[network],
  horizonUrl: clientEnv.NEXT_PUBLIC_HORIZON_URL ?? DEFAULT_HORIZON_URLS[network],
};

export function explorerTxUrl(hash: string): string {
  const base =
    stellarConfig.network === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${hash}`;
}

export function explorerAccountUrl(address: string): string {
  const base =
    stellarConfig.network === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
  return `${base}/account/${address}`;
}
