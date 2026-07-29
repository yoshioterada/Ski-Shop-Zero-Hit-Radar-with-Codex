import type { BuildReportInput } from "../../src/reports/report-types.js";

export function reportInput(overrides: {
  reviewDate?: Date;
  targetName?: string;
  rawTarget?: string;
} = {}): BuildReportInput {
  return {
    target: {
      rawTarget: overrides.rawTarget ?? "src/main/java/com/skishop/controller",
      targetKind: overrides.rawTarget === "full" ? "full" : "directory",
      targetName: overrides.targetName ?? "controller",
      repoRoot: "/repo",
      files: ["src/main/java/com/skishop/controller/ProductController.java"],
      standardsFiles: ["AGENTS.md"],
      designReferenceFiles: ["design-docs/api.md"]
    },
    verdict: "Conditional Approval",
    reviewDate: overrides.reviewDate,
    agents: ["security", "performance"],
    results: [
      {
        agentId: "security",
        threadId: "thread-security",
        status: "completed",
        verdict: "warning",
        summary: "Security finding found.",
        findings: [
          {
            id: "finding-security",
            severity: "High",
            category: "security",
            title: "Missing authorization",
            description: "Endpoint lacks authorization.",
            targetFile: "src/main/java/com/skishop/controller/ProductController.java",
            lineStart: 12,
            suggestedFix: "Add authorization guard.",
            sourceAgents: ["security"],
            confidence: "high"
          }
        ],
        escalations: [],
        designDeviations: [
          {
            document: "design-docs/api.md",
            description: "Endpoint differs from API design.",
            targetFile: "src/main/java/com/skishop/controller/ProductController.java"
          }
        ],
        score: 80,
        usage: {
          inputTokens: 1200,
          cachedInputTokens: 300,
          outputTokens: 800,
          reasoningOutputTokens: 100
        },
        rawMarkdown: "## Security detail",
        startedAt: "2026-06-04T00:00:00.000Z",
        completedAt: "2026-06-04T00:00:02.000Z",
        durationMs: 2000
      },
      {
        agentId: "performance",
        threadId: "thread-performance",
        status: "error",
        verdict: "incomplete",
        summary: "Performance review failed.",
        findings: [
          {
            id: "finding-performance",
            severity: "Medium",
            category: "performance",
            title: "Cache candidate",
            description: "Consider caching.",
            targetFile: "src/main/java/com/skishop/controller/ProductController.java",
            lineStart: 12,
            sourceAgents: ["performance"],
            confidence: "medium"
          }
        ],
        escalations: [
          {
            priority: "high",
            sourceAgents: ["performance"],
            description: "Performance review incomplete.",
            recommendedDecisionMaker: "Tech Lead"
          }
        ],
        designDeviations: [],
        rawMarkdown: "## Performance detail",
        errorMessage: "SDK error",
        startedAt: "2026-06-04T00:00:00.000Z",
        completedAt: "2026-06-04T00:00:01.000Z",
        durationMs: 1000
      }
    ],
    findings: [
      {
        id: "finding-security",
        severity: "High",
        category: "security",
        title: "Missing authorization",
        description: "Endpoint lacks authorization.",
        targetFile: "src/main/java/com/skishop/controller/ProductController.java",
        lineStart: 12,
        suggestedFix: "Add authorization guard.",
        sourceAgents: ["security"],
        confidence: "high"
      },
      {
        id: "finding-performance",
        severity: "Medium",
        category: "performance",
        title: "Cache candidate",
        description: "Consider caching.",
        targetFile: "src/main/java/com/skishop/controller/ProductController.java",
        lineStart: 12,
        sourceAgents: ["performance"],
        confidence: "medium"
      }
    ],
    conflicts: [
      {
        id: "conflict-1",
        agentA: "security",
        agentB: "performance",
        findingA: {
          id: "finding-security",
          severity: "High",
          category: "security",
          title: "Missing authorization",
          description: "Endpoint lacks authorization.",
          targetFile: "src/main/java/com/skishop/controller/ProductController.java",
          lineStart: 12,
          sourceAgents: ["security"],
          confidence: "high"
        },
        findingB: {
          id: "finding-performance",
          severity: "Medium",
          category: "performance",
          title: "Cache candidate",
          description: "Consider caching.",
          targetFile: "src/main/java/com/skishop/controller/ProductController.java",
          lineStart: 12,
          sourceAgents: ["performance"],
          confidence: "medium"
        },
        pattern: "restrictions_vs_relaxation",
        description: "Security and performance recommendations conflict."
      }
    ],
    adjudications: [
      {
        conflictId: "conflict-1",
        decision: "prefer_a",
        finalSeverity: "High",
        finalFindingTitle: "Missing authorization",
        rationale: "Security takes precedence.",
        recommendedAction: "Add authorization guard."
      }
    ],
    escalations: [
      {
        priority: "high",
        sourceAgents: ["performance"],
        description: "Performance review incomplete.",
        recommendedDecisionMaker: "Tech Lead"
      }
    ],
    sdkExecution: {
      sdkPackage: "@openai/codex-sdk",
      concurrency: 7,
      sandboxMode: "read-only",
      approvalPolicy: "never",
      webSearchMode: "disabled",
      model: "gpt-5-codex",
      modelReasoningEffort: "high"
    }
  };
}
