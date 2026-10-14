"use client";

import type * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, HandHeart, Home, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/giveaways", label: "Giveaways", icon: Gift },
  { href: "/requests", label: "Requests", icon: HandHeart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function BottomNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
