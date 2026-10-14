import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function ProfilePage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Profile"
      description="Public reputation, activity, and contributions for this address."
    />
  );
}
