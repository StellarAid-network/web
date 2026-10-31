"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Upload, UserCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { PostCard } from "@/components/social/PostCard";
import { ReportDialog } from "@/components/social/ReportDialog";
import { AttestationChip } from "@/components/trust/AttestationChip";
import { ReputationBadge } from "@/components/trust/ReputationBadge";
import { Address } from "@/components/ui/Address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/ui/Money";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { formatDate } from "@/lib/format";
import { ipfsCidToUrl, sanitizeUserText } from "@/lib/sanitize";
import {
  fetchFeedPosts,
  fetchPublicProfile,
  toggleFollowProfile,
  updateOwnProfile,
  uploadAvatarFile,
} from "@/lib/social";

export interface ProfileViewProps {
  profileAddress: string;
}

export function ProfileView({ profileAddress }: ProfileViewProps): React.ReactElement {
  const t = useTranslations("profile");
  const { address: connectedAddress } = useWallet();
  const queryClient = useQueryClient();

  const isOwnProfile = Boolean(connectedAddress && connectedAddress === profileAddress);

  const [editOpen, setEditOpen] = React.useState(false);
  const [displayNameDraft, setDisplayNameDraft] = React.useState("");
  const [bioDraft, setBioDraft] = React.useState("");
  const [avatarHashDraft, setAvatarHashDraft] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const nameInputId = React.useId();
  const bioInputId = React.useId();
  const avatarInputId = React.useId();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", profileAddress],
    queryFn: () => fetchPublicProfile(profileAddress),
  });

  const { data: feedData } = useQuery({
    queryKey: ["feed-posts", "global"],
    queryFn: () => fetchFeedPosts({ scope: "global", limit: 50 }),
  });

  React.useEffect(() => {
    if (profile) {
      setDisplayNameDraft(profile.displayName ?? "");
      setBioDraft(profile.bio ?? "");
      setAvatarHashDraft(profile.avatarHash ?? null);
    }
  }, [profile]);

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const avatarUrl = ipfsCidToUrl(profile.avatarHash);
  const cleanName = profile.displayName
    ? sanitizeUserText(profile.displayName, 50)
    : t("defaultName");
  const cleanBio = profile.bio ? sanitizeUserText(profile.bio, 300) : t("noBio");
  const authorPosts = (feedData?.posts ?? []).filter(
    (p) => p.author === profileAddress && p.status === "VISIBLE",
  );

  const handleToggleFollow = async () => {
    setIsTogglingFollow(true);
    try {
      await toggleFollowProfile(profileAddress);
      await queryClient.invalidateQueries({ queryKey: ["public-profile", profileAddress] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploadingAvatar(true);
    try {
      const { cid } = await uploadAvatarFile(file);
      setAvatarHashDraft(cid);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOwnProfile({
        address: profileAddress,
        displayName: displayNameDraft,
        bio: bioDraft,
        avatarHash: avatarHashDraft,
      });
      await queryClient.invalidateQueries({ queryKey: ["public-profile", profileAddress] });
      setEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card data-testid="profile-header-card">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={cleanName}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary"
                >
                  {cleanName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-xl font-bold sm:text-2xl">{cleanName}</h1>
                <Address value={profile.address} />
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span data-testid="follower-count">
                    {t("followers", { count: profile.followerCount })}
                  </span>
                  <span>·</span>
                  <span>{t("following", { count: profile.followingCount })}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwnProfile ? (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="edit-profile-button"
                      className="gap-1.5"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      <span>{t("editProfile")}</span>
                    </Button>
                  </DialogTrigger>

                  <DialogContent data-testid="edit-profile-dialog">
                    <DialogHeader>
                      <DialogTitle>{t("editDialogTitle")}</DialogTitle>
                      <DialogDescription>{t("editDialogDescription")}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor={nameInputId}>{t("displayNameLabel")}</Label>
                        <Input
                          id={nameInputId}
                          maxLength={50}
                          value={displayNameDraft}
                          onChange={(e) => setDisplayNameDraft(e.target.value)}
                          data-testid="edit-profile-name-input"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={bioInputId}>{t("bioLabel")}</Label>
                        <textarea
                          id={bioInputId}
                          rows={3}
                          maxLength={300}
                          value={bioDraft}
                          onChange={(e) => setBioDraft(e.target.value)}
                          data-testid="edit-profile-bio-input"
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={avatarInputId} className="flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t("avatarLabel")}</span>
                        </Label>
                        <Input
                          id={avatarInputId}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={(e) => void handleAvatarChange(e)}
                          data-testid="edit-profile-avatar-input"
                        />
                        {isUploadingAvatar && (
                          <p className="text-xs text-muted-foreground">{t("uploadingAvatar")}</p>
                        )}
                        {avatarHashDraft && (
                          <p
                            className="font-mono text-xs text-muted-foreground"
                            data-testid="avatar-cid-preview"
                          >
                            IPFS CID: {avatarHashDraft.slice(0, 20)}…
                          </p>
                        )}
                        {uploadError && (
                          <p role="alert" className="text-xs text-destructive">
                            {uploadError}
                          </p>
                        )}
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                          {t("cancel")}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSaving || isUploadingAvatar}
                          data-testid="save-profile-button"
                        >
                          {isSaving ? t("savingChanges") : t("saveChanges")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  type="button"
                  variant={profile.isFollowing ? "outline" : "default"}
                  size="sm"
                  disabled={isTogglingFollow}
                  onClick={() => void handleToggleFollow()}
                  data-testid="follow-toggle-button"
                  className="gap-1.5"
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" aria-hidden="true" />
                      <span>{t("followingState")}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      <span>{t("follow")}</span>
                    </>
                  )}
                </Button>
              )}

              <ReportDialog
                targetType="USER"
                targetId={profile.address}
                testId="report-profile-button"
              />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90">{cleanBio}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ReputationBadge score={profile.reputation.score} />
            {profile.attestations.map((att) => (
              <AttestationChip key={att.id} kind={att.kind} attestor={att.attestor} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("contributionsSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noContributions")}</p>
          ) : (
            <ul className="divide-y">
              {profile.contributions.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <Link href={`/requests/${c.requestId}`} className="font-medium hover:underline">
                      {sanitizeUserText(c.requestTitle, 120)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                  </div>
                  <span className="font-semibold">
                    <Money value={c.amount} asset={c.token} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {authorPosts.length > 0 && (
        <section aria-label={t("postsSection")} className="space-y-4">
          <h2 className="text-lg font-semibold">{t("postsSection")}</h2>
          {authorPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      )}
    </div>
  );
}
