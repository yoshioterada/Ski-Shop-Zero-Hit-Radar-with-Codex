import type { AgentDefinition, Conflict, ReviewTarget } from "../agents/agent-types.js";

export interface AdjudicationPromptInput {
  techLeadDefinition: AgentDefinition;
  target: ReviewTarget;
  conflicts: Conflict[];
}

export function buildAdjudicationPrompt(input: AdjudicationPromptInput): string {
  const { techLeadDefinition, target, conflicts } = input;

  return [
    "You are the Tech Lead final adjudicator defined below.",
    "",
    "<agent-definition>",
    techLeadDefinition.bodyMarkdown.trim(),
    "</agent-definition>",
    "",
    "Conflicts:",
    JSON.stringify(conflicts, null, 2),
    "",
    "Context:",
    `- Repository root: ${target.repoRoot}`,
    `- Review target: ${target.rawTarget}`,
    `- Target kind: ${target.targetKind}`,
    `- Target files: ${target.files.join(", ")}`,
    "- Relevant findings are from independent specialist agents.",
    "",
    "Task:",
    "Analyze each conflict holistically and decide whether to prefer one finding, merge them, or escalate.",
    "",
    "Output:",
    "Return only JSON matching the provided AdjudicationResult schema."
  ].join("\n");
}
