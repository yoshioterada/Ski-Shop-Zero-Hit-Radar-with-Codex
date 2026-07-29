import type {
  AdjudicationResult,
  AgentReviewResult,
  Conflict,
  EscalationItem,
  Finding,
  IntegratedVerdict,
  ReviewTarget
} from "../agents/agent-types.js";

export interface SdkExecutionSummary {
  sdkPackage: "@openai/codex-sdk";
  concurrency: number;
  sandboxMode: string;
  approvalPolicy: string;
  webSearchMode: string;
  model?: string;
  modelReasoningEffort?: string;
}

export interface IntegratedReviewReport {
  target: ReviewTarget;
  verdict: IntegratedVerdict;
  reviewDate: string;
  agents: string[];
  results: AgentReviewResult[];
  findings: Finding[];
  conflicts: Conflict[];
  adjudications: AdjudicationResult[];
  escalations: EscalationItem[];
  sdkExecution: SdkExecutionSummary;
  outputFiles: {
    markdown?: string;
    json?: string;
    events?: string;
  };
}

export interface BuildReportInput {
  target: ReviewTarget;
  verdict: IntegratedVerdict;
  reviewDate?: Date;
  agents: string[];
  results: AgentReviewResult[];
  findings: Finding[];
  conflicts: Conflict[];
  adjudications: AdjudicationResult[];
  escalations: EscalationItem[];
  sdkExecution: SdkExecutionSummary;
  outputFiles?: IntegratedReviewReport["outputFiles"];
}
