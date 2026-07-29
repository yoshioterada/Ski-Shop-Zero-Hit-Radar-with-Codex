import type { AgentDefinition } from "./agent-types.js";
import { CliError } from "../utils/errors.js";

export const REQUIRED_AGENT_IDS = [
  "tech-lead",
  "architecture",
  "ddd-domain",
  "api-endpoint",
  "java-standards",
  "async-concurrency",
  "error-logging",
  "data-access",
  "config-di",
  "security",
  "dependency",
  "test-quality",
  "performance",
  "resilience"
] as const;

export class AgentRegistry {
  private readonly agentsById: Map<string, AgentDefinition>;

  constructor(agents: AgentDefinition[]) {
    this.agentsById = new Map();
    for (const agent of agents) {
      if (this.agentsById.has(agent.id)) {
        throw new CliError(`Duplicate agent id: ${agent.id}`, 2);
      }
      this.agentsById.set(agent.id, agent);
    }
    this.validateRequiredAgents();
  }

  all(): AgentDefinition[] {
    return REQUIRED_AGENT_IDS.map((id) => this.get(id));
  }

  get(id: string): AgentDefinition {
    const agent = this.agentsById.get(id);
    if (!agent) {
      throw new CliError(`Unknown agent: ${id}`, 2);
    }
    return agent;
  }

  resolveSelection(selection: string[]): AgentDefinition[] {
    if (selection.length === 0 || selection.includes("full")) {
      if (selection.length > 1) {
        throw new CliError("full cannot be combined with other agent names", 2);
      }
      return this.all();
    }
    return selection.map((rawName) => this.get(normalizeAgentName(rawName)));
  }

  private validateRequiredAgents(): void {
    for (const requiredId of REQUIRED_AGENT_IDS) {
      if (!this.agentsById.has(requiredId)) {
        throw new CliError(`Missing required agent: ${requiredId}`, 2);
      }
    }
    if (this.agentsById.size !== REQUIRED_AGENT_IDS.length) {
      throw new CliError(
        `Expected ${REQUIRED_AGENT_IDS.length} agents but loaded ${this.agentsById.size}`,
        2
      );
    }
    if (!this.get("tech-lead").isTechLead) {
      throw new CliError("tech-lead agent is not marked as tech lead", 2);
    }
  }
}

export function normalizeAgentName(rawName: string): string {
  const name = rawName.trim();
  if (name.length === 0) {
    throw new CliError("Agent name cannot be empty", 2);
  }
  if (name.endsWith(".agent.md")) {
    throw new CliError("Agent names must not include the .agent.md suffix", 2);
  }
  return name.startsWith("orchest-code-review-")
    ? name.slice("orchest-code-review-".length)
    : name;
}
