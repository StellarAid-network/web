import { describe, it, expect } from "vitest";
import { formatAmount } from "@/lib/format-amount";
import { formatAddress, formatDate } from "@/lib/format";

describe("formatAmount", () => {
  it("converts 0 to 0.0000000", () => {
    expect(formatAmount(0n)).toBe("0.0000000");
  });

  it("converts 10_000_000 to 1.0000000", () => {
    expect(formatAmount(10_000_000n)).toBe("1.0000000");
  });

  it("converts 125_000_000 to 12.5000000", () => {
    expect(formatAmount(125_000_000n)).toBe("12.5000000");
  });

  it("handles negative values", () => {
    expect(formatAmount(-10_000_000n)).toBe("-1.0000000");
  });

  it("truncates to 2dp with displayDecimals=2", () => {
    expect(formatAmount(12_500_000n, 7, 2)).toBe("1.25");
  });

  it("works with decimals=0", () => {
    expect(formatAmount(42n, 0)).toBe("42");
  });
});

describe("formatAddress", () => {
  const addr = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";

  it("truncates long address to first4…last4", () => {
    const result = formatAddress(addr, 4);
    expect(result).toMatch(/^GBTY.*4VEQ$/);
    expect(result).toContain("…");
  });

  it("returns short string unchanged", () => {
    expect(formatAddress("GBTY")).toBe("GBTY");
  });
});

describe("formatDate", () => {
  it("returns a non-empty string", () => {
    const result = formatDate(new Date("2025-06-15T12:00:00Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
