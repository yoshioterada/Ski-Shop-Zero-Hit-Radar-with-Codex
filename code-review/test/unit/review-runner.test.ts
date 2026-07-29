import type { Codex, ThreadEvent, ThreadOptions, TurnOptions } from "@openai/codex-sdk";
import { describe, expect, it } from "vitest";

import type { AgentDefinition, ReviewJob } from "../../src/agents/agent-types.js";
import { runSingleAgentReview } from "../../src/codex/review-runner.js";
import { agentReviewOutputSchema } from "../../src/results/review-schema.js";

describe("CodexReviewRunner", () => {
  it("calls runStreamed with outputSchema and records thread id, usage, and parsed JSON", async () => {
    const events: ThreadEvent[] = [
      { type: "thread.started", thread_id: "thread-123" },
      {
        type: "item.completed",
        item: {
          id: "message-1",
          type: "agent_message",
          text: JSON.stringify({
            verdict: "warning",
            summary: "One issue found.",
            findings: [
              {
                severity: "High",
                category: "security",
                title: "Missing authorization",
                description: "Endpoint does not check authorization.",
                targetFile: "src/main/java/App.java",
                lineStart: 10,
                confidence: "high"
              }
            ],
            escalations: [
              {
                priority: "high",
                description: "Decide policy owner.",
                recommendedDecisionMaker: "Tech Lead"
              }
            ],
            designDeviations: [
              {
                document: "design-docs/api.md",
                description: "Contract mismatch.",
                targetFile: "src/main/java/App.java"
              }
            ],
            score: 72,
            rawMarkdown: "## Security\nOne issue found."
          })
        }
      },
      {
        type: "turn.completed",
        usage: {
          input_tokens: 10,
          cached_input_tokens: 2,
          output_tokens: 20,
          reasoning_output_tokens: 3
        }
      }
    ];
    const mock = createMockCodex(events);

    const result = await runSingleAgentReview(job(mock.codex));

    expect(mock.startThreadOptions).toEqual({ workingDirectory: "/repo" });
    expect(mock.runInput).toBe("review prompt");
    expect(mock.turnOptions?.outputSchema).toBe(agentReviewOutputSchema);
    expect(mock.turnOptions?.signal).toBeInstanceOf(AbortSignal);
    expect(result).toMatchObject({
      agentId: "security",
      threadId: "thread-123",
      status: "completed",
      verdict: "warning",
      summary: "One issue found.",
      usage: {
        inputTokens: 10,
        cachedInputTokens: 2,
        outputTokens: 20,
        reasoningOutputTokens: 3
      }
    });
    expect(result.findings[0]).toMatchObject({
      id: "security-1",
      sourceAgents: ["security"],
      title: "Missing authorization"
    });
    expect(result.escalations[0]?.sourceAgents).toEqual(["security"]);
  });

  it("returns incomplete error for invalid JSON or Zod validation failure", async () => {
    const mock = createMockCodex([
      { type: "thread.started", thread_id: "thread-invalid" },
      {
        type: "item.completed",
        item: {
          id: "message-invalid",
          type: "agent_message",
          text: JSON.stringify({ summary: "missing required fields" })
        }
      }
    ]);

    const result = await runSingleAgentReview(job(mock.codex));

    expect(result).toMatchObject({
      agentId: "security",
      threadId: "thread-invalid",
      status: "error",
      verdict: "incomplete"
    });
    expect(result.errorMessage).toBeTruthy();
  });

  it("normalizes turn.failed and error events to failed results", async () => {
    const failedTurn = await runSingleAgentReview(
      job(createMockCodex([{ type: "turn.failed", error: { message: "turn failed" } }]).codex)
    );
    const errorEvent = await runSingleAgentReview(
      job(createMockCodex([{ type: "error", message: "stream failed" }]).codex)
    );

    expect(failedTurn).toMatchObject({ status: "error", verdict: "incomplete", errorMessage: "turn failed" });
    expect(errorEvent).toMatchObject({ status: "error", verdict: "incomplete", errorMessage: "stream failed" });
  });

  it("passes an AbortSignal that can be aborted by timeout", async () => {
    const mock = createHangingCodex();

    const result = await runSingleAgentReview(job(mock.codex, { timeoutMs: 5 }));

    expect(mock.signal?.aborted).toBe(true);
    expect(result).toMatchObject({
      status: "timeout",
      verdict: "incomplete"
    });
  });
});

function job(codex: Codex, overrides: Partial<ReviewJob> = {}): ReviewJob {
  return {
    agentId: "security",
    agentDefinition: agentDefinition(),
    prompt: "review prompt",
    outputSchema: agentReviewOutputSchema,
    codex,
    threadOptions: { workingDirectory: "/repo" },
    timeoutMs: 1000,
    ...overrides
  };
}

function agentDefinition(): AgentDefinition {
  return {
    id: "security",
    displayName: "security",
    filePath: "/repo/docs/security.agent.md",
    description: "",
    bodyMarkdown: "# Security",
    isTechLead: false
  };
}

function createMockCodex(events: ThreadEvent[]): {
  codex: Codex;
  startThreadOptions?: ThreadOptions;
  runInput?: string;
  turnOptions?: TurnOptions;
} {
  const state: {
    startThreadOptions?: ThreadOptions;
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

  const codex = {
    startThread: (threadOptions?: ThreadOptions) => {
      state.startThreadOptions = threadOptions;
      return thread;
    }
  } as unknown as Codex;

  return {
    codex,
    get startThreadOptions() {
      return state.startThreadOptions;
    },
    get runInput() {
      return state.runInput;
    },
    get turnOptions() {
      return state.turnOptions;
    }
  };
}

function createHangingCodex(): {
  codex: Codex;
  signal?: AbortSignal;
} {
  const state: { signal?: AbortSignal } = {};

  const thread = {
    id: null as string | null,
    runStreamed: async (_input: string, turnOptions?: TurnOptions) => {
      state.signal = turnOptions?.signal;
      async function* generate(): AsyncGenerator<ThreadEvent> {
        await new Promise<void>((resolve, reject) => {
          const signal = turnOptions?.signal;
          if (!signal) {
            reject(new Error("missing signal"));
            return;
          }
          signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
          setTimeout(resolve, 1000);
        });
        yield { type: "turn.started" };
      }
      return { events: generate() };
    }
  };

  return {
    codex: {
      startThread: () => thread
    } as unknown as Codex,
    get signal() {
      return state.signal;
    }
  };
}
