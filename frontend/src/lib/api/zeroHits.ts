import { apiRequest } from "@/lib/api/client";
import { parseZeroHitListResponse } from "@/lib/api/validators";
import type { ZeroHitListResponse } from "@/types/api";

export type ZeroHitSort = "lastSearchedAt,desc" | "hitCount,desc" | "priority,desc";

export type ZeroHitListParams = {
  days?: 7 | 30 | 90;
  sort?: ZeroHitSort;
  limit?: number;
};

/** Fetches the protected Zero Hit Radar keyword list and summary metrics. */
export async function listZeroHits(
  token: string,
  params: ZeroHitListParams = {},
): Promise<ZeroHitListResponse> {
  const payload = await apiRequest<unknown>("/api/admin/zero-hits", {
    query: params,
    token,
  });

  return parseZeroHitListResponse(payload);
}
