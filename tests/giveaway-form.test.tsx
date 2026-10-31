import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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

import { CreateGiveawayFormSchema } from "@/components/giveaways/CreateGiveawayForm";
import { GiveawayCard } from "@/components/giveaways/GiveawayCard";
import { GiveawayReviewModal } from "@/components/giveaways/GiveawayReviewModal";
import type { GiveawayItem } from "@/lib/giveaways";

describe("Giveaway form and components", () => {
  const validStellarAddress1 = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";
  const validStellarAddress2 = "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5";

  it("validates form schema correctly", () => {
    // Valid values
    const valid = CreateGiveawayFormSchema.safeParse({
      assetCode: "USDC",
      amountPerClaim: "10.00",
      claimantsRaw: `${validStellarAddress1}\n${validStellarAddress2}`,
      expiryDays: 7,
    });
    expect(valid.success).toBe(true);

    // Invalid amount (negative or zero)
    const zeroAmount = CreateGiveawayFormSchema.safeParse({
      assetCode: "USDC",
      amountPerClaim: "0.00",
      claimantsRaw: validStellarAddress1,
      expiryDays: 7,
    });
    expect(zeroAmount.success).toBe(false);

    // Invalid Stellar address
    const invalidAddress = CreateGiveawayFormSchema.safeParse({
      assetCode: "USDC",
      amountPerClaim: "10.00",
      claimantsRaw: "not-a-valid-stellar-key",
      expiryDays: 7,
    });
    expect(invalidAddress.success).toBe(false);

    // Expiry out of bounds (> 30 days)
    const invalidExpiry = CreateGiveawayFormSchema.safeParse({
      assetCode: "USDC",
      amountPerClaim: "10.00",
      claimantsRaw: validStellarAddress1,
      expiryDays: 31,
    });
    expect(invalidExpiry.success).toBe(false);
  });

  it("renders GiveawayCard with proper details", () => {
    const mockItem: GiveawayItem = {
      id: "balance-12345",
      creator: validStellarAddress1,
      asset: { code: "USDC" },
      amount: "50.00",
      amountPerClaim: "25.00",
      claimants: [validStellarAddress2],
      status: "open",
      title: "Mutual Aid Winter Fund",
    };

    render(<GiveawayCard giveaway={mockItem} />);

    expect(screen.getByText("Mutual Aid Winter Fund")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText(/1 claimer/)).toBeInTheDocument();
  });

  it("renders GiveawayReviewModal with calculated locked amount and notices", () => {
    render(
      <GiveawayReviewModal
        open={true}
        onOpenChange={vi.fn()}
        assetCode="USDC"
        amountPerClaim="10.00"
        claimants={[validStellarAddress1, validStellarAddress2]}
        expiryDays={7}
        totalLocked="20.00"
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText("Review Giveaway")).toBeInTheDocument();
    expect(screen.getByText("20.00 USDC")).toBeInTheDocument();
    expect(screen.getByText(/Unclaimed funds:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm & Sign" })).toBeInTheDocument();
  });
});
