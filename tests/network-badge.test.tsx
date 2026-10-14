import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NetworkBadge } from "@/components/wallet/network-badge";

describe("NetworkBadge", () => {
  it("shows the configured network", () => {
    render(<NetworkBadge />);
    expect(screen.getByTestId("network-badge")).toHaveTextContent("Testnet");
  });
});
