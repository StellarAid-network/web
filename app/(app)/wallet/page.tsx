import type * as React from "react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function WalletPage(): React.ReactElement {
  return (
    <PagePlaceholder
      title="Wallet"
      description="Balances, activity, and transaction history for your connected wallet."
    />
  );
}
