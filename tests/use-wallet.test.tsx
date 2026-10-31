/**
 * Unit tests for useWallet hook.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWallet } from "@/hooks/use-wallet";

// Mock the wallet-kit module so tests never open a browser extension.
vi.mock("@/lib/wallet-kit", () => ({
  connectWallet: vi
    .fn()
    .mockResolvedValue("GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"),
  disconnectWallet: vi.fn().mockResolvedValue(undefined),
  getWalletAddress: vi
    .fn()
    .mockResolvedValue("GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"),
  getWalletKitNetwork: vi.fn().mockResolvedValue({
    network: "TESTNET",
    networkPassphrase: "Test SDF Network ; September 2015",
  }),
  signWalletTransaction: vi.fn().mockResolvedValue("signed-xdr"),
  signWalletMessage: vi.fn().mockResolvedValue("signed-message"),
  initWalletKit: vi.fn(),
}));

// Mock stellar.ts so no real config is read during tests.
vi.mock("@/lib/stellar", () => ({
  stellarConfig: {
    network: "testnet",
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
  },
  explorerAccountUrl: (addr: string) => `https://stellar.expert/explorer/testnet/account/${addr}`,
  explorerTxUrl: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
}));

// Mock env so zod validation doesn't fail in test.
vi.mock("@/lib/env", () => ({
  clientEnv: {
    NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
    NEXT_PUBLIC_API_URL: "http://localhost:4000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_MODE: "live",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test-key",
  },
  isMockMode: false,
}));

describe("useWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with no address", () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBeNull();
  });

  it("connect sets address", async () => {
    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.address).toBe("GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ");
  });

  it("disconnect clears address", async () => {
    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.address).not.toBeNull();

    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.address).toBeNull();
  });

  it("signTransaction calls signWalletTransaction", async () => {
    const { signWalletTransaction } = await import("@/lib/wallet-kit");
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    const xdr = await result.current.signTransaction("unsigned-xdr");
    expect(xdr).toBe("signed-xdr");
    expect(signWalletTransaction).toHaveBeenCalledWith("unsigned-xdr", {
      address: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    });
  });

  it("isNetworkMismatch is false when network matches", async () => {
    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect();
    });
    // wallet returns testnet passphrase which matches stellarConfig
    expect(result.current.isNetworkMismatch).toBe(false);
  });
});
