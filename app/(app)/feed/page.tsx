import type * as React from "react";
import type { Metadata } from "next";

import { FeedTimeline } from "@/components/social/FeedTimeline";
import { getLocaleMessages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Community feed",
};

export default function FeedPage(): React.ReactElement {
  const messages = getLocaleMessages();

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{messages.feed.title}</h1>
        <p className="text-sm text-muted-foreground">{messages.feed.subtitle}</p>
      </header>

      <FeedTimeline />
    </div>
  );
}
