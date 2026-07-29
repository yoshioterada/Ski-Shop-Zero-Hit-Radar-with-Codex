import fs from "node:fs/promises";
import path from "node:path";

import type { ThreadEvent } from "@openai/codex-sdk";

export interface EventLogEntry {
  agentId: string;
  recordedAt?: string;
  event: ThreadEvent;
}

/**
 * Writes sanitized Codex SDK lifecycle events as JSONL for auditability without
 * persisting model reasoning, command output, tool arguments, or tool results.
 */
export async function writeEventLog(outputFile: string, events: readonly EventLogEntry[] = []): Promise<void> {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  const lines = events.map((entry) =>
    JSON.stringify({
      agentId: entry.agentId,
      recordedAt: entry.recordedAt ?? new Date().toISOString(),
      event: summarizeThreadEvent(entry.event)
    })
  );
  await fs.writeFile(outputFile, lines.length === 0 ? "" : `${lines.join("\n")}\n`, "utf8");
}

/**
 * Converts a raw Codex SDK event into the minimal fields needed for troubleshooting
 * and reproducibility. Sensitive or verbose payload fields are intentionally omitted.
 */
export function summarizeThreadEvent(event: ThreadEvent): Record<string, unknown> {
  switch (event.type) {
    case "thread.started":
      return { type: event.type, thread_id: event.thread_id };
    case "turn.started":
      return { type: event.type };
    case "turn.completed":
      return { type: event.type, usage: event.usage };
    case "turn.failed":
      return { type: event.type, error: { message: event.error.message } };
    case "error":
      return { type: event.type, message: event.message };
    case "item.started":
    case "item.updated":
    case "item.completed":
      return summarizeItemEvent(event);
  }
}

function summarizeItemEvent(event: Extract<ThreadEvent, { type: "item.started" | "item.updated" | "item.completed" }>): Record<string, unknown> {
  const base = {
    type: event.type,
    item: {
      id: event.item.id,
      type: event.item.type
    } as Record<string, unknown>
  };

  if (event.item.type === "command_execution") {
    base.item.status = event.item.status;
    base.item.exit_code = event.item.exit_code;
  } else if (event.item.type === "file_change") {
    base.item.status = event.item.status;
    base.item.changes = event.item.changes;
  } else if (event.item.type === "mcp_tool_call") {
    base.item.status = event.item.status;
    base.item.server = event.item.server;
    base.item.tool = event.item.tool;
    base.item.error = event.item.error ? { message: event.item.error.message } : undefined;
  } else if (event.item.type === "error") {
    base.item.message = event.item.message;
  }

  return base;
}
