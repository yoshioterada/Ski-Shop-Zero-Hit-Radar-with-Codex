import type { ZeroHitPriority } from "@/types/api";

export type StockStatusStyle = "success" | "warning" | "muted";

export type StatusDisplay = {
  label: string;
  style: StockStatusStyle;
};

const stockStatusDisplays = {
  IN_STOCK: { label: "在庫あり", style: "success" },
  LOW_STOCK: { label: "残りわずか", style: "warning" },
  OUT_OF_STOCK: { label: "在庫なし", style: "muted" },
} as const satisfies Record<string, StatusDisplay>;

const priorityDisplays = {
  HIGH: { label: "高優先", style: "warning" },
  MEDIUM: { label: "中優先", style: "success" },
  LOW: { label: "低優先", style: "muted" },
} as const satisfies Record<ZeroHitPriority, StatusDisplay>;

/** Maps backend stockStatus values into Japanese labels for product cards. */
export function getStockStatusDisplay(stockStatus: string): StatusDisplay {
  if (isKnownStockStatus(stockStatus)) {
    return stockStatusDisplays[stockStatus];
  }

  return {
    label: stockStatus,
    style: "muted",
  };
}

/** Maps Zero Hit priority values into compact Japanese dashboard labels. */
export function getPriorityDisplay(priority: ZeroHitPriority): StatusDisplay {
  return priorityDisplays[priority];
}

function isKnownStockStatus(
  stockStatus: string,
): stockStatus is keyof typeof stockStatusDisplays {
  return Object.hasOwn(stockStatusDisplays, stockStatus);
}
