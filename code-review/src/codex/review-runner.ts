import type { ThreadEvent, ThreadItem, Usage } from "@openai/codex-sdk";

import type {
  AgentReviewResult,
  DesignDeviation,
  EscalationItem,
  Finding,
  ReviewJob,
  UsageMetrics
} from "../agents/agent-types.js";
import { parseAgentReviewJson } from "../results/review-schema.js";
import type { AgentReviewOutput } from "../results/review-schema.js";

import type { AgentRunner } from "./agent-runner.js";
import { createTimeoutController } from "./timeout.js";

export class CodexReviewRunner implements AgentRunner {
  async run(job: ReviewJob): Promise<AgentReviewResult> {
    return runSingleAgentReview(job);
  }
}

/** Runs one specialist review in a fresh Codex thread and normalizes stream events. */
export async function runSingleAgentReview(job: ReviewJob): Promise<AgentReviewResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const timeout = createTimeoutController(job.timeoutMs);
  let threadId: string | undefined;
  let finalResponse = "";
  let usage: Usage | null = null;
  const items: ThreadItem[] = [];

  try {
    if (!job.codex || !job.threadOptions) {
      throw new Error("ReviewJob requires codex and threadOptions for CodexReviewRunner");
    }

    const thread = job.codex.startThread(job.threadOptions);
    const { events } = await thread.runStreamed(job.prompt, {
      outputSchema: job.outputSchema,
      signal: timeout.signal
    });

    for await (const event of events) {
      threadId = extractThreadId(event, thread.id ?? threadId);
      await job.eventSink?.(job.agentId, event);

      if (event.type === "item.completed") {
        items.push(event.item);
        if (event.item.type === "agent_message") {
          finalResponse = event.item.text;
        }
      } else if (event.type === "turn.completed") {
        usage = event.usage;
      } else if (event.type === "turn.failed") {
        throw new Error(event.error.message);
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }

    const parsed = parseAgentReviewJson(finalResponse);
    return normalizeAgentReviewResult({
      agentId: job.agentId,
      threadId,
      parsed,
      usage,
      rawMarkdown: parsed.rawMarkdown,
      startedAt,
      startedAtMs
    });
  } catch (error) {
    return normalizeAgentFailure({
      agentId: job.agentId,
      threadId,
      error,
      rawMarkdown: finalResponse,
      status: timeout.didTimeout() ? "timeout" : "error",
      startedAt,
      startedAtMs
    });
  } finally {
    timeout.dispose();
  }
}

function normalizeAgentReviewResult(input: {
  agentId: string;
  threadId?: string;
  parsed: AgentReviewOutput;
  usage: Usage | null;
  rawMarkdown: string;
  startedAt: string;
  startedAtMs: number;
}): AgentReviewResult {
  return {
    agentId: input.agentId,
    threadId: input.threadId,
    status: "completed",
    verdict: input.parsed.verdict,
    summary: input.parsed.summary,
    findings: input.parsed.findings.map((finding, index) => normalizeFinding(input.agentId, finding, index)),
    escalations: input.parsed.escalations.map((escalation) => normalizeEscalation(input.agentId, escalation)),
    designDeviations: input.parsed.designDeviations.map((deviation) => normalizeDesignDeviation(deviation)),
    score: input.parsed.score,
    usage: input.usage ? normalizeUsage(input.usage) : undefined,
    rawMarkdown: input.rawMarkdown,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - input.startedAtMs
  };
}

function normalizeAgentFailure(input: {
  agentId: string;
  threadId?: string;
  error: unknown;
  rawMarkdown: string;
  status: "timeout" | "error";
  startedAt: string;
  startedAtMs: number;
}): AgentReviewResult {
  const errorMessage = input.error instanceof Error ? input.error.message : String(input.error);

  return {
    agentId: input.agentId,
    threadId: input.threadId,
    status: input.status,
    verdict: "incomplete",
    summary: input.status === "timeout" ? "Codex review timed out." : "Codex review failed.",
    findings: [],
    escalations: [],
    designDeviations: [],
    rawMarkdown: input.rawMarkdown,
    errorMessage,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - input.startedAtMs
  };
}

function normalizeFinding(
  agentId: string,
  finding: AgentReviewOutput["findings"][number],
  index: number
): Finding {
  return {
    id: `${agentId}-${index + 1}`,
    severity: finding.severity,
    category: finding.category,
    title: finding.title,
    description: finding.description,
    targetFile: finding.targetFile,
    lineStart: finding.lineStart,
    lineEnd: finding.lineEnd,
    evidence: finding.evidence,
    suggestedFix: finding.suggestedFix,
    sourceAgents: [agentId],
    confidence: finding.confidence
  };
}

function normalizeEscalation(
  agentId: string,
  escalation: AgentReviewOutput["escalations"][number]
): EscalationItem {
  return {
    priority: escalation.priority,
    sourceAgents: [agentId],
    description: escalation.description,
    recommendedDecisionMaker: escalation.recommendedDecisionMaker
  };
}

function normalizeDesignDeviation(deviation: AgentReviewOutput["designDeviations"][number]): DesignDeviation {
  return {
    document: deviation.document,
    description: deviation.description,
    targetFile: deviation.targetFile
  };
}

function normalizeUsage(usage: Usage): UsageMetrics {
  return {
    inputTokens: usage.input_tokens,
    cachedInputTokens: usage.cached_input_tokens,
    outputTokens: usage.output_tokens,
    reasoningOutputTokens: usage.reasoning_output_tokens
  };
}

function extractThreadId(event: ThreadEvent, fallback?: string | null): string | undefined {
  if (event.type === "thread.started") {
    return event.thread_id;
  }

  return fallback ?? undefined;
}
