import type { Codex, ThreadEvent, ThreadOptions } from "@openai/codex-sdk";

export type Severity = "Critical" | "High" | "Medium" | "Low";

export const severityRank = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
} as const satisfies Record<Severity, number>;

export interface AgentDefinition {
  id: string;
  displayName: string;
  filePath: string;
  description: string;
  bodyMarkdown: string;
  isTechLead: boolean;
}

export interface ReviewTarget {
  rawTarget: string;
  targetKind: "full" | "file" | "directory";
  targetName: string;
  repoRoot: string;
  files: string[];
  standardsFiles: string[];
  designReferenceFiles: string[];
}

export interface AppOptions {
  repoRoot: string;
  docsDir: string;
  outputRoot: string;
  rawTarget?: string;
  targetDir?: string;
  selectedAgents: string[];
  concurrency: number;
  timeoutMs: number;
  format: "markdown" | "json" | "both";
  failOn: "critical" | "high" | "none";
  skipGitRepoCheck: boolean;
  dryRun: boolean;
  verbose: boolean;
  apiKey?: string;
  baseUrl?: string;
  codexPathOverride?: string;
  model?: string;
  modelReasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh";
  sandboxMode?: "read-only" | "workspace-write" | "danger-full-access";
  webSearchMode?: "disabled" | "cached" | "live";
  additionalDirectories?: string[];
}

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  targetFile: string;
  lineStart?: number;
  lineEnd?: number;
  evidence?: string;
  suggestedFix?: string;
  sourceAgents: string[];
  confidence: "high" | "medium" | "low";
}

export interface UsageMetrics {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
}

export interface EscalationItem {
  priority: "highest" | "high" | "normal";
  sourceAgents: string[];
  description: string;
  recommendedDecisionMaker: string;
}

export interface DesignDeviation {
  document: string;
  description: string;
  targetFile: string;
}

export interface AgentReviewResult {
  agentId: string;
  threadId?: string;
  status: "completed" | "timeout" | "error";
  verdict: "pass" | "warning" | "fail" | "incomplete";
  summary: string;
  findings: Finding[];
  escalations: EscalationItem[];
  designDeviations: DesignDeviation[];
  score?: number;
  usage?: UsageMetrics;
  rawMarkdown?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface Conflict {
  id: string;
  agentA: string;
  agentB: string;
  findingA: Finding;
  findingB: Finding;
  pattern: string;
  description: string;
  initialResolutionRule?: string;
}

export interface AdjudicationResult {
  conflictId: string;
  decision: "prefer_a" | "prefer_b" | "merge" | "escalate";
  finalSeverity: Severity;
  finalFindingTitle: string;
  rationale: string;
  recommendedAction: string;
}

export type IntegratedVerdict =
  | "Approved"
  | "Approved with Notes"
  | "Conditional Approval"
  | "Rejected";

export type ReviewEventSink = (agentId: string, event: ThreadEvent) => void | Promise<void>;

export interface ReviewJob {
  agentId: string;
  agentDefinition: AgentDefinition;
  prompt: string;
  outputSchema: unknown;
  codex?: Codex;
  threadOptions?: ThreadOptions;
  timeoutMs: number;
  eventSink?: ReviewEventSink;
}

export interface ReviewRunSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  timedOutJobs: number;
  allJobsFailed: boolean;
}

export interface ReviewExecutionPlan {
  target: ReviewTarget;
  agents: AgentDefinition[];
  jobs: ReviewJob[];
  concurrency: number;
  outputRoot: string;
  dryRun: boolean;
}

export interface ReviewExecutionResult {
  plan: ReviewExecutionPlan;
  results: AgentReviewResult[];
  summary: ReviewRunSummary;
}

export interface AdjudicationExecutionResult {
  job?: ReviewJob;
  adjudications: AdjudicationResult[];
  escalations: EscalationItem[];
  status: "skipped" | "completed" | "error";
  summary: string;
}

export type TargetInput =
  | { kind: "full"; raw: "full" }
  | { kind: "file"; raw: string; absolutePath: string }
  | { kind: "directory"; raw: string; absolutePath: string };
