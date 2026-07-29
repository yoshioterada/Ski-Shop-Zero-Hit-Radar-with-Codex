import type { Codex, ThreadOptions } from "@openai/codex-sdk";

import type {
  AgentDefinition,
  AgentReviewResult,
  AppOptions,
  Conflict,
  ReviewExecutionPlan,
  ReviewExecutionResult,
  ReviewJob,
  ReviewRunSummary,
  ReviewTarget
} from "./agents/agent-types.js";
import type { AgentRunner } from "./codex/agent-runner.js";
import { runWithConcurrency } from "./codex/concurrency.js";
import { buildAdjudicationPrompt } from "./prompts/adjudication-prompt-builder.js";
import { buildReviewPrompt } from "./prompts/review-prompt-builder.js";
import { adjudicationOutputSchema, agentReviewOutputSchema } from "./results/review-schema.js";

export interface CreateExecutionPlanInput {
  target: ReviewTarget;
  agents: AgentDefinition[];
  options: AppOptions;
}

/** Creates prompt-bearing jobs without binding them to any concrete runner. */
export function createExecutionPlan(input: CreateExecutionPlanInput): ReviewExecutionPlan {
  const jobs = input.agents.map((agentDefinition): ReviewJob => ({
    agentId: agentDefinition.id,
    agentDefinition,
    prompt: buildReviewPrompt({ agentDefinition, target: input.target }),
    outputSchema: agentReviewOutputSchema,
    timeoutMs: input.options.timeoutMs
  }));

  return {
    target: input.target,
    agents: input.agents,
    jobs,
    concurrency: input.options.concurrency,
    outputRoot: input.options.outputRoot,
    dryRun: input.options.dryRun
  };
}

/** Adds SDK client/thread options to every job immediately before Codex execution. */
export function attachCodexRuntime(
  plan: ReviewExecutionPlan,
  codex: Codex,
  threadOptions: ThreadOptions
): ReviewExecutionPlan {
  return {
    ...plan,
    jobs: plan.jobs.map((job) => ({
      ...job,
      codex,
      threadOptions
    }))
  };
}

/** Creates a separate Tech Lead adjudication job only when conflicts exist. */
export function createTechLeadAdjudicationJob(input: {
  techLeadDefinition: AgentDefinition;
  target: ReviewTarget;
  conflicts: readonly Conflict[];
  options: AppOptions;
}): ReviewJob | null {
  if (input.conflicts.length === 0) {
    return null;
  }

  return {
    agentId: "tech-lead-adjudication",
    agentDefinition: input.techLeadDefinition,
    prompt: buildAdjudicationPrompt({
      techLeadDefinition: input.techLeadDefinition,
      target: input.target,
      conflicts: [...input.conflicts]
    }),
    outputSchema: adjudicationOutputSchema,
    timeoutMs: input.options.timeoutMs
  };
}

export function attachCodexRuntimeToJob(
  job: ReviewJob,
  codex: Codex,
  threadOptions: ThreadOptions
): ReviewJob {
  return {
    ...job,
    codex,
    threadOptions
  };
}

export async function executeReviewPlan(
  plan: ReviewExecutionPlan,
  runner: AgentRunner
): Promise<ReviewExecutionResult> {
  const settledResults = await runWithConcurrency(plan.jobs, plan.concurrency, async (job) => runner.run(job));
  const results = settledResults.map((settledResult) => {
    if (settledResult.status === "fulfilled") {
      return settledResult.value;
    }

    return buildFailedResult(plan.jobs[settledResult.index] as ReviewJob, settledResult.reason);
  });

  return {
    plan,
    results,
    summary: summarizeResults(results)
  };
}

export function formatDryRunPlan(plan: ReviewExecutionPlan): string {
  return [
    "Code Review Execution Plan",
    "",
    `Agents: ${plan.agents.map((agent) => agent.id).join(", ")}`,
    `Target: ${plan.target.rawTarget}`,
    `Target kind: ${plan.target.targetKind}`,
    `Target name: ${plan.target.targetName}`,
    `Files: ${plan.target.files.length}`,
    ...plan.target.files.map((filePath) => `- ${filePath}`),
    `Concurrency: ${plan.concurrency}`,
    `Output root: ${plan.outputRoot}`,
    `Jobs: ${plan.jobs.length}`
  ].join("\n");
}

export function summarizeResults(results: readonly AgentReviewResult[]): ReviewRunSummary {
  const completedJobs = results.filter((result) => result.status === "completed").length;
  const failedJobs = results.filter((result) => result.status === "error").length;
  const timedOutJobs = results.filter((result) => result.status === "timeout").length;

  return {
    totalJobs: results.length,
    completedJobs,
    failedJobs,
    timedOutJobs,
    allJobsFailed: results.length > 0 && completedJobs === 0
  };
}

function buildFailedResult(job: ReviewJob, reason: unknown): AgentReviewResult {
  const timestamp = new Date().toISOString();

  return {
    agentId: job.agentId,
    status: "error",
    verdict: "incomplete",
    summary: `Agent job failed: ${job.agentId}`,
    findings: [],
    escalations: [],
    designDeviations: [],
    errorMessage: reason instanceof Error ? reason.message : String(reason),
    startedAt: timestamp,
    completedAt: timestamp,
    durationMs: 0
  };
}
