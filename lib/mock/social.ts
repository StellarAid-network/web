/**
 * Deterministic social, profile, reputation, attestation, and moderation mock store
 * backed by `localStorage` in browser environments when `NEXT_PUBLIC_API_MODE=mock`
 * or when running standalone without a live backend.
 */

export type ContentVisibility = "VISIBLE" | "HIDDEN";

export interface AuthorProfileSummary {
  displayName: string | null;
  avatarHash: string | null;
}

export interface SocialPost {
  id: string;
  author: string;
  body: string;
  mediaHashes: string[];
  status: ContentVisibility;
  createdAt: string;
  authorProfile: AuthorProfileSummary;
  commentsCount: number;
}

export interface SocialComment {
  id: string;
  postId: string;
  author: string;
  body: string;
  status: ContentVisibility;
  createdAt: string;
  authorProfile: AuthorProfileSummary;
}

export interface ReputationSummary {
  address: string;
  score: number;
  tier: "new" | "active" | "steward";
  badges: string[];
}

export interface AttestationItem {
  id: string;
  attestor: string;
  subject: string;
  kind: string;
  contentHash: string;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export interface ProfileContributionItem {
  id: string;
  requestId: string;
  requestTitle: string;
  amount: string;
  token: "USDC" | "XLM";
  createdAt: string;
}

export interface PublicProfile {
  address: string;
  displayName: string | null;
  bio: string | null;
  avatarHash: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  createdAt: string;
  reputation: ReputationSummary;
  attestations: AttestationItem[];
  contributions: ProfileContributionItem[];
}

export type ReportTargetType = "POST" | "COMMENT" | "REQUEST" | "USER";

export interface ContentReportRecord {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  reporter: string;
  status: "OPEN" | "REVIEWING" | "ACTIONED" | "DISMISSED";
  createdAt: string;
}

export const DEMO_ADDRESS_ALICE = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";
export const DEMO_ADDRESS_AMINA = "GCFGKLCBV5IGJYGRR7FJNU53HFV5674PMQNNJT6HRAFGUAHZ7V3ZELXR";
export const DEMO_ADDRESS_CHIDI = "GD5DJQDDBKGAYNEAXU562HYGOOSYAEOO6AS53PZXBOZGCP5M2OPGMZV3";

const STORAGE_KEY_POSTS = "stellaraid.mock.posts.v1";
const STORAGE_KEY_COMMENTS = "stellaraid.mock.comments.v1";
const STORAGE_KEY_PROFILES = "stellaraid.mock.profiles.v1";
const STORAGE_KEY_FOLLOWS = "stellaraid.mock.follows.v1";
const STORAGE_KEY_REPORTS = "stellaraid.mock.reports.v1";

export function computeTier(score: number): "new" | "active" | "steward" {
  if (score >= 75) return "steward";
  if (score >= 25) return "active";
  return "new";
}

const INITIAL_PROFILES: Record<string, Omit<PublicProfile, "isFollowing">> = {
  [DEMO_ADDRESS_ALICE]: {
    address: DEMO_ADDRESS_ALICE,
    displayName: "Adaeze Okonkwo",
    bio: "Community solar coordinator and verified mutual-aid organizer in Lagos.",
    avatarHash: null,
    followerCount: 28,
    followingCount: 11,
    createdAt: "2025-01-12T09:00:00.000Z",
    reputation: {
      address: DEMO_ADDRESS_ALICE,
      score: 82,
      tier: "steward",
      badges: ["verified-creator", "milestone-deliverer", "consistent-supporter"],
    },
    attestations: [
      {
        id: "att-1",
        attestor: DEMO_ADDRESS_AMINA,
        subject: DEMO_ADDRESS_ALICE,
        kind: "verified_need",
        contentHash: "8f31c2e799014c2155bc91de00ab33128f31c2e799014c2155bc91de00ab3312",
        expiresAt: null,
        revoked: false,
        createdAt: "2025-02-01T12:00:00.000Z",
      },
      {
        id: "att-2",
        attestor: DEMO_ADDRESS_CHIDI,
        subject: DEMO_ADDRESS_ALICE,
        kind: "community_org",
        contentHash: "31a0b7c299014c2155bc91de00ab33128f31c2e799014c2155bc91de00ab9988",
        expiresAt: null,
        revoked: false,
        createdAt: "2025-02-10T15:30:00.000Z",
      },
    ],
    contributions: [
      {
        id: "contrib-demo-1",
        requestId: "1",
        requestTitle: "Clean Borehole Pump Repair for Clinic",
        amount: "450000000",
        token: "USDC",
        createdAt: "2025-02-15T10:15:00.000Z",
      },
    ],
  },
  [DEMO_ADDRESS_AMINA]: {
    address: DEMO_ADDRESS_AMINA,
    displayName: "Amina Yusuf",
    bio: "Nurse practitioner verifying local clinic equipment requests.",
    avatarHash: null,
    followerCount: 41,
    followingCount: 19,
    createdAt: "2025-01-05T08:00:00.000Z",
    reputation: {
      address: DEMO_ADDRESS_AMINA,
      score: 64,
      tier: "active",
      badges: ["trusted-verifier"],
    },
    attestations: [
      {
        id: "att-3",
        attestor: DEMO_ADDRESS_ALICE,
        subject: DEMO_ADDRESS_AMINA,
        kind: "identity_check",
        contentHash: "44b1c2e799014c2155bc91de00ab33128f31c2e799014c2155bc91de00ab1111",
        expiresAt: null,
        revoked: false,
        createdAt: "2025-01-20T09:30:00.000Z",
      },
    ],
    contributions: [],
  },
};

const INITIAL_POSTS: SocialPost[] = [
  {
    id: "post-seed-1",
    author: DEMO_ADDRESS_ALICE,
    body: "Milestone #1 solar inverter installation is live at the neighborhood clinic! Thank you to all 14 contributors who funded the escrow goal. #solar #health",
    mediaHashes: [],
    status: "VISIBLE",
    createdAt: "2025-02-20T14:20:00.000Z",
    authorProfile: {
      displayName: "Adaeze Okonkwo",
      avatarHash: null,
    },
    commentsCount: 2,
  },
  {
    id: "post-seed-2",
    author: DEMO_ADDRESS_AMINA,
    body: "Opened a community textbook giveaway for 20 nursing students on Stellar Testnet. Claim with your wallet once Turnstile verification completes. #education",
    mediaHashes: [],
    status: "VISIBLE",
    createdAt: "2025-02-19T11:05:00.000Z",
    authorProfile: {
      displayName: "Amina Yusuf",
      avatarHash: null,
    },
    commentsCount: 0,
  },
  {
    id: "post-seed-hidden",
    author: DEMO_ADDRESS_CHIDI,
    body: "Hidden spam example",
    mediaHashes: [],
    status: "HIDDEN",
    createdAt: "2025-02-18T08:00:00.000Z",
    authorProfile: {
      displayName: null,
      avatarHash: null,
    },
    commentsCount: 0,
  },
];

const INITIAL_COMMENTS: Record<string, SocialComment[]> = {
  "post-seed-1": [
    {
      id: "comment-seed-1",
      postId: "post-seed-1",
      author: DEMO_ADDRESS_AMINA,
      body: "Inspected the inverter serial numbers on site today—running smoothly!",
      status: "VISIBLE",
      createdAt: "2025-02-20T15:00:00.000Z",
      authorProfile: {
        displayName: "Amina Yusuf",
        avatarHash: null,
      },
    },
    {
      id: "comment-seed-hidden",
      postId: "post-seed-1",
      author: DEMO_ADDRESS_CHIDI,
      body: "Moderated off-topic link",
      status: "HIDDEN",
      createdAt: "2025-02-20T15:10:00.000Z",
      authorProfile: {
        displayName: null,
        avatarHash: null,
      },
    },
  ],
};

let memoryPosts: SocialPost[] = structuredClone(INITIAL_POSTS);
let memoryComments: Record<string, SocialComment[]> = structuredClone(INITIAL_COMMENTS);
let memoryProfiles: Record<string, Omit<PublicProfile, "isFollowing">> = structuredClone(
  INITIAL_PROFILES,
);
let memoryFollows: string[] = [DEMO_ADDRESS_ALICE];
let memoryReports: ContentReportRecord[] = [];

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function getMockPosts(): SocialPost[] {
  memoryPosts = readJsonStorage(STORAGE_KEY_POSTS, memoryPosts);
  return memoryPosts;
}

export function saveMockPosts(posts: SocialPost[]): void {
  memoryPosts = posts;
  writeJsonStorage(STORAGE_KEY_POSTS, posts);
}

export function getMockComments(postId: string): SocialComment[] {
  memoryComments = readJsonStorage(STORAGE_KEY_COMMENTS, memoryComments);
  return memoryComments[postId] ?? [];
}

export function saveMockComment(postId: string, comment: SocialComment): void {
  memoryComments = readJsonStorage(STORAGE_KEY_COMMENTS, memoryComments);
  const existing = memoryComments[postId] ?? [];
  memoryComments = {
    ...memoryComments,
    [postId]: [...existing, comment],
  };
  writeJsonStorage(STORAGE_KEY_COMMENTS, memoryComments);

  const posts = getMockPosts().map((p) =>
    p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
  );
  saveMockPosts(posts);
}

export function getMockFollowedAddresses(): string[] {
  memoryFollows = readJsonStorage(STORAGE_KEY_FOLLOWS, memoryFollows);
  return memoryFollows;
}

export function toggleMockFollow(address: string): boolean {
  const current = getMockFollowedAddresses();
  const exists = current.includes(address);
  const next = exists ? current.filter((a) => a !== address) : [...current, address];
  memoryFollows = next;
  writeJsonStorage(STORAGE_KEY_FOLLOWS, next);

  memoryProfiles = readJsonStorage(STORAGE_KEY_PROFILES, memoryProfiles);
  const existing = memoryProfiles[address];
  if (existing) {
    memoryProfiles[address] = {
      ...existing,
      followerCount: Math.max(0, existing.followerCount + (exists ? -1 : 1)),
    };
    writeJsonStorage(STORAGE_KEY_PROFILES, memoryProfiles);
  }
  return !exists;
}

export function getMockProfileByAddress(address: string): PublicProfile {
  memoryProfiles = readJsonStorage(STORAGE_KEY_PROFILES, memoryProfiles);
  const followed = getMockFollowedAddresses().includes(address);
  const stored = memoryProfiles[address];
  if (stored) {
    return {
      ...stored,
      isFollowing: followed,
    };
  }
  return {
    address,
    displayName: null,
    bio: null,
    avatarHash: null,
    followerCount: followed ? 1 : 0,
    followingCount: 0,
    isFollowing: followed,
    createdAt: "2025-02-01T00:00:00.000Z",
    reputation: {
      address,
      score: 18,
      tier: "new",
      badges: [],
    },
    attestations: [],
    contributions: [],
  };
}

export function upsertMockProfile(
  address: string,
  updates: { displayName?: string | null; bio?: string | null; avatarHash?: string | null },
): PublicProfile {
  const current = getMockProfileByAddress(address);
  const { isFollowing, ...rest } = current;
  const updated: Omit<PublicProfile, "isFollowing"> = {
    ...rest,
    displayName: updates.displayName !== undefined ? updates.displayName : rest.displayName,
    bio: updates.bio !== undefined ? updates.bio : rest.bio,
    avatarHash: updates.avatarHash !== undefined ? updates.avatarHash : rest.avatarHash,
  };
  memoryProfiles = readJsonStorage(STORAGE_KEY_PROFILES, memoryProfiles);
  memoryProfiles[address] = updated;
  writeJsonStorage(STORAGE_KEY_PROFILES, memoryProfiles);
  return { ...updated, isFollowing };
}

export function getMockAttestationsForSubject(subject: string): AttestationItem[] {
  const profile = getMockProfileByAddress(subject);
  if (profile.attestations.length > 0) {
    return profile.attestations;
  }
  if (subject === "1" || subject === "request:1") {
    return [
      {
        id: "att-req-1",
        attestor: DEMO_ADDRESS_AMINA,
        subject,
        kind: "verified_need",
        contentHash: "8f31c2e799014c2155bc91de00ab33128f31c2e799014c2155bc91de00ab3312",
        expiresAt: null,
        revoked: false,
        createdAt: "2025-02-14T10:00:00.000Z",
      },
    ];
  }
  return [];
}

export function saveMockReport(report: ContentReportRecord): void {
  memoryReports = readJsonStorage(STORAGE_KEY_REPORTS, memoryReports);
  memoryReports = [report, ...memoryReports];
  writeJsonStorage(STORAGE_KEY_REPORTS, memoryReports);
}

export function getMockReports(): ContentReportRecord[] {
  memoryReports = readJsonStorage(STORAGE_KEY_REPORTS, memoryReports);
  return memoryReports;
}

export function resetMockSocialStore(): void {
  memoryPosts = structuredClone(INITIAL_POSTS);
  memoryComments = structuredClone(INITIAL_COMMENTS);
  memoryProfiles = structuredClone(INITIAL_PROFILES);
  memoryFollows = [DEMO_ADDRESS_ALICE];
  memoryReports = [];
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_POSTS);
    window.localStorage.removeItem(STORAGE_KEY_COMMENTS);
    window.localStorage.removeItem(STORAGE_KEY_PROFILES);
    window.localStorage.removeItem(STORAGE_KEY_FOLLOWS);
    window.localStorage.removeItem(STORAGE_KEY_REPORTS);
  }
}
