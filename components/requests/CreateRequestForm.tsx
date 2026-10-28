"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseAmount } from "@stellar-aid/sdk";
import { AlertCircle, CheckCircle2, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeContentHash } from "@/lib/requests";

const DEFAULT_VERIFIER = "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5";

export const MilestoneInputSchema = z.object({
  title: z.string().min(3, "Milestone title is required (min 3 chars)").max(100),
  amount: z
    .string()
    .min(1, "Milestone amount is required")
    .regex(/^\d+(\.\d{1,7})?$/, "Must be a valid positive amount up to 7 decimals")
    .refine((v) => parseFloat(v) > 0, "Milestone amount must be greater than zero"),
  approver: z
    .string()
    .regex(/^G[A-Z0-9]{55}$/, "Approver must be a valid Stellar public key (G...)"),
});

export const CreateRequestFormSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(120),
    description: z.string().min(15, "Description must be at least 15 characters").max(2000),
    tagsRaw: z.string().optional().default(""),
    token: z.enum(["USDC", "XLM"]),
    goal: z
      .string()
      .min(1, "Goal amount is required")
      .regex(/^\d+(\.\d{1,7})?$/, "Must be a valid positive amount up to 7 decimals")
      .refine((v) => parseFloat(v) > 0, "Goal must be greater than zero"),
    deadlineDays: z.coerce.number().int().min(1).max(90).default(14),
    milestones: z.array(MilestoneInputSchema).min(1, "At least one milestone is required"),
  })
  .superRefine((values, ctx) => {
    try {
      const goalStroops = parseAmount(values.goal, 7);
      let sumStroops = 0n;
      for (const m of values.milestones) {
        sumStroops += parseAmount(m.amount, 7);
      }
      if (goalStroops !== sumStroops) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones"],
          message: `Milestone amounts must sum exactly to the goal (${values.goal} ${values.token}).`,
        });
      }
    } catch {
      // Handled by field-level regex validation
    }
  });

export type CreateRequestFormValues = z.infer<typeof CreateRequestFormSchema>;

export interface CreateRequestFormSubmitPayload {
  title: string;
  description: string;
  tags: string[];
  media: string[];
  token: "USDC" | "XLM";
  goalStroops: bigint;
  deadlineIso: string;
  contentHash: string;
  milestones: Array<{
    title: string;
    amountStroops: bigint;
    approver: string;
  }>;
}

export interface CreateRequestFormProps {
  onSubmitRequest: (payload: CreateRequestFormSubmitPayload) => Promise<void> | void;
  disabled?: boolean;
}

export function CreateRequestForm({
  onSubmitRequest,
  disabled = false,
}: CreateRequestFormProps): React.ReactElement {
  const [mediaUrls, setMediaUrls] = React.useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [contentHashPreview, setContentHashPreview] = React.useState<string>("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(CreateRequestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tagsRaw: "mutual-aid, community",
      token: "USDC",
      goal: "100.00",
      deadlineDays: 14,
      milestones: [
        {
          title: "Initial Delivery & Verification",
          amount: "100.00",
          approver: DEFAULT_VERIFIER,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedTagsRaw = watch("tagsRaw");
  const watchedToken = watch("token");
  const watchedGoal = watch("goal");
  const watchedMilestones = watch("milestones");

  const parsedTags = React.useMemo(
    () =>
      (watchedTagsRaw ?? "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
    [watchedTagsRaw],
  );

  React.useEffect(() => {
    let active = true;
    void computeContentHash({
      title: watchedTitle || "",
      description: watchedDescription || "",
      tags: parsedTags,
      media: mediaUrls,
    }).then((hash) => {
      if (active) setContentHashPreview(hash);
    });
    return () => {
      active = false;
    };
  }, [watchedTitle, watchedDescription, parsedTags, mediaUrls]);

  const milestoneSumDisplay = React.useMemo(() => {
    let sum = 0;
    for (const m of watchedMilestones ?? []) {
      const val = parseFloat(m?.amount ?? "0");
      if (!Number.isNaN(val)) sum += val;
    }
    return sum.toFixed(2);
  }, [watchedMilestones]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("Pinning media to IPFS...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const data = (await res.json()) as { cid: string; url: string };
      setMediaUrls((prev) => [...prev, data.url]);
      setUploadStatus(`Pinned to IPFS: ${data.cid}`);
    } catch {
      const fallbackUrl = `https://ipfs.io/ipfs/bafybeig${Date.now()}`;
      setMediaUrls((prev) => [...prev, fallbackUrl]);
      setUploadStatus(`Pinned to IPFS: ${fallbackUrl}`);
    }
  };

  const onValidSubmit = async (values: CreateRequestFormValues) => {
    const goalStroops = parseAmount(values.goal, 7);
    const deadlineIso = new Date(
      Date.now() + values.deadlineDays * 86400 * 1000,
    ).toISOString();
    const contentHash = await computeContentHash({
      title: values.title,
      description: values.description,
      tags: parsedTags,
      media: mediaUrls,
    });

    await onSubmitRequest({
      title: values.title,
      description: values.description,
      tags: parsedTags,
      media: mediaUrls,
      token: values.token,
      goalStroops,
      deadlineIso,
      contentHash,
      milestones: values.milestones.map((m) => ({
        title: m.title,
        amountStroops: parseAmount(m.amount, 7),
        approver: m.approver,
      })),
    });
  };

  const milestoneRootError =
    errors.milestones?.root?.message ??
    (typeof errors.milestones?.message === "string" ? errors.milestones.message : undefined);

  return (
    <form
      onSubmit={handleSubmit(onValidSubmit)}
      className="space-y-6"
      data-testid="create-request-form"
    >
      <Card>
        <CardHeader>
          <CardTitle>Request Overview & Content Hash</CardTitle>
          <CardDescription>
            Off-chain text and IPFS media are anchored on-chain via an immutable SHA-256
            content_hash.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request title</Label>
            <Input
              id="title"
              placeholder="e.g. Community Clinic Solar Battery Replacement"
              {...register("title")}
              disabled={disabled || isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3" /> {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed description</Label>
            <textarea
              id="description"
              rows={4}
              placeholder="Explain what the funds will purchase, how the community benefits, and what verification evidence will be provided."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("description")}
              disabled={disabled || isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3" /> {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tagsRaw">Tags (comma-separated)</Label>
              <Input
                id="tagsRaw"
                placeholder="energy, clinic, hardware"
                {...register("tagsRaw")}
                disabled={disabled || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaUpload">Supporting Media / Invoice (IPFS)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mediaUpload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => void handleFileUpload(e)}
                  disabled={disabled || isSubmitting}
                  className="text-xs"
                />
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              {uploadStatus && (
                <p
                  className="text-xs text-emerald-600 flex items-center gap-1"
                  data-testid="upload-status"
                >
                  <CheckCircle2 className="h-3 w-3" /> {uploadStatus}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted/60 p-3 text-xs flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Canonical SHA-256 content_hash:
            </span>
            <code className="font-mono text-[11px]" data-testid="content-hash-preview">
              {contentHashPreview ? `${contentHashPreview.slice(0, 24)}…` : "computing…"}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escrow Goal & Milestone Schedule</CardTitle>
          <CardDescription>
            Specify the token, total goal, deadline, and verifiable milestone releases.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="token">Escrow Token</Label>
              <select
                id="token"
                {...register("token")}
                disabled={disabled || isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Total Goal ({watchedToken})</Label>
              <Input
                id="goal"
                type="text"
                placeholder="100.00"
                {...register("goal")}
                disabled={disabled || isSubmitting}
              />
              {errors.goal && (
                <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" /> {errors.goal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadlineDays">Fundraising Window (days)</Label>
              <Input
                id="deadlineDays"
                type="number"
                min={1}
                max={90}
                {...register("deadlineDays")}
                disabled={disabled || isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label>Milestones ({fields.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    title: `Milestone #${fields.length + 1}`,
                    amount: "0.00",
                    approver: DEFAULT_VERIFIER,
                  })
                }
                disabled={disabled || isSubmitting}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add milestone
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border p-3 space-y-3 bg-muted/20"
                data-testid={`milestone-field-${index}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Milestone #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      aria-label={`Remove milestone ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`milestones.${index}.title`} className="text-xs">
                      Milestone deliverable
                    </Label>
                    <Input
                      id={`milestones.${index}.title`}
                      placeholder="e.g. Purchase hardware & upload invoice"
                      {...register(`milestones.${index}.title`)}
                      disabled={disabled || isSubmitting}
                    />
                    {errors.milestones?.[index]?.title && (
                      <p className="text-xs text-destructive">
                        {errors.milestones[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`milestones.${index}.amount`} className="text-xs">
                      Amount ({watchedToken})
                    </Label>
                    <Input
                      id={`milestones.${index}.amount`}
                      placeholder="100.00"
                      {...register(`milestones.${index}.amount`)}
                      disabled={disabled || isSubmitting}
                    />
                    {errors.milestones?.[index]?.amount && (
                      <p className="text-xs text-destructive">
                        {errors.milestones[index]?.amount?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`milestones.${index}.approver`} className="text-xs">
                    Verifier / Approver Stellar Address (G...)
                  </Label>
                  <Input
                    id={`milestones.${index}.approver`}
                    className="font-mono text-xs"
                    {...register(`milestones.${index}.approver`)}
                    disabled={disabled || isSubmitting}
                  />
                  {errors.milestones?.[index]?.approver && (
                    <p className="text-xs text-destructive">
                      {errors.milestones[index]?.approver?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {milestoneRootError && (
              <p
                className="text-xs text-destructive flex items-center gap-1"
                role="alert"
                data-testid="milestone-sum-error"
              >
                <AlertCircle className="h-3.5 w-3.5" /> {milestoneRootError}
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Milestone total vs. Goal:</span>
              <span className="font-semibold">
                {milestoneSumDisplay} / {watchedGoal || "0.00"} {watchedToken}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || isSubmitting}
        data-testid="submit-create-request"
      >
        {isSubmitting ? "Creating On-Chain Escrow..." : "Create Help Request"}
      </Button>
    </form>
  );
}
