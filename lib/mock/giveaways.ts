/**
 * Mock giveaway fixtures for development and testing (NEXT_PUBLIC_API_MODE=mock).
 */

export interface MockGiveaway {
  id: string;
  creator: string;
  asset: {
    code: string;
    issuer?: string;
  };
  amount: string;
  amountPerClaim: string;
  claimants: string[];
  claimableFrom: string;
  expiresAt: string;
  status: "open" | "claimed" | "expired";
  title: string;
  description: string;
}

export const mockGiveaways: MockGiveaway[] = [
  {
    id: "00000000111122223333444455556666777788889999aaaabbbbccccddddeeee",
    creator: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    asset: { code: "USDC" },
    amount: "100.00",
    amountPerClaim: "10.00",
    claimants: [
      "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
      "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F",
    ],
    claimableFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    status: "open",
    title: "Community Emergency Grocery Relief",
    description: "Small USDC grants for community members needing immediate grocery assistance.",
  },
  {
    id: "00000000999988887777666655554444333322221111ffffedcba98765432100",
    creator: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
    asset: { code: "XLM" },
    amount: "500.00",
    amountPerClaim: "50.00",
    claimants: ["GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"],
    claimableFrom: new Date(Date.now() - 86400 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
    status: "open",
    title: "Stellar Developer Gas Grant",
    description:
      "Free XLM distribution to help developers fund testnet and mainnet transaction fees.",
  },
  {
    id: "00000000ffffaaaabbbbccccddddeeeeffff0000111122223333444455556666",
    creator: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    asset: { code: "USDC" },
    amount: "250.00",
    amountPerClaim: "25.00",
    claimants: ["GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F"],
    claimableFrom: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    status: "expired",
    title: "Expired Winter Aid",
    description: "Previous grant window that has passed its expiration.",
  },
];
