import type { Codex, ThreadEvent, TurnOptions } from "@openai/codex-sdk";
import { describe, expect, it } from "vitest";

import type { AgentDefinition, ReviewJob } from "../../src/agents/agent-types.js";
import { runTechLeadAdjudication } from "../../src/codex/adjudication-runner.js";
import { adjudicationOutputSchema } from "../../src/results/review-schema.js";

describe("runTechLeadAdjudication", () => {
  it("validates adjudication output and returns adjudications", async () => {
    const mock = createMockCodex([
      { type: "thread.started", thread_id: "thread-adjudication" },
      {
        type: "item.completed",
        item: {
          id: "message-1",
          type: "agent_message",
          text: JSON.stringify({
            adjudications: [
              {
                conflictId: "conflict-1",
                decision: "merge",
                finalSeverity: "High",
                finalFindingTitle: "Use strict validation with bounded cache",
                rationale: "Balances security and performance.",
                recommendedAction: "Add validation and cache validated policy."
              }
            ],
            summary: "Resolved one conflict."
          })
        }
      },
      {
        type: "turn.completed",
        usage: {
          input_tokens: 1,
          cached_input_tokens: 0,
          output_tokens: 1,
          reasoning_output_tokens: 0
        }
      }
    ]);

    const result = await runTechLeadAdjudication(job(mock.codex));

    expect(mock.runInput).toBe("adjudication prompt");
    expect(mock.turnOptions?.outputSchema).toBe(adjudicationOutputSchema);
    expect(mock.turnOptions?.signal).toBeInstanceOf(AbortSignal);
    expect(result.status).toBe("completed");
    expect(result.adjudications).toEqual([
      {
        conflictId: "conflict-1",
        decision: "merge",
        finalSeverity: "High",
        finalFindingTitle: "Use strict validation with bounded cache",
        rationale: "Balances security and performance.",
        recommendedAction: "Add validation and cache validated policy."
      }
    ]);
  });

  it("records escalation when schema validation fails", async () => {
    const result = await runTechLeadAdjudication(
      job(
        createMockCodex([
          {
            type: "item.completed",
            item: {
              id: "invalid",
              type: "agent_message",
              text: JSON.stringify({ summary: "missing adjudications" })
            }
          }
        ]).codex
      )
    );

    expect(result.status).toBe("error");
    expect(result.adjudications).toEqual([]);
    expect(result.escalations[0]).toMatchObject({
      priority: "highest",
      sourceAgents: ["tech-lead"],
      recommendedDecisionMaker: "Human Tech Lead"
    });
  });
});

function job(codex: Codex, overrides: Partial<ReviewJob> = {}): ReviewJob {
  return {
    agentId: "tech-lead-adjudication",
    agentDefinition: techLeadDefinition(),
    prompt: "adjudication prompt",
    outputSchema: adjudicationOutputSchema,
    codex,
    threadOptions: { workingDirectory: "/repo" },
    timeoutMs: 1000,
    ...overrides
  };
}

function techLeadDefinition(): AgentDefinition {
  return {
    id: "tech-lead",
    displayName: "tech-lead",
    filePath: "/repo/docs/tech-lead.agent.md",
    description: "",
    bodyMarkdown: "# Tech Lead",
    isTechLead: true
  };
}

function createMockCodex(events: ThreadEvent[]): {
  codex: Codex;
  runInput?: string;
  turnOptions?: TurnOptions;
} {
  const state: {
    runInput?: string;
    turnOptions?: TurnOptions;
  } = {};

  const thread = {
    id: null as string | null,
    runStreamed: async (input: string, turnOptions?: TurnOptions) => {
      state.runInput = input;
      state.turnOptions = turnOptions;
      async function* generate(): AsyncGenerator<ThreadEvent> {
        for (const event of events) {
          if (event.type === "thread.started") {
            thread.id = event.thread_id;
          }
          yield event;
        }
      }
      return { events: generate() };
    }
  };

  return {
    codex: {
      startThread: () => thread
    } as unknown as Codex,
    get runInput() {
      return state.runInput;
    },
    get turnOptions() {
      return state.turnOptions;
    }
  };
}
