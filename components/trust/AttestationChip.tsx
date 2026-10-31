"use client";

import type * as React from "react";
import { BadgeCheck, Building2, CheckCircle2, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AttestationChipProps {
  kind: string;
  attestor: string;
  className?: string;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function AttestationChip({
  kind,
  attestor,
  className,
}: AttestationChipProps): React.ReactElement {
  const t = useTranslations("trust");

  const label =
    kind === "verified_need"
      ? t("attestationVerifiedNeed")
      : kind === "community_org"
        ? t("attestationCommunityOrg")
        : kind === "identity_check"
          ? t("attestationIdentityCheck")
          : t("attestationGeneric", { kind });

  const Icon =
    kind === "verified_need"
      ? BadgeCheck
      : kind === "community_org"
        ? Building2
        : kind === "identity_check"
          ? UserCheck
          : CheckCircle2;

  const attestedByText = t("attestedBy", { attestor: truncateAddress(attestor) });

  return (
    <Badge
      variant="outline"
      title={attestedByText}
      aria-label={`${label}. ${attestedByText}`}
      data-testid="attestation-chip"
      className={cn(
        "inline-flex items-center gap-1.5 border-emerald-600/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
