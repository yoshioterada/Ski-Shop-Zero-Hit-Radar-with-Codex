import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { AgentDefinition } from "./agent-types.js";
import { CliError } from "../utils/errors.js";

export type LoadedAgentDefinitions = {
  orchestrator: AgentDefinition;
  agents: AgentDefinition[];
};

const orchestratorFileName = "orchest-code-review.agent.md";

export async function loadAgentDefinitions(docsDir: string): Promise<LoadedAgentDefinitions> {
  const entries = await fs.readdir(docsDir, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith("orchest-code-review") && name.endsWith(".agent.md"))
    .sort();

  if (!markdownFiles.includes(orchestratorFileName)) {
    throw new CliError(`Missing orchestrator definition: ${orchestratorFileName}`, 2);
  }

  const orchestrator = await readAgentDefinition(path.join(docsDir, orchestratorFileName));
  const agents = await Promise.all(
    markdownFiles
      .filter((name) => name !== orchestratorFileName)
      .map((name) => readAgentDefinition(path.join(docsDir, name)))
  );

  return { orchestrator, agents };
}

async function readAgentDefinition(filePath: string): Promise<AgentDefinition> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const description = typeof parsed.data.description === "string" ? parsed.data.description : "";
  const id = agentIdFromFilePath(filePath);

  return {
    id,
    displayName: `orchest-code-review-${id}`,
    filePath,
    description,
    bodyMarkdown: parsed.content.trim(),
    isTechLead: id === "tech-lead"
  };
}

export function agentIdFromFilePath(filePath: string): string {
  const baseName = path.basename(filePath);
  if (baseName === orchestratorFileName) {
    return "orchestrator";
  }
  if (!baseName.startsWith("orchest-code-review-") || !baseName.endsWith(".agent.md")) {
    throw new CliError(`Invalid agent definition filename: ${baseName}`, 2);
  }
  return baseName.slice("orchest-code-review-".length, -".agent.md".length);
}
