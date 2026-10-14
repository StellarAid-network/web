import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function SettingsPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Settings"
      description="Manage preferences, notifications, and connected accounts."
    />
  );
}
