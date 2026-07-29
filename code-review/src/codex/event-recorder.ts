import fs from "node:fs/promises";
import path from "node:path";

import type { ThreadEvent } from "@openai/codex-sdk";

import { summarizeThreadEvent } from "../reports/event-log-writer.js";

const secretKeyPattern = /(api[_-]?key|authorization|bearer|token|secret|password|credential)/i;

export class EventRecorder {
  constructor(private readonly outputFile: string) {}

  async record(agentId: string, event: ThreadEvent): Promise<void> {
    await fs.mkdir(path.dirname(this.outputFile), { recursive: true });
    const line = JSON.stringify({
      agentId,
      recordedAt: new Date().toISOString(),
      event: sanitizeForJson(summarizeThreadEvent(event))
    });
    await fs.appendFile(this.outputFile, `${line}\n`, "utf8");
  }
}

export function sanitizeForJson(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForJson(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = secretKeyPattern.test(key) ? "[REDACTED]" : sanitizeForJson(item);
  }
  return sanitized;
}
