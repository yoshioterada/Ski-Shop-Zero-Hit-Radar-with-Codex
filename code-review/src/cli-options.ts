import fs from "node:fs";
import path from "node:path";
import { Command, Option } from "commander";

import type { AppOptions } from "./agents/agent-types.js";
import {
  DEFAULT_AGENTS,
  DEFAULT_CONCURRENCY,
  DEFAULT_FAIL_ON,
  DEFAULT_FORMAT,
  DEFAULT_REASONING,
  DEFAULT_SANDBOX,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_WEB_SEARCH
} from "./config/defaults.js";
import { CliError } from "./utils/errors.js";
import { defaultDocsDir, defaultOutputRoot, resolveFrom } from "./utils/path-utils.js";

type RawCliOptions = {
  target?: string;
  targetDir?: string;
  agents: string;
  repo: string;
  docs?: string;
  out?: string;
  concurrency: string;
  timeoutMs: string;
  model?: string;
  reasoning: string;
  sandbox: string;
  webSearch: string;
  format: string;
  failOn: string;
  skipGitRepoCheck: boolean;
  dryRun: boolean;
  verbose: boolean;
};

const reasoningValues = ["minimal", "low", "medium", "high", "xhigh"] as const;
const sandboxValues = ["read-only", "workspace-write", "danger-full-access"] as const;
const webSearchValues = ["disabled", "cached", "live"] as const;
const formatValues = ["markdown", "json", "both"] as const;
const failOnValues = ["critical", "high", "none"] as const;

export function createCli(): Command {
  const program = new Command();

  program
    .name("code-review")
    .description("Codex SDK Java Code Review Orchestrator")
    .version("0.1.0")
    .option("--target <path|full>", "review target: full, file path, or directory path")
    .option("--target-dir <directory>", "review target directory")
    .option("--agents <name[,name]|full>", "agents to run", DEFAULT_AGENTS)
    .option("--repo <path>", "repository root", process.cwd())
    .option("--docs <path>", "agent definition directory")
    .option("--out <path>", "report output root")
    .option("--concurrency <number>", "maximum parallel agent reviews", String(DEFAULT_CONCURRENCY))
    .option("--timeout-ms <number>", "timeout per agent in milliseconds", String(DEFAULT_TIMEOUT_MS))
    .option("--model <model>", "Codex model")
    .addOption(
      new Option("--reasoning <minimal|low|medium|high|xhigh>", "model reasoning effort")
        .default(DEFAULT_REASONING)
    )
    .addOption(
      new Option("--sandbox <read-only|workspace-write|danger-full-access>", "Codex sandbox mode")
        .default(DEFAULT_SANDBOX)
    )
    .addOption(
      new Option("--web-search <disabled|cached|live>", "Codex web search mode")
        .default(DEFAULT_WEB_SEARCH)
    )
    .addOption(
      new Option("--format <markdown|json|both>", "report output format")
        .default(DEFAULT_FORMAT)
    )
    .addOption(
      new Option("--fail-on <critical|high|none>", "minimum severity that returns exit code 1")
        .default(DEFAULT_FAIL_ON)
    )
    .option("--skip-git-repo-check", "skip Codex git repository check", false)
    .option("--dry-run", "print execution plan without running reviews", false)
    .option("--verbose", "print verbose logs", false);

  return program;
}

export function parseAppOptionsFromArgv(argv: string[]): AppOptions {
  const program = createCli();
  program.exitOverride();
  program.parse(argv, { from: "user" });
  return rawOptionsToAppOptions(program.opts<RawCliOptions>());
}

export function rawOptionsToAppOptions(raw: RawCliOptions): AppOptions {
  if (!raw.target && !raw.targetDir) {
    throw new CliError("Either --target or --target-dir is required", 2);
  }

  if (raw.target && raw.targetDir) {
    throw new CliError("--target and --target-dir cannot be used together", 2);
  }

  const repoRoot = resolveFrom(process.cwd(), raw.repo);
  assertDirectory(repoRoot, "--repo", 2);

  const docsDir = resolveFrom(process.cwd(), raw.docs ?? defaultDocsDir(repoRoot));
  assertDirectory(docsDir, "--docs", 2);

  const outputRoot = resolveFrom(process.cwd(), raw.out ?? defaultOutputRoot(repoRoot));
  const concurrency = parsePositiveInteger(raw.concurrency, "--concurrency", 1);
  const timeoutMs = parsePositiveInteger(raw.timeoutMs, "--timeout-ms", 1000);

  return {
    repoRoot,
    docsDir,
    outputRoot,
    rawTarget: raw.target,
    targetDir: raw.targetDir,
    selectedAgents: splitAgentList(raw.agents),
    concurrency,
    timeoutMs,
    format: parseEnum(raw.format, formatValues, "--format"),
    failOn: parseEnum(raw.failOn, failOnValues, "--fail-on"),
    skipGitRepoCheck: raw.skipGitRepoCheck,
    dryRun: raw.dryRun,
    verbose: raw.verbose,
    model: raw.model,
    modelReasoningEffort: parseEnum(raw.reasoning, reasoningValues, "--reasoning"),
    sandboxMode: parseEnum(raw.sandbox, sandboxValues, "--sandbox"),
    webSearchMode: parseEnum(raw.webSearch, webSearchValues, "--web-search")
  };
}

function splitAgentList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parsePositiveInteger(value: string, optionName: string, minimum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new CliError(`${optionName} must be an integer greater than or equal to ${minimum}`, 2);
  }
  return parsed;
}

function parseEnum<const T extends readonly string[]>(
  value: string,
  allowed: T,
  optionName: string
): T[number] {
  if (!allowed.includes(value)) {
    throw new CliError(`${optionName} must be one of: ${allowed.join(", ")}`, 2);
  }
  return value as T[number];
}

function assertDirectory(dirPath: string, optionName: string, exitCode: number): void {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new CliError(`${optionName} must be an existing directory: ${path.normalize(dirPath)}`, exitCode);
  }
}
