"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import { createSocialPost, fetchFeedPosts, type FeedScope, type SocialPost } from "@/lib/social";

const VIRTUALIZE_THRESHOLD = 12;
const ESTIMATED_ROW_HEIGHT_PX = 210;
const OVERSCAN_ITEMS = 4;

export interface VirtualizedPostListProps {
  posts: SocialPost[];
}

export function VirtualizedPostList({ posts }: VirtualizedPostListProps): React.ReactElement {
  const tA11y = useTranslations("a11y");
  const tFeed = useTranslations("feed");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(680);

  const shouldVirtualize = posts.length > VIRTUALIZE_THRESHOLD;

  React.useEffect(() => {
    if (!shouldVirtualize) return;
    const node = containerRef.current;
    if (!node) return;
    setViewportHeight(node.clientHeight || 680);
  }, [shouldVirtualize, posts.length]);

  if (!shouldVirtualize) {
    return (
      <div className="space-y-4" data-testid="feed-post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_ROW_HEIGHT_PX) - OVERSCAN_ITEMS);
  const visibleCount = Math.ceil(viewportHeight / ESTIMATED_ROW_HEIGHT_PX) + OVERSCAN_ITEMS * 2;
  const endIndex = Math.min(posts.length, startIndex + visibleCount);
  const visibleSlice = posts.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * ESTIMATED_ROW_HEIGHT_PX;
  const bottomSpacerHeight = Math.max(0, (posts.length - endIndex) * ESTIMATED_ROW_HEIGHT_PX);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground" data-testid="virtualized-feed-summary">
        {tFeed("showingWindow", { visible: visibleSlice.length, total: posts.length })}
      </p>
      <div
        ref={containerRef}
        role="region"
        aria-label={tA11y("virtualizedFeed")}
        tabIndex={0}
        data-testid="virtualized-feed-viewport"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="max-h-[72vh] overflow-y-auto pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          style={{
            paddingTop: `${topSpacerHeight}px`,
            paddingBottom: `${bottomSpacerHeight}px`,
          }}
          className="space-y-4"
        >
          {visibleSlice.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedTimeline(): React.ReactElement {
  const t = useTranslations("feed");
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [scope, setScope] = React.useState<FeedScope>("global");
  const [composerBody, setComposerBody] = React.useState("");
  const [isPublishing, setIsPublishing] = React.useState(false);
  const composerId = React.useId();

  const { data, isLoading } = useQuery({
    queryKey: ["feed-posts", scope],
    queryFn: () => fetchFeedPosts({ scope, limit: 50 }),
  });

  const posts = data?.posts ?? [];

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerBody.trim()) return;
    setIsPublishing(true);
    try {
      await createSocialPost({
        body: composerBody,
        author: address,
      });
      setComposerBody("");
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => void handlePublish(e)} className="space-y-3">
            <Label htmlFor={composerId} className="text-sm font-medium">
              {t("composerLabel")}
            </Label>
            <textarea
              id={composerId}
              rows={3}
              maxLength={2000}
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
              placeholder={t("composerPlaceholder")}
              data-testid="post-composer-input"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{composerBody.length}/2000</span>
              <Button
                type="submit"
                size="sm"
                disabled={isPublishing || !composerBody.trim()}
                data-testid="post-composer-submit"
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isPublishing ? t("postingAction") : t("postAction")}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs value={scope} onValueChange={(v) => setScope(v as FeedScope)} className="space-y-4">
        <TabsList aria-label={t("title")}>
          <TabsTrigger value="global" data-testid="feed-tab-global">
            {t("globalTab")}
          </TabsTrigger>
          <TabsTrigger value="following" data-testid="feed-tab-following">
            {t("followingTab")}
          </TabsTrigger>
        </TabsList>

        {(["global", "following"] as const).map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {tabValue === "following" ? t("emptyFollowing") : t("emptyGlobal")}
                </CardContent>
              </Card>
            ) : (
              <VirtualizedPostList posts={posts} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
