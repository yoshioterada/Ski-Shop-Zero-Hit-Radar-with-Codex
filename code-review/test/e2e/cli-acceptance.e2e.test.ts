import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AdjudicationExecutionResult,
  AgentDefinition,
  AgentReviewResult,
  Finding,
  ReviewJob
} from "../../src/agents/agent-types.js";
import { REQUIRED_AGENT_IDS } from "../../src/agents/agent-registry.js";
import type { AgentRunner } from "../../src/codex/agent-runner.js";
import { runCliWithDependencies } from "../../src/cli.js";
import { CliError } from "../../src/utils/errors.js";

const fixtureRoot = path.resolve("test/fixtures/java-spring-sample");

let tempRoot: string;
let repoRoot: string;
let docsDir: string;
let outputRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-acceptance-"));
  repoRoot = path.join(tempRoot, "repo");
  docsDir = path.join(repoRoot, "docs");
  outputRoot = path.join(tempRoot, "reports");

  fs.cpSync(fixtureRoot, repoRoot, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "orchest-code-review.agent.md"), "# Orchestrator");
  for (const id of REQUIRED_AGENT_IDS) {
    fs.writeFileSync(path.join(docsDir, `orchest-code-review-${id}.agent.md`), `# ${id}\n\nReview as ${id}.`);
  }
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("CLI acceptance E2E with fake runner", () => {
  it("generates 14 jobs for --target full --agents full", async () => {
    const output = await runDryRun(["--target", "full", "--agents", "full"]);

    expect(output).toContain(`Agents: ${REQUIRED_AGENT_IDS.join(", ")}`);
    expect(output).toContain("Target: full");
    expect(output).toContain("Jobs: 14");
  });

  it("generates one job for --target <path> --agents security", async () => {
    const output = await runDryRun([
      "--target",
      "src/main/java/com/example/controller/ProductController.java",
      "--agents",
      "security"
    ]);

    expect(output).toContain("Agents: security");
    expect(output).toContain("Target kind: file");
    expect(output).toContain("Jobs: 1");
  });

  it("uses only the specified target-dir files", async () => {
    const output = await runDryRun([
      "--target-dir",
      "src/main/java/com/example/controller",
      "--agents",
      "security"
    ]);

    expect(output).toContain("Target kind: directory");
    expect(output).toContain("Target name: controller");
    expect(output).toContain("src/main/java/com/example/controller/ProductController.java");
    expect(output).not.toContain("src/main/java/com/example/service/ProductService.java");
  });

  it("generates three jobs for three selected agents", async () => {
    const output = await runDryRun([
      "--target",
      "src/main/java/com/example/controller/ProductController.java",
      "--agents",
      "security,performance,data-access"
    ]);

    expect(output).toContain("Agents: security, performance, data-access");
    expect(output).toContain("Jobs: 3");
  });

  it("rejects simultaneous target and target-dir with exit code 2", async () => {
    await expectCliError(
      runCliWithDependencies(baseArgv(["--target", "full", "--target-dir", "src/main/java"]), {
        runner: new ScenarioRunner()
      }),
      2
    );
  });

  it("writes a report when one agent fails", async () => {
    const output = await runReview(["--target", "full", "--agents", "security,performance"], {
      runner: new ScenarioRunner({ failingAgents: ["performance"] })
    });

    expect(output.completedJobs).toBe(1);
    expect(output.failedJobs).toBe(1);
    expect(fs.existsSync(output.report)).toBe(true);
    expect(fs.existsSync(output.json)).toBe(true);
    expect(fs.existsSync(output.events)).toBe(true);
  });

  it("honors markdown and json format options", async () => {
    const markdown = await runReview(["--target", "full", "--agents", "security", "--format", "markdown"], {
      runner: new ScenarioRunner()
    });
    const json = await runReview(["--target", "full", "--agents", "security", "--format", "json"], {
      runner: new ScenarioRunner()
    });

    expect(fs.existsSync(markdown.report)).toBe(true);
    expect(fs.existsSync(markdown.json)).toBe(false);
    expect(fs.existsSync(markdown.events)).toBe(true);
    expect(fs.existsSync(json.report)).toBe(false);
    expect(fs.existsSync(json.json)).toBe(true);
    expect(fs.existsSync(json.events)).toBe(true);
  });

  it("calculates Critical, High, and Medium/Low verdicts", async () => {
    const critical = await runReview(["--target", "full", "--agents", "security"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "Critical" } })
    });
    const high = await runReview(["--target", "full", "--agents", "security"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "High" } })
    });
    const notes = await runReview(["--target", "full", "--agents", "security,performance"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "Medium", performance: "Low" } })
    });

    expect(critical.verdict).toBe("Rejected");
    expect(high.verdict).toBe("Conditional Approval");
    expect(notes.verdict).toBe("Approved with Notes");
  });

  it("executes Tech Lead adjudication when a conflict exists", async () => {
    const adjudicationCalls: ReviewJob[] = [];
    const output = await runReview(["--target", "full", "--agents", "security,performance"], {
      runner: new ScenarioRunner({
        conflictAgents: true
      }),
      adjudicationRunner: async (job) => {
        adjudicationCalls.push(job);
        return {
          job,
          status: "completed",
          summary: "Resolved conflict.",
          adjudications: [
            {
              conflictId: "conflict-1",
              decision: "prefer_a",
              finalSeverity: "High",
              finalFindingTitle: "Prefer strict validation",
              rationale: "Security takes precedence.",
              recommendedAction: "Apply strict validation."
            }
          ],
          escalations: []
        };
      }
    });
    const report = JSON.parse(fs.readFileSync(output.json, "utf8")) as { adjudications: unknown[] };

    expect(adjudicationCalls).toHaveLength(1);
    expect(adjudicationCalls[0]?.agentId).toBe("tech-lead-adjudication");
    expect(output.adjudications).toBe(1);
    expect(report.adjudications).toHaveLength(1);
  });

  it("increments report numbers without overwriting Markdown, JSON, or events files", async () => {
    const first = await runReview(["--target", "full", "--agents", "security"], {
      runner: new ScenarioRunner()
    });
    const second = await runReview(["--target", "full", "--agents", "security"], {
      runner: new ScenarioRunner()
    });

    expect(first.report).toContain("check-report-1.md");
    expect(second.report).toContain("check-report-2.md");
    expect(fs.existsSync(first.report)).toBe(true);
    expect(fs.existsSync(first.json)).toBe(true);
    expect(fs.existsSync(first.events)).toBe(true);
    expect(fs.existsSync(second.report)).toBe(true);
    expect(fs.existsSync(second.json)).toBe(true);
    expect(fs.existsSync(second.events)).toBe(true);
  });

  it("calculates fail-on exit codes", async () => {
    const failOnCritical = await runReview(["--target", "full", "--agents", "security", "--fail-on", "critical"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "Critical" } })
    });
    const failOnHigh = await runReview(["--target", "full", "--agents", "security", "--fail-on", "high"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "High" } })
    });
    const failOnNone = await runReview(["--target", "full", "--agents", "security", "--fail-on", "none"], {
      runner: new ScenarioRunner({ severityByAgent: { security: "Critical" } })
    });

    expect(failOnCritical.exitCode).toBe(1);
    expect(failOnHigh.exitCode).toBe(1);
    expect(failOnNone.exitCode).toBe(0);
  });

  it("returns exit code 4 when all agents fail", async () => {
    const output = await runReview(["--target", "full", "--agents", "security,performance"], {
      runner: new ScenarioRunner({ failingAgents: ["security", "performance"] })
    });

    expect(output.exitCode).toBe(4);
    expect(process.exitCode).toBe(4);
    expect(fs.existsSync(output.report)).toBe(true);
  });
});

async function runDryRun(args: string[]): Promise<string> {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await runCliWithDependencies(baseArgv([...args, "--dry-run"]), { runner: new ScenarioRunner() });
  return String(logSpy.mock.calls.at(-1)?.[0]);
}

async function runReview(args: string[], dependencies: {
  runner: AgentRunner;
  adjudicationRunner?: (job: ReviewJob) => Promise<AdjudicationExecutionResult>;
}): Promise<{
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  verdict: string;
  exitCode: number;
  adjudications: number;
  report: string;
  json: string;
  events: string;
}> {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await runCliWithDependencies(baseArgv(args), dependencies);
  return JSON.parse(String(logSpy.mock.calls.at(-1)?.[0])) as {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    verdict: string;
    exitCode: number;
    adjudications: number;
    report: string;
    json: string;
    events: string;
  };
}

function baseArgv(args: string[]): string[] {
  return [
    "node",
    "code-review",
    ...args,
    "--repo",
    repoRoot,
    "--docs",
    docsDir,
    "--out",
    outputRoot
  ];
}

async function expectCliError(promise: Promise<unknown>, exitCode: number): Promise<void> {
  try {
    await promise;
    throw new Error("Expected CLI to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(exitCode);
  }
}

class ScenarioRunner implements AgentRunner {
  private readonly failingAgents: Set<string>;
  private readonly severityByAgent: Record<string, Finding["severity"]>;
  private readonly conflictAgents: boolean;

  constructor(options: {
    failingAgents?: string[];
    severityByAgent?: Record<string, Finding["severity"]>;
    conflictAgents?: boolean;
  } = {}) {
    this.failingAgents = new Set(options.failingAgents ?? []);
    this.severityByAgent = options.severityByAgent ?? {};
    this.conflictAgents = options.conflictAgents ?? false;
  }

  async run(job: ReviewJob): Promise<AgentReviewResult> {
    if (this.failingAgents.has(job.agentId)) {
      throw new Error(`Forced failure for ${job.agentId}`);
    }

    const finding = this.buildFinding(job);
    const now = new Date().toISOString();
    return {
      agentId: job.agentId,
      threadId: `thread-${job.agentId}`,
      status: "completed",
      verdict: finding ? "warning" : "pass",
      summary: finding ? `Finding from ${job.agentId}.` : `No findings from ${job.agentId}.`,
      findings: finding ? [finding] : [],
      escalations: [],
      designDeviations: [],
      score: finding ? 70 : 100,
      usage: {
        inputTokens: 100,
        cachedInputTokens: 10,
        outputTokens: 50,
        reasoningOutputTokens: 5
      },
      rawMarkdown: `## ${job.agentId}`,
      startedAt: now,
      completedAt: now,
      durationMs: 1
    };
  }

  private buildFinding(job: ReviewJob): Finding | null {
    if (this.conflictAgents && (job.agentId === "security" || job.agentId === "performance")) {
      return findingForAgent(job.agentId, "High", job.agentDefinition);
    }

    const severity = this.severityByAgent[job.agentId];
    return severity ? findingForAgent(job.agentId, severity, job.agentDefinition) : null;
  }
}

function findingForAgent(agentId: string, severity: Finding["severity"], definition: AgentDefinition): Finding {
  const isPerformance = agentId === "performance";
  return {
    id: "",
    severity,
    category: definition.id,
    title: isPerformance ? "Relax request limit" : "Add strict request limit",
    description: isPerformance
      ? "Relax throttling because strict limits increase latency."
      : "Add strict throttling to protect the endpoint.",
    targetFile: "src/main/java/com/example/controller/ProductController.java",
    lineStart: 12,
    suggestedFix: isPerformance ? "Relax the request limit." : "Add a strict request limit.",
    sourceAgents: [],
    confidence: "high"
  };
}
