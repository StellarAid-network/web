/**
 * Mock help request fixtures and state for development and testing (NEXT_PUBLIC_API_MODE=mock).
 */

export type HelpRequestStatus =
  "Open" | "Funded" | "Released" | "Cancelled" | "Failed" | "Disputed";

export type MilestoneStatus = "Pending" | "Submitted" | "Approved" | "Released";

export interface HelpRequestMilestone {
  index: number;
  title: string;
  amount: string; // stroops string (7 decimals)
  approver: string;
  status: MilestoneStatus;
  evidenceHash: string | null;
}

export interface HelpRequestContribution {
  id: string;
  txHash: string;
  contributor: string;
  amount: string; // stroops string (7 decimals)
  refunded: boolean;
  createdAt: string;
}

export interface HelpRequestItem {
  id: string;
  onChainId: string;
  creator: string;
  recipient: string;
  token: "USDC" | "XLM";
  goal: string; // stroops string (7 decimals)
  raised: string; // stroops string (7 decimals)
  status: HelpRequestStatus;
  deadline: string; // ISO date string
  contentHash: string;
  hashMismatch: boolean;
  hidden?: boolean;
  title: string;
  description: string;
  tags: string[];
  media: string[];
  milestones: HelpRequestMilestone[];
  contributions: HelpRequestContribution[];
  createdAt: string;
}

export const INITIAL_MOCK_REQUESTS: HelpRequestItem[] = [
  {
    id: "1",
    onChainId: "1",
    creator: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    recipient: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    token: "USDC",
    goal: "10000000000", // 1,000.00 USDC
    raised: "8500000000", // 850.00 USDC (85% -> Nearing goal)
    status: "Open",
    deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), // 18h left -> Ending soon
    contentHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    hashMismatch: false,
    title: "Neighborhood Solar Microgrid Battery Replacement",
    description:
      "Replacing two degraded lithium iron phosphate battery modules for the community clinic backup power system.",
    tags: ["energy", "clinic", "infrastructure"],
    media: ["https://ipfs.io/ipfs/bafybeigsolarclinicbattery00000000000000000000000000001"],
    milestones: [
      {
        index: 0,
        title: "Battery Module Procurement & Invoice",
        amount: "6000000000", // 600.00 USDC
        approver: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
        status: "Pending",
        evidenceHash: null,
      },
      {
        index: 1,
        title: "Installation & Load Test Verification",
        amount: "4000000000", // 400.00 USDC
        approver: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
        status: "Pending",
        evidenceHash: null,
      },
    ],
    contributions: [
      {
        id: "contrib-1",
        txHash: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
        contributor: "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F",
        amount: "5000000000",
        refunded: false,
        createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      },
      {
        id: "contrib-2",
        txHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        contributor: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
        amount: "3500000000",
        refunded: false,
        createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
  },
  {
    id: "2",
    onChainId: "2",
    creator: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
    recipient: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5",
    token: "USDC",
    goal: "5000000000", // 500.00 USDC
    raised: "5000000000", // 500.00 USDC (100% -> Funded)
    status: "Funded",
    deadline: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
    contentHash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
    hashMismatch: false,
    title: "Mobile Water Filtration Kit for Rural School",
    description:
      "Funding ceramic water filtration units and replacement cartridges for 120 primary school students.",
    tags: ["water", "education", "health"],
    media: [],
    milestones: [
      {
        index: 0,
        title: "Purchase Filtration Units",
        amount: "3000000000",
        approver: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
        status: "Submitted",
        evidenceHash: "bafybeigwaterfilterinvoice000000000000000000000000000001",
      },
      {
        index: 1,
        title: "School Delivery & Water Quality Check",
        amount: "2000000000",
        approver: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
        status: "Pending",
        evidenceHash: null,
      },
    ],
    contributions: [
      {
        id: "contrib-3",
        txHash: "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
        contributor: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
        amount: "5000000000",
        refunded: false,
        createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: "3",
    onChainId: "3",
    creator: "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F",
    recipient: "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F",
    token: "XLM",
    goal: "20000000000", // 2,000.00 XLM
    raised: "4000000000", // 400.00 XLM
    status: "Failed",
    deadline: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    contentHash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    hashMismatch: false,
    title: "Community Mesh Wi-Fi Relay Nodes",
    description:
      "Outdoor directional antennas for community internet access. Goal was not reached before the deadline; contributors can claim full refunds.",
    tags: ["connectivity", "mesh", "hardware"],
    media: [],
    milestones: [
      {
        index: 0,
        title: "Hardware Order & Customs Clearance",
        amount: "20000000000",
        approver: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
        status: "Pending",
        evidenceHash: null,
      },
    ],
    contributions: [
      {
        id: "contrib-4",
        txHash: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
        contributor: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
        amount: "4000000000",
        refunded: false,
        createdAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
  },
];

const STORAGE_KEY = "stellaraid_mock_requests_v1";

let inMemoryMockRequests: HelpRequestItem[] = structuredClone(INITIAL_MOCK_REQUESTS);

export function getMockRequests(): HelpRequestItem[] {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HelpRequestItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryMockRequests = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to in-memory state
    }
  }
  return inMemoryMockRequests;
}

export function saveMockRequests(next: HelpRequestItem[]): void {
  inMemoryMockRequests = next;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function resetMockRequests(): void {
  inMemoryMockRequests = structuredClone(INITIAL_MOCK_REQUESTS);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
