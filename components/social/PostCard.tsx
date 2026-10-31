"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeOff, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { CommentThread } from "@/components/social/CommentThread";
import { ReportDialog } from "@/components/social/ReportDialog";
import { Address } from "@/components/ui/Address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { ipfsCidToUrl, sanitizeUserText } from "@/lib/sanitize";
import type { SocialPost } from "@/lib/social";

export interface PostCardProps {
  post: SocialPost;
  defaultCommentsOpen?: boolean;
}

export function PostCard({ post, defaultCommentsOpen = false }: PostCardProps): React.ReactElement {
  const tFeed = useTranslations("feed");
  const tPost = useTranslations("post");
  const [commentsOpen, setCommentsOpen] = React.useState(defaultCommentsOpen);
  const [localCommentDelta, setLocalCommentDelta] = React.useState(0);

  if (post.status === "HIDDEN") {
    return (
      <Card
        data-testid="hidden-post-placeholder"
        className="border-dashed bg-muted/30"
        aria-label={tFeed("hiddenPlaceholder")}
      >
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{tFeed("hiddenPlaceholder")}</p>
        </CardContent>
      </Card>
    );
  }

  const avatarUrl = ipfsCidToUrl(post.authorProfile.avatarHash);
  const cleanName = post.authorProfile.displayName
    ? sanitizeUserText(post.authorProfile.displayName, 50)
    : null;
  const cleanBody = sanitizeUserText(post.body, 2000);
  const totalComments = post.commentsCount + localCommentDelta;

  return (
    <Card data-testid="post-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={cleanName ?? post.author}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              >
                {(cleanName ?? post.author).slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                {cleanName && (
                  <Link
                    href={`/profile/${post.author}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {cleanName}
                  </Link>
                )}
                <Address value={post.author} href />
              </div>
              <time dateTime={post.createdAt} className="text-xs text-muted-foreground">
                {formatDate(post.createdAt)}
              </time>
            </div>
          </div>

          <ReportDialog targetType="POST" targetId={post.id} testId={`report-post-${post.id}`} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{cleanBody}</p>

        {post.mediaHashes.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.mediaHashes.map((cid, idx) => {
              const url = ipfsCidToUrl(cid);
              if (!url) return null;
              return (
                <div key={cid} className="relative aspect-video overflow-hidden rounded-md border">
                  <Image
                    src={url}
                    alt={tPost("mediaAlt", { index: idx + 1 })}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen((prev) => !prev)}
            data-testid={`toggle-comments-${post.id}`}
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{tPost("commentsToggle", { count: totalComments })}</span>
          </Button>
        </div>

        {commentsOpen && (
          <CommentThread
            postId={post.id}
            onCommentAdded={() => setLocalCommentDelta((c) => c + 1)}
          />
        )}
      </CardContent>
    </Card>
  );
}
