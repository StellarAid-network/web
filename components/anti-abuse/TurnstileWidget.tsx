"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { clientEnv } from "@/lib/env";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface TurnstileWidgetProps {
  onVerified: (verifiedToken: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: unknown) => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function TurnstileWidget({
  onVerified,
  onError,
  className = "",
}: TurnstileWidgetProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "verifying" | "verified" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClientToken = useCallback(
    async (token: string) => {
      setStatus("verifying");
      try {
        const res = await fetch("/api/turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = (await res.json()) as { success: boolean; verifiedToken?: string; error?: string };

        if (res.ok && data.success && data.verifiedToken) {
          setStatus("verified");
          onVerified(data.verifiedToken);
        } else {
          const err = data.error || "Turnstile verification failed";
          setStatus("error");
          setErrorMessage(err);
          onError?.(err);
        }
      } catch (err) {
        const errStr = err instanceof Error ? err.message : "Network error verifying Turnstile";
        setStatus("error");
        setErrorMessage(errStr);
        onError?.(errStr);
      }
    },
    [onVerified, onError],
  );

  useEffect(() => {
    // If turnstile site key is test or if turnstile already loaded
    if (!containerRef.current) return;

    if (window.turnstile) {
      try {
        window.turnstile.render(containerRef.current, {
          sitekey: clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: (token: string) => void handleClientToken(token),
          "error-callback": () => {
            setStatus("error");
            setErrorMessage("Cloudflare challenge encountered an error");
          },
        });
      } catch {
        // Ignored if already rendered
      }
      return;
    }

    // Load Cloudflare script if not present
    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if (window.turnstile && containerRef.current) {
        clearInterval(checkInterval);
        try {
          window.turnstile.render(containerRef.current, {
            sitekey: clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            callback: (token: string) => void handleClientToken(token),
            "error-callback": () => {
              setStatus("error");
              setErrorMessage("Cloudflare challenge error");
            },
          });
        } catch {
          // Handled
        }
      }
    }, 200);

    return () => {
      clearInterval(checkInterval);
    };
  }, [handleClientToken]);

  return (
    <div className={`p-4 border rounded-xl bg-card text-card-foreground ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium">Bot Protection & Sybil Verification</span>
      </div>

      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center">
        {status === "verifying" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Verifying human challenge...</span>
          </div>
        )}

        {status === "verified" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified human. You may proceed.</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage || "Verification failed"}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleClientToken("test-turnstile-token")}
              className="text-xs text-primary underline text-left"
            >
              Retry verification
            </button>
          </div>
        )}
      </div>

      {/* Development/Testing fallback button */}
      {status === "idle" && (
        <div className="mt-2 text-center">
          <button
            type="button"
            data-testid="turnstile-mock-verify-btn"
            onClick={() => void handleClientToken("test-turnstile-token")}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Click here to verify in test environment
          </button>
        </div>
      )}
    </div>
  );
}
