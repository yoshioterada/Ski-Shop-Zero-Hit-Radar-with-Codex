#!/usr/bin/env node

import { createCli, parseAppOptionsFromArgv } from "./cli-options.js";
import { loadAgentDefinitions } from "./agents/agent-definition-loader.js";
import { AgentRegistry } from "./agents/agent-registry.js";
import type { AgentRunner } from "./codex/agent-runner.js";
import { buildThreadOptions, createCodexClient } from "./codex/codex-client-factory.js";
import { FakeReviewRunner } from "./codex/fake-review-runner.js";
import { CodexReviewRunner } from "./codex/review-runner.js";
import { runTechLeadAdjudication } from "./codex/adjudication-runner.js";
import {
  attachCodexRuntime,
  attachCodexRuntimeToJob,
  createExecutionPlan,
  createTechLeadAdjudicationJob,
  executeReviewPlan,
  formatDryRunPlan
} from "./orchestrator.js";
import { writeReport } from "./reports/report-writer.js";
import type { EventLogEntry } from "./reports/event-log-writer.js";
import { applyAdjudicationOutcome, integrateReviewResults } from "./results/review-result-integrator.js";
import { resolveTarget } from "./targets/target-resolver.js";
import { CliError } from "./utils/errors.js";
import type { AdjudicationExecutionResult, ReviewEventSink, ReviewJob } from "./agents/agent-types.js";

export { createCli, parseAppOptionsFromArgv };

export interface CliDependencies {
  runner?: AgentRunner;
  adjudicationRunner?: (job: ReviewJob) => Promise<AdjudicationExecutionResult>;
  useCodexRuntime?: boolean;
}

/** Runs the production CLI path with Codex SDK-backed agent execution. */
export async function runCli(argv: string[]): Promise<void> {
  await runCliWithDependencies(argv, {
    runner: new CodexReviewRunner(),
    adjudicationRunner: runTechLeadAdjudication,
    useCodexRuntime: true
  });
}

/**
 * Runs the CLI with injectable runners so tests can exercise the orchestration
 * without starting real Codex SDK subprocesses.
 */
export async function runCliWithDependencies(argv: string[], dependencies: CliDependencies = {}): Promise<void> {
  const program = createCli();
  program.action(async () => {
    const options = parseAppOptionsFromArgv(argv.slice(2));
    const loaded = await loadAgentDefinitions(options.docsDir);
    const registry = new AgentRegistry(loaded.agents);
    const agents = registry.resolveSelection(options.selectedAgents);
    const targetResolution = await resolveTarget(options);
    options.additionalDirectories = targetResolution.additionalDirectories;
    const plan = createExecutionPlan({ target: targetResolution.target, agents, options });

    if (options.dryRun) {
      console.log(formatDryRunPlan(plan));
      return;
    }

    const useCodexRuntime = dependencies.useCodexRuntime ?? false;
    const codex = useCodexRuntime ? createCodexClient(options) : undefined;
    const threadOptions = useCodexRuntime ? buildThreadOptions(options) : undefined;
    const runnablePlan = codex && threadOptions ? attachCodexRuntime(plan, codex, threadOptions) : plan;
    const events: EventLogEntry[] = [];
    const eventSink: ReviewEventSink = (agentId, event) => {
      events.push({ agentId, recordedAt: new Date().toISOString(), event });
    };
    const runnablePlanWithEvents = {
      ...runnablePlan,
      jobs: runnablePlan.jobs.map((job) => ({
        ...job,
        eventSink
      }))
    };
    const runner = dependencies.runner ?? new FakeReviewRunner();
    const result = await executeReviewPlan(runnablePlanWithEvents, runner);
    let outcome = integrateReviewResults({ results: result.results, failOn: options.failOn });

    const adjudicationJob = createTechLeadAdjudicationJob({
      techLeadDefinition: registry.get("tech-lead"),
      target: targetResolution.target,
      conflicts: outcome.conflicts,
      options
    });
    if (adjudicationJob) {
      const runnableAdjudicationJob = codex && threadOptions
        ? attachCodexRuntimeToJob(adjudicationJob, codex, threadOptions)
        : adjudicationJob;
      const adjudication = await (dependencies.adjudicationRunner ?? runTechLeadAdjudication)({
        ...runnableAdjudicationJob,
        eventSink
      });
      outcome = applyAdjudicationOutcome(outcome, adjudication);
    }

    const reportResult = await writeReport({
      target: targetResolution.target,
      verdict: outcome.verdict,
      agents: agents.map((agent) => agent.id),
      results: outcome.results,
      findings: outcome.findings,
      conflicts: outcome.conflicts,
      adjudications: outcome.adjudications,
      escalations: outcome.escalations,
      sdkExecution: {
        sdkPackage: "@openai/codex-sdk",
        concurrency: options.concurrency,
        sandboxMode: options.sandboxMode ?? "read-only",
        approvalPolicy: "never",
        webSearchMode: options.webSearchMode ?? "disabled",
        model: options.model,
        modelReasoningEffort: options.modelReasoningEffort
      },
      outputRoot: options.outputRoot,
      format: options.format,
      events
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new CliError(`Failed to write report: ${message}`, 5);
    });

    process.exitCode = outcome.exitCode;
    console.log(JSON.stringify({
      ...result.summary,
      verdict: outcome.verdict,
      exitCode: outcome.exitCode,
      adjudications: outcome.adjudications.length,
      report: reportResult.paths.markdown,
      json: reportResult.paths.json,
      events: reportResult.paths.events
    }, null, 2));
  });
  await program.parseAsync(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runCli(process.argv);
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
    } else {
      throw error;
    }
  }
}
