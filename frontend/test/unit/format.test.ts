import { describe, expect, it } from "vitest";
import {
  formatAdminDateTime,
  formatYen,
  getPriorityDisplay,
  getStockStatusDisplay,
} from "@/lib/format";

describe("format utilities", () => {
  it("formats Japanese yen without decimals", () => {
    expect(formatYen(98000)).toBe("¥98,000");
  });

  it("formats admin date-time values and handles invalid dates", () => {
    expect(formatAdminDateTime("2026-06-04T12:34:00+09:00")).toContain(
      "2026",
    );
    expect(formatAdminDateTime("not-a-date")).toBe("日時不明");
  });

  it("maps stock status values to Japanese labels", () => {
    expect(getStockStatusDisplay("IN_STOCK")).toEqual({
      label: "在庫あり",
      style: "success",
    });
    expect(getStockStatusDisplay("LOW_STOCK").label).toBe("残りわずか");
    expect(getStockStatusDisplay("OUT_OF_STOCK").label).toBe("在庫なし");
  });

  it("maps zero-hit priority values to dashboard labels", () => {
    expect(getPriorityDisplay("HIGH")).toEqual({
      label: "高優先",
      style: "warning",
    });
    expect(getPriorityDisplay("MEDIUM").label).toBe("中優先");
    expect(getPriorityDisplay("LOW").label).toBe("低優先");
  });
});
