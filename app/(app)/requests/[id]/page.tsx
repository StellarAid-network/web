import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function RequestDetailPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Help request details"
      description="Progress, milestones, verifiers, and contributor history."
    />
  );
}
