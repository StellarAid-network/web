import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function RequestsPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Help requests"
      description="Community members raising support with milestones and verifiers."
    />
  );
}
