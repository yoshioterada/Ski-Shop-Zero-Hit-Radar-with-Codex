import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AgentDefinition, Conflict, ReviewTarget } from "../../src/agents/agent-types.js";
import { buildAdjudicationPrompt } from "../../src/prompts/adjudication-prompt-builder.js";
import { buildReviewPrompt } from "../../src/prompts/review-prompt-builder.js";

describe("prompt builders", () => {
  it("builds independent specialist review prompts with target and reference context", () => {
    const prompt = buildReviewPrompt({
      agentDefinition: agentDefinition("security", "Review authentication and authorization risks."),
      target: reviewTarget()
    });

    expect(prompt).toContain("Review authentication and authorization risks.");
    expect(prompt).toContain("src/main/java/com/skishop/controller/ProductController.java");
    expect(prompt).toContain("AGENTS.md");
    expect(prompt).toContain("design-docs/api.md");
    expect(prompt).toContain("Do not modify files.");
    expect(prompt).toContain("Return only JSON matching the provided AgentReviewResult schema.");
    expect(prompt).not.toContain("Agent results:");
    expect(prompt).not.toContain("Other agent");
  });

  it("builds Tech Lead adjudication prompts with conflict JSON and definition", () => {
    const conflict: Conflict = {
      id: "conflict-1",
      agentA: "security",
      agentB: "performance",
      pattern: "same_file_conflicting_recommendation",
      description: "Security recommends adding validation while performance warns about overhead.",
      findingA: finding("security", "Add authorization guard"),
      findingB: finding("performance", "Avoid extra database lookup")
    };

    const prompt = buildAdjudicationPrompt({
      techLeadDefinition: agentDefinition("tech-lead", "Resolve conflicts as a pragmatic Tech Lead."),
      target: reviewTarget(),
      conflicts: [conflict]
    });

    expect(prompt).toContain("Resolve conflicts as a pragmatic Tech Lead.");
    expect(prompt).toContain("\"id\": \"conflict-1\"");
    expect(prompt).toContain("\"agentA\": \"security\"");
    expect(prompt).toContain("src/main/java/com/skishop/controller/ProductController.java");
    expect(prompt).toContain("Return only JSON matching the provided AdjudicationResult schema.");
  });
});

function agentDefinition(id: string, bodyMarkdown: string): AgentDefinition {
  return {
    id,
    displayName: id,
    filePath: path.join("/repo/docs", `orchest-code-review-${id}.agent.md`),
    description: "",
    bodyMarkdown,
    isTechLead: id === "tech-lead"
  };
}

function reviewTarget(): ReviewTarget {
  return {
    rawTarget: "src/main/java/com/skishop/controller",
    targetKind: "directory",
    targetName: "controller",
    repoRoot: "/repo",
    files: ["src/main/java/com/skishop/controller/ProductController.java"],
    standardsFiles: ["AGENTS.md", "/instructions/java.instructions.md"],
    designReferenceFiles: ["design-docs/api.md"]
  };
}

function finding(agentId: string, title: string): Conflict["findingA"] {
  return {
    id: `${agentId}-finding`,
    severity: "High",
    category: "review",
    title,
    description: title,
    targetFile: "src/main/java/com/skishop/controller/ProductController.java",
    sourceAgents: [agentId],
    confidence: "high"
  };
}
