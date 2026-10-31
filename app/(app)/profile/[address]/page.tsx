import type * as React from "react";
import type { Metadata } from "next";

import { ProfileView } from "@/components/social/ProfileView";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<React.ReactElement> {
  const { address } = await params;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <ProfileView profileAddress={decodeURIComponent(address)} />
    </div>
  );
}
