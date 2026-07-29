import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AgentDefinition, AppOptions, ReviewTarget } from "../../src/agents/agent-types.js";
import { REQUIRED_AGENT_IDS } from "../../src/agents/agent-registry.js";
import { FakeReviewRunner } from "../../src/codex/fake-review-runner.js";
import {
  attachCodexRuntime,
  attachCodexRuntimeToJob,
  createExecutionPlan,
  createTechLeadAdjudicationJob,
  executeReviewPlan,
  formatDryRunPlan
} from "../../src/orchestrator.js";

describe("orchestrator with fake runner", () => {
  it("builds and executes a single-agent fake review", async () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security")],
      options: options()
    });

    const result = await executeReviewPlan(plan, new FakeReviewRunner());

    expect(plan.jobs).toHaveLength(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.agentId).toBe("security");
    expect(result.results[0]?.status).toBe("completed");
    expect(result.summary.completedJobs).toBe(1);
  });

  it("builds and executes multiple fake reviews", async () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security"), agent("performance")],
      options: options()
    });

    const result = await executeReviewPlan(plan, new FakeReviewRunner());

    expect(plan.jobs.map((job) => job.agentId)).toEqual(["security", "performance"]);
    expect(result.summary).toMatchObject({
      totalJobs: 2,
      completedJobs: 2,
      failedJobs: 0,
      allJobsFailed: false
    });
  });

  it("builds 14 jobs for full agent selection", () => {
    const allAgents = REQUIRED_AGENT_IDS.map((id) => agent(id));
    const plan = createExecutionPlan({
      target: target(),
      agents: allAgents,
      options: options()
    });

    expect(plan.agents).toHaveLength(14);
    expect(plan.jobs).toHaveLength(14);
    expect(plan.jobs.map((job) => job.agentId)).toEqual([...REQUIRED_AGENT_IDS]);
  });

  it("can simulate invalid JSON from an agent", async () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security")],
      options: options()
    });

    const result = await executeReviewPlan(
      plan,
      new FakeReviewRunner({ invalidJsonAgentIds: ["security"] })
    );

    expect(result.results[0]?.status).toBe("error");
    expect(result.results[0]?.verdict).toBe("incomplete");
    expect(result.summary.allJobsFailed).toBe(true);
  });

  it("keeps running when one job throws", async () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security"), agent("performance"), agent("test-quality")],
      options: options({ concurrency: 2 })
    });

    const result = await executeReviewPlan(
      plan,
      new FakeReviewRunner({ failingAgentIds: ["performance"] })
    );

    expect(result.results.map((reviewResult) => reviewResult.status)).toEqual([
      "completed",
      "error",
      "completed"
    ]);
    expect(result.summary).toMatchObject({
      totalJobs: 3,
      completedJobs: 2,
      failedJobs: 1,
      allJobsFailed: false
    });
  });

  it("detects when all jobs fail", async () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security"), agent("performance")],
      options: options()
    });

    const result = await executeReviewPlan(
      plan,
      new FakeReviewRunner({ failingAgentIds: ["security", "performance"] })
    );

    expect(result.summary).toMatchObject({
      totalJobs: 2,
      completedJobs: 0,
      failedJobs: 2,
      allJobsFailed: true
    });
  });

  it("formats dry-run output with agents, target, files, and concurrency", () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security"), agent("performance")],
      options: options({ dryRun: true, concurrency: 7 })
    });

    const output = formatDryRunPlan(plan);

    expect(output).toContain("Agents: security, performance");
    expect(output).toContain("Target: src/main/java/com/skishop/controller");
    expect(output).toContain("Files: 1");
    expect(output).toContain("src/main/java/com/skishop/controller/ProductController.java");
    expect(output).toContain("Concurrency: 7");
  });

  it("attaches Codex runtime details to every job", () => {
    const plan = createExecutionPlan({
      target: target(),
      agents: [agent("security"), agent("performance")],
      options: options()
    });
    const codex = {} as never;
    const threadOptions = { workingDirectory: "/repo", sandboxMode: "read-only" } as const;

    const sdkPlan = attachCodexRuntime(plan, codex, threadOptions);

    expect(sdkPlan.jobs).toHaveLength(2);
    expect(sdkPlan.jobs.every((job) => job.codex === codex)).toBe(true);
    expect(sdkPlan.jobs.every((job) => job.threadOptions === threadOptions)).toBe(true);
  });

  it("skips Tech Lead adjudication job when there are no conflicts", () => {
    const job = createTechLeadAdjudicationJob({
      techLeadDefinition: agent("tech-lead"),
      target: target(),
      conflicts: [],
      options: options()
    });

    expect(job).toBeNull();
  });

  it("creates one separate Tech Lead adjudication job when conflicts exist", () => {
    const job = createTechLeadAdjudicationJob({
      techLeadDefinition: agent("tech-lead"),
      target: target(),
      conflicts: [
        {
          id: "conflict-1",
          agentA: "security",
          agentB: "performance",
          findingA: finding("security"),
          findingB: finding("performance"),
          pattern: "restrictions_vs_relaxation",
          description: "Security and performance recommendations conflict."
        }
      ],
      options: options()
    });

    expect(job).not.toBeNull();
    expect(job?.agentId).toBe("tech-lead-adjudication");
    expect(job?.agentDefinition.id).toBe("tech-lead");
    expect(job?.outputSchema).toBeDefined();
    expect(job?.prompt).toContain("\"id\": \"conflict-1\"");

    const codex = {} as never;
    const threadOptions = { workingDirectory: "/repo", sandboxMode: "read-only" } as const;
    const runtimeJob = attachCodexRuntimeToJob(job!, codex, threadOptions);

    expect(runtimeJob.codex).toBe(codex);
    expect(runtimeJob.threadOptions).toBe(threadOptions);
  });
});

function agent(id: string): AgentDefinition {
  return {
    id,
    displayName: `orchest-code-review-${id}`,
    filePath: path.join("/repo/docs", `orchest-code-review-${id}.agent.md`),
    description: "",
    bodyMarkdown: `# ${id}\n\nReview from ${id} perspective.`,
    isTechLead: id === "tech-lead"
  };
}

function target(): ReviewTarget {
  return {
    rawTarget: "src/main/java/com/skishop/controller",
    targetKind: "directory",
    targetName: "controller",
    repoRoot: "/repo",
    files: ["src/main/java/com/skishop/controller/ProductController.java"],
    standardsFiles: ["AGENTS.md"],
    designReferenceFiles: ["design-docs/api.md"]
  };
}

function options(overrides: Partial<AppOptions> = {}): AppOptions {
  return {
    repoRoot: "/repo",
    docsDir: "/repo/docs",
    outputRoot: "/repo/review-reports",
    rawTarget: "src/main/java/com/skishop/controller",
    selectedAgents: ["security"],
    concurrency: 2,
    timeoutMs: 1000,
    format: "markdown",
    failOn: "none",
    skipGitRepoCheck: false,
    dryRun: false,
    verbose: false,
    ...overrides
  };
}

function finding(agentId: string) {
  return {
    id: `${agentId}-finding`,
    severity: "High" as const,
    category: "review",
    title: agentId === "security" ? "Add strict limit" : "Relax limit",
    description: agentId === "security" ? "Add strict limit." : "Relax limit.",
    targetFile: "src/main/java/com/skishop/controller/ProductController.java",
    lineStart: 10,
    sourceAgents: [agentId],
    confidence: "high" as const
  };
}
