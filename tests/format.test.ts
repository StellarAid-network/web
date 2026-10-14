import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatRelativeTime,
  formatXlm,
  formatXlmWithSymbol,
  stroopsToXlm,
} from "@/lib/format";

describe("stroopsToXlm", () => {
  it("converts whole amounts", () => {
    expect(stroopsToXlm(10_000_000n)).toBe("1");
    expect(stroopsToXlm(25_000_000n)).toBe("2.5");
  });

  it("trims trailing zeros in the fraction", () => {
    expect(stroopsToXlm(1n)).toBe("0.0000001");
    expect(stroopsToXlm(12_345_000n)).toBe("1.2345");
  });

  it("handles zero and negatives", () => {
    expect(stroopsToXlm(0n)).toBe("0");
    expect(stroopsToXlm(-15_000_000n)).toBe("-1.5");
  });
});

describe("formatXlm", () => {
  it("formats with thousands separators and rounding", () => {
    expect(formatXlm(123_456_789_000n, 2)).toBe("12,345.68");
  });

  it("adds the XLM symbol", () => {
    expect(formatXlmWithSymbol(10_000_000n)).toBe("1 XLM");
  });
});

describe("formatAddress", () => {
  it("shortens long addresses", () => {
    expect(formatAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW", 4)).toBe(
      "GABC…TUVW",
    );
  });

  it("leaves short addresses untouched", () => {
    expect(formatAddress("GABC")).toBe("GABC");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("formats past times", () => {
    expect(formatRelativeTime(new Date("2026-01-01T11:00:00Z"), now)).toBe("1 hour ago");
  });

  it("formats future times", () => {
    expect(formatRelativeTime(new Date("2026-01-02T12:00:00Z"), now)).toBe("tomorrow");
  });
});
