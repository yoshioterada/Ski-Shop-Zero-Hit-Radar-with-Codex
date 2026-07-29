import { apiRequest } from "@/lib/api/client";
import { parseAiConsultResponse } from "@/lib/api/validators";
import type { AiConsultRequest, AiConsultResponse } from "@/types/api";

/** Sends an admin AI sourcing question for a selected zero-hit keyword. */
export async function consultAi(
  token: string,
  request: AiConsultRequest,
): Promise<AiConsultResponse> {
  const payload = await apiRequest<unknown>("/api/admin/ai-consult", {
    method: "POST",
    body: request,
    token,
  });

  return parseAiConsultResponse(payload);
}
