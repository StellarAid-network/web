"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { ReportDialog } from "@/components/social/ReportDialog";
import { Address } from "@/components/ui/Address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { formatDate } from "@/lib/format";
import { sanitizeUserText } from "@/lib/sanitize";
import { addPostComment, fetchPostComments } from "@/lib/social";

export interface CommentThreadProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentThread({ postId, onCommentAdded }: CommentThreadProps): React.ReactElement {
  const t = useTranslations("comments");
  const tPost = useTranslations("post");
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputId = React.useId();

  const { data: comments = [] } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => fetchPostComments(postId),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setIsSubmitting(true);
    try {
      await addPostComment({
        postId,
        body: draft,
        author: address,
      });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      onCommentAdded?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label={t("heading")}
      data-testid={`comment-thread-${postId}`}
      className="mt-3 space-y-3 border-t pt-3"
    >
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2.5">
          {comments.map((comment) => {
            if (comment.status === "HIDDEN") {
              return (
                <li
                  key={comment.id}
                  data-testid="hidden-comment-placeholder"
                  className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{tPost("hiddenComment")}</span>
                </li>
              );
            }

            return (
              <li
                key={comment.id}
                data-testid="comment-item"
                className="rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {comment.authorProfile.displayName && (
                      <span className="font-semibold text-foreground">
                        {sanitizeUserText(comment.authorProfile.displayName, 50)}
                      </span>
                    )}
                    <Address value={comment.author} href />
                    <span>· {formatDate(comment.createdAt)}</span>
                  </div>
                  <ReportDialog
                    targetType="COMMENT"
                    targetId={comment.id}
                    testId={`report-comment-${comment.id}`}
                  />
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                  {sanitizeUserText(comment.body, 500)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor={inputId} className="sr-only">
            {t("inputLabel")}
          </Label>
          <Input
            id={inputId}
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("inputPlaceholder")}
            data-testid={`comment-input-${postId}`}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !draft.trim()}
          data-testid={`comment-submit-${postId}`}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isSubmitting ? t("submitting") : t("submit")}</span>
        </Button>
      </form>
    </section>
  );
}
