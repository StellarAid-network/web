"use client";

import * as React from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { submitContentReport, type ReportTargetType } from "@/lib/social";

export interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  onReported?: () => void;
  testId?: string;
}

export function ReportDialog({
  targetType,
  targetId,
  onReported,
  testId = "report-trigger-button",
}: ReportDialogProps): React.ReactElement {
  const t = useTranslations("report");
  const { address } = useWallet();

  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("spam");
  const [details, setDetails] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectId = React.useId();
  const textareaId = React.useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const reason = `[${category}] ${details.trim()}`;
      await submitContentReport({
        targetType,
        targetId,
        reason,
        reporter: address,
      });
      setSubmitted(true);
      onReported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError(null);
      if (submitted) {
        setDetails("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid={testId}
          aria-label={`${t("triggerLabel")} ${targetType.toLowerCase()}`}
          className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("triggerLabel")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent data-testid="report-dialog">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle", { targetType: targetType.toLowerCase() })}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div
            role="status"
            data-testid="report-submitted-confirmation"
            className="flex items-start gap-2.5 rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("submittedBanner")}</span>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={selectId}>{t("reasonCategoryLabel")}</Label>
              <select
                id={selectId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                data-testid="report-category-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="spam">{t("categorySpam")}</option>
                <option value="scam">{t("categoryScam")}</option>
                <option value="harassment">{t("categoryHarassment")}</option>
                <option value="other">{t("categoryOther")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={textareaId}>{t("detailsLabel")}</Label>
              <textarea
                id={textareaId}
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("detailsPlaceholder")}
                data-testid="report-details-input"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || details.trim().length < 5}
                data-testid="report-submit-button"
              >
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
