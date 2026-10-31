import type * as React from "react";
import Link from "next/link";

import { ConnectButton } from "@/components/wallet/connect-button";
import { NetworkBadge } from "@/components/wallet/network-badge";

const NAV_LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/giveaways", label: "Giveaways" },
  { href: "/requests", label: "Requests" },
] as const;

export function SiteHeader(): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            StellarAid
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-4 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
