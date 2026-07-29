import type { AgentReviewResult, ReviewJob } from "../agents/agent-types.js";
import { parseAgentReviewJson } from "../results/review-schema.js";

import type { AgentRunner } from "./agent-runner.js";

export interface FakeReviewRunnerOptions {
  delayMs?: number;
  failingAgentIds?: readonly string[];
  invalidJsonAgentIds?: readonly string[];
}

export class FakeReviewRunner implements AgentRunner {
  private readonly delayMs: number;
  private readonly failingAgentIds: Set<string>;
  private readonly invalidJsonAgentIds: Set<string>;

  constructor(options: FakeReviewRunnerOptions = {}) {
    this.delayMs = options.delayMs ?? 0;
    this.failingAgentIds = new Set(options.failingAgentIds ?? []);
    this.invalidJsonAgentIds = new Set(options.invalidJsonAgentIds ?? []);
  }

  async run(job: ReviewJob): Promise<AgentReviewResult> {
    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failingAgentIds.has(job.agentId)) {
      throw new Error(`Fake runner forced failure for ${job.agentId}`);
    }

    const rawJson = this.invalidJsonAgentIds.has(job.agentId)
      ? "{ invalid json"
      : JSON.stringify({
          verdict: "pass",
          summary: `Fake review completed for ${job.agentId}.`,
          findings: [],
          escalations: [],
          designDeviations: [],
          score: 100,
          rawMarkdown: `## ${job.agentDefinition.displayName}\n\nFake review completed.`
        });

    try {
      const parsed = parseAgentReviewJson(rawJson);
      return {
        agentId: job.agentId,
        status: "completed",
        verdict: parsed.verdict,
        summary: parsed.summary,
        findings: [],
        escalations: [],
        designDeviations: [],
        score: parsed.score,
        rawMarkdown: parsed.rawMarkdown,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAtMs
      };
    } catch (error) {
      return {
        agentId: job.agentId,
        status: "error",
        verdict: "incomplete",
        summary: "Fake runner returned invalid JSON.",
        findings: [],
        escalations: [],
        designDeviations: [],
        rawMarkdown: rawJson,
        errorMessage: error instanceof Error ? error.message : String(error),
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAtMs
      };
    }
  }
}
