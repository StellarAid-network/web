"use client";

import type * as React from "react";
import { Award, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { computeTier } from "@/lib/mock/social";
import { cn } from "@/lib/utils";

export interface ReputationBadgeProps {
  score: number;
  showTier?: boolean;
  className?: string;
}

export function ReputationBadge({
  score,
  showTier = true,
  className,
}: ReputationBadgeProps): React.ReactElement {
  const t = useTranslations("trust");
  const normalizedScore = Math.max(0, Math.round(score));
  const tier = computeTier(normalizedScore);

  const tierLabel =
    tier === "steward" ? t("tierSteward") : tier === "active" ? t("tierActive") : t("tierNew");

  const Icon = tier === "steward" ? Award : tier === "active" ? ShieldCheck : Sparkles;

  return (
    <Badge
      variant={tier === "new" ? "outline" : "secondary"}
      title={t("reputationTooltip", { score: normalizedScore })}
      aria-label={`${t("reputationLabel", { score: normalizedScore })} — ${tierLabel}`}
      data-testid="reputation-badge"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        tier === "steward" &&
          "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        tier === "active" && "border-sky-600/40 bg-sky-500/10 text-sky-900 dark:text-sky-200",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t("reputationLabel", { score: normalizedScore })}</span>
      {showTier && <span className="opacity-85">· {tierLabel}</span>}
    </Badge>
  );
}
