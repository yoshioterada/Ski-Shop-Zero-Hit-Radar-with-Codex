import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ThreadEvent } from "@openai/codex-sdk";

import { EventRecorder, sanitizeForJson } from "../../src/codex/event-recorder.js";

let tempRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-events-"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("EventRecorder", () => {
  it("records a minimal event summary without tool arguments", async () => {
    const outputFile = path.join(tempRoot, "events.jsonl");
    const recorder = new EventRecorder(outputFile);

    await recorder.record("security", {
      type: "item.completed",
      item: {
        id: "item-1",
        type: "mcp_tool_call",
        server: "test",
        tool: "fetch",
        arguments: {
          apiKey: "secret",
          nested: {
            authorization: "Bearer token"
          }
        },
        status: "completed"
      }
    } as ThreadEvent);

    const written = fs.readFileSync(outputFile, "utf8");
    expect(written).not.toContain("secret");
    expect(written).not.toContain("Bearer token");
    expect(written).toContain("\"type\":\"mcp_tool_call\"");
    expect(written).toContain("\"server\":\"test\"");
    expect(written).toContain("\"tool\":\"fetch\"");
  });

  it("does not persist reasoning text or command output", async () => {
    const outputFile = path.join(tempRoot, "events.jsonl");
    const recorder = new EventRecorder(outputFile);

    await recorder.record("security", {
      type: "item.completed",
      item: {
        id: "reasoning-1",
        type: "reasoning",
        text: "private reasoning text"
      }
    } as ThreadEvent);
    await recorder.record("security", {
      type: "item.completed",
      item: {
        id: "cmd-1",
        type: "command_execution",
        command: "echo secret",
        aggregated_output: "secret command output",
        status: "completed",
        exit_code: 0
      }
    } as ThreadEvent);

    const written = fs.readFileSync(outputFile, "utf8");
    expect(written).not.toContain("private reasoning text");
    expect(written).not.toContain("secret command output");
    expect(written).not.toContain("echo secret");
    expect(written).toContain("\"type\":\"reasoning\"");
    expect(written).toContain("\"exit_code\":0");
  });

  it("sanitizes nested token-like keys", () => {
    expect(
      sanitizeForJson({
        value: "visible",
        password: "hidden",
        nested: [{ accessToken: "hidden-token" }]
      })
    ).toEqual({
      value: "visible",
      password: "[REDACTED]",
      nested: [{ accessToken: "[REDACTED]" }]
    });
  });
});
