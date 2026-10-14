import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function CreateRequestPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Create a help request"
      description="Describe your need, outline milestones, and invite verifiers."
    />
  );
}
