import type * as React from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} StellarAid. Open-source mutual aid.</p>
          <nav aria-label="Footer navigation" className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/safety" className="hover:text-foreground">
              Safety
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
