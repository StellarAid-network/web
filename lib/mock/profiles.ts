/**
 * Mock fixture data for NEXT_PUBLIC_API_MODE=mock.
 * Used by hooks that call the API so the app works without a running backend.
 */

export const mockProfile = {
  address: "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
  displayName: "Demo User",
  bio: "Testing StellarAid in mock mode.",
  avatarHash: null,
  followerCount: 12,
  followingCount: 5,
  createdAt: new Date("2025-01-01").toISOString(),
};

export const mockProfiles: Record<string, typeof mockProfile> = {
  [mockProfile.address]: mockProfile,
};
