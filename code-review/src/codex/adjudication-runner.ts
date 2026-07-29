import type { AdjudicationExecutionResult, AdjudicationResult, ReviewJob } from "../agents/agent-types.js";
import { parseAdjudicationJson } from "../results/review-schema.js";
import type { AdjudicationOutput } from "../results/review-schema.js";

import { createTimeoutController } from "./timeout.js";

/** Runs the Tech Lead conflict adjudication turn and validates its structured output. */
export async function runTechLeadAdjudication(job: ReviewJob): Promise<AdjudicationExecutionResult> {
  const timeout = createTimeoutController(job.timeoutMs);
  let finalResponse = "";

  try {
    if (!job.codex || !job.threadOptions) {
      throw new Error("ReviewJob requires codex and threadOptions for Tech Lead adjudication");
    }

    const thread = job.codex.startThread(job.threadOptions);
    const { events } = await thread.runStreamed(job.prompt, {
      outputSchema: job.outputSchema,
      signal: timeout.signal
    });

    for await (const event of events) {
      await job.eventSink?.(job.agentId, event);

      if (event.type === "item.completed" && event.item.type === "agent_message") {
        finalResponse = event.item.text;
      } else if (event.type === "turn.failed") {
        throw new Error(event.error.message);
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }

    const parsed = parseAdjudicationJson(finalResponse);
    return {
      job,
      adjudications: normalizeAdjudications(parsed),
      escalations: [],
      status: "completed",
      summary: parsed.summary || `Tech Lead adjudicated ${parsed.adjudications.length} conflict(s).`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      job,
      adjudications: [],
      escalations: [
        {
          priority: "highest",
          sourceAgents: [job.agentDefinition.id],
          description: `Tech Lead adjudication failed: ${message}`,
          recommendedDecisionMaker: "Human Tech Lead"
        }
      ],
      status: "error",
      summary: timeout.didTimeout() ? "Tech Lead adjudication timed out." : "Tech Lead adjudication failed."
    };
  } finally {
    timeout.dispose();
  }
}

function normalizeAdjudications(parsed: AdjudicationOutput): AdjudicationResult[] {
  return parsed.adjudications.map((adjudication) => ({
    conflictId: adjudication.conflictId,
    decision: adjudication.decision,
    finalSeverity: adjudication.finalSeverity,
    finalFindingTitle: adjudication.finalFindingTitle,
    rationale: adjudication.rationale,
    recommendedAction: adjudication.recommendedAction
  }));
}
