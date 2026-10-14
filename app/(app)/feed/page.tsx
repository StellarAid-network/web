import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function FeedPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Community feed"
      description="Updates from giveaways, requests, and contributions."
    />
  );
}
