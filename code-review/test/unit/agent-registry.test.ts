import path from "node:path";
import { describe, expect, it } from "vitest";

import { loadAgentDefinitions } from "../../src/agents/agent-definition-loader.js";
import { AgentRegistry, REQUIRED_AGENT_IDS, normalizeAgentName } from "../../src/agents/agent-registry.js";
import { CliError } from "../../src/utils/errors.js";

const docsDir = path.resolve("..", "docs");

describe("agent definition loading and registry", () => {
  it("loads orchestrator and 14 specialized agents", async () => {
    const loaded = await loadAgentDefinitions(docsDir);

    expect(loaded.orchestrator.id).toBe("orchestrator");
    expect(loaded.agents).toHaveLength(14);
    expect(loaded.agents.some((agent) => agent.id === "orchestrator")).toBe(false);
  });

  it("builds a registry with the required tech lead", async () => {
    const loaded = await loadAgentDefinitions(docsDir);
    const registry = new AgentRegistry(loaded.agents);

    expect(registry.get("tech-lead").isTechLead).toBe(true);
    expect(registry.all().map((agent) => agent.id)).toEqual([...REQUIRED_AGENT_IDS]);
  });

  it("expands full into all 14 agents", async () => {
    const loaded = await loadAgentDefinitions(docsDir);
    const registry = new AgentRegistry(loaded.agents);

    expect(registry.resolveSelection(["full"])).toHaveLength(14);
  });

  it("normalizes short and prefixed names", () => {
    expect(normalizeAgentName("security")).toBe("security");
    expect(normalizeAgentName("orchest-code-review-security")).toBe("security");
  });

  it("resolves security and prefixed security to the same agent", async () => {
    const loaded = await loadAgentDefinitions(docsDir);
    const registry = new AgentRegistry(loaded.agents);

    const [shortNameAgent] = registry.resolveSelection(["security"]);
    const [prefixedAgent] = registry.resolveSelection(["orchest-code-review-security"]);

    expect(shortNameAgent?.id).toBe("security");
    expect(prefixedAgent?.id).toBe("security");
  });

  it("rejects .agent.md suffix and unknown agents", async () => {
    const loaded = await loadAgentDefinitions(docsDir);
    const registry = new AgentRegistry(loaded.agents);

    expectCliError(() => registry.resolveSelection(["security.agent.md"]), 2);
    expectCliError(() => registry.resolveSelection(["missing-agent"]), 2);
  });
});

function expectCliError(fn: () => unknown, exitCode: number): void {
  try {
    fn();
    throw new Error("Expected function to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(exitCode);
  }
}
