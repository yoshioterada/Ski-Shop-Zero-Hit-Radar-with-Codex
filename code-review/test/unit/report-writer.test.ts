import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { allocateReportPaths, writeReport } from "../../src/reports/report-writer.js";

import { reportInput } from "./report-test-helpers.js";

let tempRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-report-"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("report writer", () => {
  it("writes markdown, json, and events JSONL using the same sequence", async () => {
    const result = await writeReport({
      ...reportInput({ reviewDate: new Date("2026-06-04T00:00:00.000Z") }),
      outputRoot: tempRoot,
      events: [
        {
          agentId: "security",
          recordedAt: "2026-06-04T00:00:01.000Z",
          event: { type: "thread.started", thread_id: "thread-security" }
        }
      ]
    });

    expect(result.paths.sequence).toBe(1);
    expect(result.paths.markdown).toBe(path.join(tempRoot, "controller", "check-report-1.md"));
    expect(result.paths.json).toBe(path.join(tempRoot, "controller", "check-report-1.json"));
    expect(result.paths.events).toBe(path.join(tempRoot, "controller", "check-report-1.events.jsonl"));
    expect(fs.existsSync(result.paths.markdown)).toBe(true);
    expect(fs.existsSync(result.paths.json)).toBe(true);
    expect(fs.existsSync(result.paths.events)).toBe(true);
    expect(fs.readFileSync(result.paths.events, "utf8")).toContain("thread-security");
  });

  it("increments N from existing markdown reports and does not overwrite", async () => {
    const targetDir = path.join(tempRoot, "controller");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "check-report-1.md"), "existing");
    fs.writeFileSync(path.join(targetDir, "check-report-3.md"), "existing");

    const result = await writeReport({
      ...reportInput({ reviewDate: new Date("2026-06-04T00:00:00.000Z") }),
      outputRoot: tempRoot
    });

    expect(result.paths.sequence).toBe(4);
    expect(fs.readFileSync(path.join(targetDir, "check-report-1.md"), "utf8")).toBe("existing");
    expect(fs.readFileSync(path.join(targetDir, "check-report-3.md"), "utf8")).toBe("existing");
  });

  it("allocates reports under full/ for full targets", async () => {
    const result = await writeReport({
      ...reportInput({
        reviewDate: new Date("2026-06-04T00:00:00.000Z"),
        targetName: "full",
        rawTarget: "full"
      }),
      outputRoot: tempRoot
    });

    expect(result.paths.markdown).toBe(path.join(tempRoot, "full", "check-report-1.md"));
  });

  it("allocates reports under targetName for target-dir reviews", async () => {
    const paths = await allocateReportPaths(tempRoot, "controller");

    expect(paths.markdown).toBe(path.join(tempRoot, "controller", "check-report-1.md"));
  });

  it("uses the execution time review date", async () => {
    const before = Date.now();
    const result = await writeReport({
      ...reportInput(),
      outputRoot: tempRoot
    });
    const after = Date.now();
    const reviewDate = Date.parse(result.report.reviewDate);

    expect(reviewDate).toBeGreaterThanOrEqual(before);
    expect(reviewDate).toBeLessThanOrEqual(after);
  });

  it("honors markdown-only report format", async () => {
    const result = await writeReport({
      ...reportInput(),
      outputRoot: tempRoot,
      format: "markdown"
    });

    expect(fs.existsSync(result.paths.markdown)).toBe(true);
    expect(fs.existsSync(result.paths.json)).toBe(false);
    expect(fs.existsSync(result.paths.events)).toBe(true);
    expect(result.report.outputFiles.markdown).toBe(result.paths.markdown);
    expect(result.report.outputFiles.json).toBeUndefined();
  });

  it("honors json-only report format", async () => {
    const result = await writeReport({
      ...reportInput(),
      outputRoot: tempRoot,
      format: "json"
    });

    expect(fs.existsSync(result.paths.markdown)).toBe(false);
    expect(fs.existsSync(result.paths.json)).toBe(true);
    expect(fs.existsSync(result.paths.events)).toBe(true);
    expect(result.report.outputFiles.markdown).toBeUndefined();
    expect(result.report.outputFiles.json).toBe(result.paths.json);
  });

  it("summarizes event logs without reasoning text or command output", async () => {
    const result = await writeReport({
      ...reportInput(),
      outputRoot: tempRoot,
      events: [
        {
          agentId: "security",
          event: {
            type: "item.completed",
            item: {
              id: "reasoning-1",
              type: "reasoning",
              text: "private reasoning text"
            }
          }
        },
        {
          agentId: "security",
          event: {
            type: "item.completed",
            item: {
              id: "cmd-1",
              type: "command_execution",
              command: "echo secret",
              aggregated_output: "secret command output",
              exit_code: 0,
              status: "completed"
            }
          }
        }
      ]
    });
    const eventLog = fs.readFileSync(result.paths.events, "utf8");

    expect(eventLog).not.toContain("private reasoning text");
    expect(eventLog).not.toContain("secret command output");
    expect(eventLog).not.toContain("echo secret");
    expect(eventLog).toContain("\"type\":\"reasoning\"");
    expect(eventLog).toContain("\"exit_code\":0");
  });

  it("summarizes lifecycle and tool events without verbose payloads", async () => {
    const result = await writeReport({
      ...reportInput(),
      outputRoot: tempRoot,
      events: [
        {
          agentId: "standards",
          event: { type: "turn.started" }
        },
        {
          agentId: "standards",
          event: { type: "turn.completed", usage: { input_tokens: 1, output_tokens: 2 } }
        },
        {
          agentId: "security",
          event: { type: "turn.failed", error: new Error("runner failed") }
        },
        {
          agentId: "security",
          event: { type: "error", message: "sdk error" }
        },
        {
          agentId: "performance",
          event: {
            type: "item.updated",
            item: {
              id: "file-1",
              type: "file_change",
              status: "completed",
              changes: [{ path: "src/App.java", action: "modify" }]
            }
          }
        },
        {
          agentId: "performance",
          event: {
            type: "item.completed",
            item: {
              id: "tool-1",
              type: "mcp_tool_call",
              server: "filesystem",
              tool: "read",
              arguments: { apiKey: "secret" },
              result: { content: "verbose result" },
              error: new Error("tool failed"),
              status: "failed"
            }
          }
        },
        {
          agentId: "tech-lead",
          event: {
            type: "item.completed",
            item: {
              id: "error-1",
              type: "error",
              message: "item error"
            }
          }
        }
      ]
    });
    const eventLog = fs.readFileSync(result.paths.events, "utf8");

    expect(eventLog).toContain("\"type\":\"turn.started\"");
    expect(eventLog).toContain("\"input_tokens\":1");
    expect(eventLog).toContain("runner failed");
    expect(eventLog).toContain("sdk error");
    expect(eventLog).toContain("\"type\":\"file_change\"");
    expect(eventLog).toContain("\"server\":\"filesystem\"");
    expect(eventLog).toContain("tool failed");
    expect(eventLog).toContain("item error");
    expect(eventLog).not.toContain("secret");
    expect(eventLog).not.toContain("verbose result");
  });
});
