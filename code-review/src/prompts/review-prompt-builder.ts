import type { AgentDefinition, ReviewTarget } from "../agents/agent-types.js";

export interface ReviewPromptInput {
  agentDefinition: AgentDefinition;
  target: ReviewTarget;
}

export function buildReviewPrompt(input: ReviewPromptInput): string {
  const { agentDefinition, target } = input;

  return [
    "You are running as the agent defined below.",
    "",
    "<agent-definition>",
    agentDefinition.bodyMarkdown.trim(),
    "</agent-definition>",
    "",
    "Review target:",
    `- Repository root: ${target.repoRoot}`,
    `- Target argument: ${target.rawTarget}`,
    `- Target kind: ${target.targetKind}`,
    `- Target name: ${target.targetName}`,
    "- Target files:",
    formatList(target.files),
    "",
    "Standards and design references:",
    "- Standards files:",
    formatList(target.standardsFiles),
    "- Design reference files:",
    formatList(target.designReferenceFiles),
    "",
    "Task:",
    "Review the target code only from your own specialized perspective.",
    "Do not modify files.",
    "Return findings with concrete file paths and line numbers whenever possible.",
    "If evidence is insufficient, report confidence as low instead of inventing facts.",
    "",
    "Output:",
    "Return only JSON matching the provided AgentReviewResult schema.",
    "Also include a concise markdown detail report in rawMarkdown."
  ].join("\n");
}

function formatList(values: string[]): string {
  if (values.length === 0) {
    return "- (none)";
  }

  return values.map((value) => `- ${value}`).join("\n");
}
