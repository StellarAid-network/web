/**
 * Social, profile, trust (reputation + attestations), and moderation client layer.
 *
 * Talks to the typed Fastify API when reachable and falls back cleanly to the
 * deterministic mock store when `NEXT_PUBLIC_API_MODE=mock` or offline.
 */

import { apiFetch } from "./api-client";
import { clientEnv } from "./env";
import { sanitizeUserText } from "./sanitize";
import {
  computeTier,
  DEMO_ADDRESS_ALICE,
  getMockAttestationsForSubject,
  getMockComments,
  getMockFollowedAddresses,
  getMockPosts,
  getMockProfileByAddress,
  saveMockComment,
  saveMockPosts,
  saveMockReport,
  toggleMockFollow,
  upsertMockProfile,
  type AttestationItem,
  type ContentReportRecord,
  type PublicProfile,
  type ReportTargetType,
  type ReputationSummary,
  type SocialComment,
  type SocialPost,
} from "./mock/social";

export type {
  AttestationItem,
  ContentReportRecord,
  PublicProfile,
  ReportTargetType,
  ReputationSummary,
  SocialComment,
  SocialPost,
};

export type FeedScope = "global" | "following";

export interface FeedPageResult {
  posts: SocialPost[];
  nextCursor: string | null;
}

export async function fetchFeedPosts(
  params: {
    scope?: FeedScope;
    cursor?: string | null;
    limit?: number;
    includeHiddenPlaceholders?: boolean;
  } = {},
): Promise<FeedPageResult> {
  const { scope = "global", cursor, limit = 25, includeHiddenPlaceholders = true } = params;

  const filterMock = (): FeedPageResult => {
    const all = getMockPosts();
    const followed = getMockFollowedAddresses();
    const scoped = scope === "following" ? all.filter((p) => followed.includes(p.author)) : all;
    const filtered = includeHiddenPlaceholders
      ? scoped
      : scoped.filter((p) => p.status === "VISIBLE");
    return {
      posts: filtered.slice(0, limit),
      nextCursor: null,
    };
  };

  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return filterMock();
  }

  try {
    const search = new URLSearchParams({ scope, limit: String(limit) });
    if (cursor) search.set("cursor", cursor);
    const res = await apiFetch<{ posts: SocialPost[]; nextCursor: string | null }>(
      `/feed?${search.toString()}`,
    );
    if (!res?.posts) {
      return filterMock();
    }
    return res;
  } catch {
    return filterMock();
  }
}

export async function createSocialPost(params: {
  body: string;
  author?: string | null;
  mediaHashes?: string[];
}): Promise<SocialPost> {
  const cleanBody = sanitizeUserText(params.body, 2000);
  if (!cleanBody) {
    throw new Error("Post body cannot be empty.");
  }

  const author = params.author || DEMO_ADDRESS_ALICE;
  const mediaHashes = params.mediaHashes ?? [];

  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      const created = await apiFetch<{
        id: string;
        author: string;
        body: string;
        mediaHashes: string[];
        status: "VISIBLE" | "HIDDEN";
        createdAt: string;
      }>("/posts", {
        method: "POST",
        body: { body: cleanBody, mediaHashes },
      });
      const profile = getMockProfileByAddress(created.author);
      return {
        ...created,
        authorProfile: {
          displayName: profile.displayName,
          avatarHash: profile.avatarHash,
        },
        commentsCount: 0,
      };
    } catch {
      // Fall back to local persistence when running without live session/backend
    }
  }

  const profile = getMockProfileByAddress(author);
  const post: SocialPost = {
    id: `post-${Date.now()}`,
    author,
    body: cleanBody,
    mediaHashes,
    status: "VISIBLE",
    createdAt: new Date().toISOString(),
    authorProfile: {
      displayName: profile.displayName,
      avatarHash: profile.avatarHash,
    },
    commentsCount: 0,
  };
  saveMockPosts([post, ...getMockPosts()]);
  return post;
}

export async function fetchPostComments(postId: string): Promise<SocialComment[]> {
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return getMockComments(postId);
  }

  try {
    const res = await apiFetch<{ comments: SocialComment[] }>(`/posts/${postId}/comments`);
    return res.comments ?? getMockComments(postId);
  } catch {
    return getMockComments(postId);
  }
}

export async function addPostComment(params: {
  postId: string;
  body: string;
  author?: string | null;
}): Promise<SocialComment> {
  const cleanBody = sanitizeUserText(params.body, 500);
  if (!cleanBody) {
    throw new Error("Comment cannot be empty.");
  }

  const author = params.author || DEMO_ADDRESS_ALICE;

  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      const created = await apiFetch<{
        id: string;
        postId: string;
        author: string;
        body: string;
        status: "VISIBLE" | "HIDDEN";
        createdAt: string;
      }>(`/posts/${params.postId}/comments`, {
        method: "POST",
        body: { body: cleanBody },
      });
      const profile = getMockProfileByAddress(created.author);
      return {
        ...created,
        authorProfile: {
          displayName: profile.displayName,
          avatarHash: profile.avatarHash,
        },
      };
    } catch {
      // Fall back to local store in standalone mode
    }
  }

  const profile = getMockProfileByAddress(author);
  const comment: SocialComment = {
    id: `comment-${Date.now()}`,
    postId: params.postId,
    author,
    body: cleanBody,
    status: "VISIBLE",
    createdAt: new Date().toISOString(),
    authorProfile: {
      displayName: profile.displayName,
      avatarHash: profile.avatarHash,
    },
  };
  saveMockComment(params.postId, comment);
  return comment;
}

export async function fetchPublicProfile(address: string): Promise<PublicProfile> {
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return getMockProfileByAddress(address);
  }

  try {
    const [profileRes, repRes, attRes] = await Promise.all([
      apiFetch<{
        address: string;
        displayName: string | null;
        bio: string | null;
        avatarHash: string | null;
        followerCount: number;
        followingCount: number;
        createdAt: string;
        reputation?: { score: number; badges?: string[] };
      }>(`/profiles/${address}`),
      fetchReputationSummary(address),
      fetchAttestations(address),
    ]);

    const followed = getMockFollowedAddresses().includes(address);
    const score = profileRes.reputation?.score ?? repRes.score;
    return {
      address: profileRes.address,
      displayName: profileRes.displayName,
      bio: profileRes.bio,
      avatarHash: profileRes.avatarHash,
      followerCount: profileRes.followerCount,
      followingCount: profileRes.followingCount,
      isFollowing: followed,
      createdAt: profileRes.createdAt,
      reputation: {
        address,
        score,
        tier: computeTier(score),
        badges: profileRes.reputation?.badges ?? repRes.badges,
      },
      attestations: attRes,
      contributions: getMockProfileByAddress(address).contributions,
    };
  } catch {
    return getMockProfileByAddress(address);
  }
}

export async function toggleFollowProfile(address: string): Promise<{ following: boolean }> {
  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      const res = await apiFetch<{ following: boolean }>(`/profiles/${address}/follow`, {
        method: "POST",
      });
      toggleMockFollow(address);
      return res;
    } catch {
      // Fall back to local state in standalone mode
    }
  }
  const following = toggleMockFollow(address);
  return { following };
}

export async function updateOwnProfile(params: {
  address: string;
  displayName: string;
  bio: string;
  avatarHash?: string | null;
}): Promise<PublicProfile> {
  const displayName = sanitizeUserText(params.displayName, 50) || null;
  const bio = sanitizeUserText(params.bio, 300) || null;
  const avatarHash = params.avatarHash ?? undefined;

  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      await apiFetch("/profiles/me", {
        method: "PUT",
        body: {
          displayName,
          bio,
          ...(avatarHash !== undefined ? { avatarHash } : {}),
        },
      });
    } catch {
      // Persist locally as well for standalone mode
    }
  }

  return upsertMockProfile(params.address, {
    displayName,
    bio,
    ...(avatarHash !== undefined ? { avatarHash } : {}),
  });
}

export async function uploadAvatarFile(file: File): Promise<{ cid: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || "Failed to upload avatar");
  }

  const data = (await res.json()) as { cid: string; url: string };
  return { cid: data.cid, url: data.url };
}

export async function fetchReputationSummary(address: string): Promise<ReputationSummary> {
  if (!address) {
    return { address: "", score: 0, tier: "new", badges: [] };
  }

  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return getMockProfileByAddress(address).reputation;
  }

  try {
    const res = await apiFetch<{
      address: string;
      score: number;
      badges?: string[];
    }>(`/reputation/${encodeURIComponent(address)}`);
    const score = Number(res.score ?? 0);
    return {
      address: res.address ?? address,
      score,
      tier: computeTier(score),
      badges: res.badges ?? [],
    };
  } catch {
    return getMockProfileByAddress(address).reputation;
  }
}

export async function fetchAttestations(subject: string): Promise<AttestationItem[]> {
  if (!subject) return [];

  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return getMockAttestationsForSubject(subject);
  }

  try {
    const res = await apiFetch<{
      attestations?: AttestationItem[];
      data?: AttestationItem[];
    }>(`/attestations/${encodeURIComponent(subject)}`);
    const items = res.attestations ?? res.data ?? [];
    return items.filter((a) => !a.revoked);
  } catch {
    return getMockAttestationsForSubject(subject);
  }
}

export async function submitContentReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  reporter?: string | null;
}): Promise<ContentReportRecord> {
  const cleanReason = sanitizeUserText(params.reason, 1000);
  if (cleanReason.length < 5) {
    throw new Error("Report reason must be at least 5 characters.");
  }

  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      const created = await apiFetch<ContentReportRecord>("/reports", {
        method: "POST",
        body: {
          targetType: params.targetType,
          targetId: params.targetId,
          reason: cleanReason,
        },
      });
      saveMockReport(created);
      return created;
    } catch {
      // Fall back to local queue in standalone mode
    }
  }

  const record: ContentReportRecord = {
    id: `report-${Date.now()}`,
    targetType: params.targetType,
    targetId: params.targetId,
    reason: cleanReason,
    reporter: params.reporter || DEMO_ADDRESS_ALICE,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
  saveMockReport(record);
  return record;
}
