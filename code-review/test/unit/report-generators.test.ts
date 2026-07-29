import { describe, expect, it } from "vitest";

import { generateJsonReport } from "../../src/reports/json-report-generator.js";
import { generateMarkdownReport } from "../../src/reports/markdown-report-generator.js";

import { reportInput } from "./report-test-helpers.js";

describe("report generators", () => {
  it("generates an IntegratedReviewReport JSON model", () => {
    const report = generateJsonReport(reportInput({ reviewDate: new Date("2026-06-04T00:00:00.000Z") }));

    expect(report).toMatchObject({
      verdict: "Conditional Approval",
      reviewDate: "2026-06-04T00:00:00.000Z",
      sdkExecution: {
        sdkPackage: "@openai/codex-sdk",
        concurrency: 7,
        sandboxMode: "read-only",
        approvalPolicy: "never",
        webSearchMode: "disabled"
      }
    });
    expect(report.target.targetName).toBe("controller");
    expect(report.findings).toHaveLength(2);
    expect(report.conflicts).toHaveLength(1);
    expect(report.adjudications).toHaveLength(1);
  });

  it("generates markdown with the required report sections", () => {
    const markdown = generateMarkdownReport(
      generateJsonReport(reportInput({ reviewDate: new Date("2026-06-04T00:00:00.000Z") }))
    );

    expect(markdown).toContain("# Source Code Review Integrated Report");
    expect(markdown).toContain("## Verdict");
    expect(markdown).toContain("## Findings Summary");
    expect(markdown).toContain("## Verdict Rationale");
    expect(markdown).toContain("## Critical/High Findings List");
    expect(markdown).toContain("## All Findings");
    expect(markdown).toContain("## Escalation Items");
    expect(markdown).toContain("## Conflict Resolution Record");
    expect(markdown).toContain("## Design Document Cross-Reference Results");
    expect(markdown).toContain("## Incomplete Reviews");
    expect(markdown).toContain("## Codex SDK Execution Summary");
    expect(markdown).toContain("## Individual Agent Detail Reports");
    expect(markdown).toContain("thread-security");
    expect(markdown).toContain("1200 | 300 | 800 | 100");
    expect(markdown).toContain("performance - error");
  });
});
