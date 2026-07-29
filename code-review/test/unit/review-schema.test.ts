import { describe, expect, it } from "vitest";

import {
  AdjudicationSchema,
  AgentReviewSchema,
  adjudicationOutputSchema,
  agentReviewOutputSchema,
  parseAgentReviewJson
} from "../../src/results/review-schema.js";

describe("review schemas", () => {
  it("validates an agent review output", () => {
    const result = AgentReviewSchema.safeParse({
      verdict: "warning",
      summary: "Found maintainability issues.",
      findings: [
        {
          severity: "High",
          category: "Architecture",
          title: "Controller directly depends on repository",
          description: "Controller bypasses service layer.",
          targetFile: "src/main/java/com/skishop/ProductController.java",
          lineStart: 42,
          confidence: "high"
        }
      ],
      escalations: [
        {
          priority: "high",
          description: "Architecture decision required.",
          recommendedDecisionMaker: "Tech Lead"
        }
      ],
      designDeviations: [
        {
          document: "AGENTS.md",
          description: "Layering rule is not followed.",
          targetFile: "src/main/java/com/skishop/ProductController.java"
        }
      ],
      rawMarkdown: "# Detail"
    });

    expect(result.success).toBe(true);
  });

  it("keeps normalizer-owned fields out of agent finding output", () => {
    const result = AgentReviewSchema.safeParse({
      verdict: "fail",
      summary: "Invalid output with sourceAgents included.",
      findings: [
        {
          id: "finding-1",
          severity: "Critical",
          category: "Security",
          title: "Hardcoded secret",
          description: "A secret is hardcoded.",
          targetFile: "src/main/java/com/skishop/App.java",
          sourceAgents: ["security"],
          confidence: "high"
        }
      ],
      escalations: [],
      designDeviations: [],
      rawMarkdown: "# Detail"
    });

    expect(result.success).toBe(false);
  });

  it("parses an agent review JSON string", () => {
    const parsed = parseAgentReviewJson(
      JSON.stringify({
        verdict: "pass",
        summary: "No findings.",
        findings: [],
        escalations: [],
        designDeviations: [],
        rawMarkdown: "# Detail"
      })
    );

    expect(parsed.verdict).toBe("pass");
  });

  it("treats null optional numeric fields as omitted", () => {
    const parsed = parseAgentReviewJson(
      JSON.stringify({
        verdict: "warning",
        summary: "Line number and score were not available.",
        findings: [
          {
            severity: "Medium",
            category: "Logging",
            title: "Unclear log policy",
            description: "The finding applies to the file as a whole.",
            targetFile: "src/main/java/com/skishop/App.java",
            lineStart: null,
            lineEnd: null,
            confidence: "medium"
          }
        ],
        escalations: [],
        designDeviations: [],
        score: null,
        rawMarkdown: "# Detail"
      })
    );

    expect(parsed.score).toBeUndefined();
    expect(parsed.findings[0]?.lineStart).toBeUndefined();
    expect(parsed.findings[0]?.lineEnd).toBeUndefined();
  });

  it("validates adjudication output", () => {
    const result = AdjudicationSchema.safeParse({
      adjudications: [
        {
          conflictId: "conflict-1",
          decision: "prefer_a",
          finalSeverity: "High",
          finalFindingTitle: "Prefer secure approach",
          rationale: "Security risk outweighs performance concern.",
          recommendedAction: "Apply the security restriction."
        }
      ],
      summary: "One conflict adjudicated."
    });

    expect(result.success).toBe(true);
  });

  it("generates JSON schemas for Codex structured output", () => {
    expect(agentReviewOutputSchema).toEqual(expect.objectContaining({ type: "object" }));
    expect(adjudicationOutputSchema).toEqual(expect.objectContaining({ type: "object" }));
  });
});
