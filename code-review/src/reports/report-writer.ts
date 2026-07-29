import fs from "node:fs/promises";
import path from "node:path";

import type { BuildReportInput, IntegratedReviewReport } from "./report-types.js";
import { generateJsonReport } from "./json-report-generator.js";
import { generateMarkdownReport } from "./markdown-report-generator.js";
import { writeEventLog, type EventLogEntry } from "./event-log-writer.js";

export interface ReportPaths {
  targetDir: string;
  sequence: number;
  markdown: string;
  json: string;
  events: string;
}

export interface WriteReportInput extends BuildReportInput {
  outputRoot: string;
  format?: "markdown" | "json" | "both";
  events?: readonly EventLogEntry[];
}

export interface WriteReportResult {
  report: IntegratedReviewReport;
  paths: ReportPaths;
  markdown: string;
}

/** Writes the integrated report files using non-overwriting paths. */
export async function writeReport(input: WriteReportInput): Promise<WriteReportResult> {
  const paths = await allocateReportPaths(input.outputRoot, input.target.targetName);
  const format = input.format ?? "both";
  const outputFiles = {
    markdown: format === "json" ? undefined : paths.markdown,
    json: format === "markdown" ? undefined : paths.json,
    events: paths.events
  };
  const report = generateJsonReport({
    ...input,
    outputFiles
  });
  const markdown = generateMarkdownReport(report);

  await fs.mkdir(paths.targetDir, { recursive: true });
  if (outputFiles.markdown) {
    await fs.writeFile(outputFiles.markdown, markdown, { encoding: "utf8", flag: "wx" });
  }
  if (outputFiles.json) {
    await fs.writeFile(outputFiles.json, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  }
  await writeEventLog(paths.events, input.events ?? []);

  return { report, paths, markdown };
}

/** Allocates the next check-report-N paths for a target directory. */
export async function allocateReportPaths(outputRoot: string, targetName: string): Promise<ReportPaths> {
  const targetDir = path.join(outputRoot, targetName);
  const sequence = await nextReportSequence(targetDir);
  const baseName = `check-report-${sequence}`;

  return {
    targetDir,
    sequence,
    markdown: path.join(targetDir, `${baseName}.md`),
    json: path.join(targetDir, `${baseName}.json`),
    events: path.join(targetDir, `${baseName}.events.jsonl`)
  };
}

async function nextReportSequence(targetDir: string): Promise<number> {
  const entries = await fs.readdir(targetDir).catch(() => []);
  const maxExisting = entries.reduce((max, entry) => {
    const match = /^check-report-(\d+)\.md$/.exec(entry);
    if (!match) {
      return max;
    }
    return Math.max(max, Number(match[1]));
  }, 0);

  return maxExisting + 1;
}
