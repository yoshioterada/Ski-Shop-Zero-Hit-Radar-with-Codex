# Final Acceptance Checklist

This checklist maps the implementation to `spec-design/code-review-spec.md` and `spec-design/code-review-impl-plan.md` Phase 10.

## CLI Acceptance

- `code-review --target full --agents full` generates 14 jobs.
- `code-review --target <path> --agents security` generates 1 job.
- `code-review --target-dir <directory> --agents security` reviews only the specified directory.
- `code-review --target <path> --agents security,performance,data-access` generates 3 jobs.
- `--target` and `--target-dir` together fail with exit code `2`.
- 1 failed agent does not prevent report generation.
- All failed agents produce exit code `4`.

## Result Acceptance

- Critical findings produce `Rejected`.
- High-only findings produce `Conditional Approval`.
- Medium/Low findings produce `Approved with Notes`.
- `--fail-on critical`, `--fail-on high`, and `--fail-on none` produce the expected exit codes.
- Duplicate findings are deduplicated, severity is maximized, and `sourceAgents` are merged.
- Invalid structured JSON is treated as incomplete.

## Conflict And Tech Lead Acceptance

- Defined conflict patterns are detected.
- Undefined same-line opposing recommendations are candidate-detected.
- A conflict creates one `tech-lead-adjudication` job.
- Tech Lead adjudication uses a separate job and therefore a separate Codex thread.
- Adjudication output is schema-validated and included in the report model.
- Adjudication failure creates an escalation.

## Report Acceptance

- Markdown reports are generated.
- JSON reports are generated as `IntegratedReviewReport`.
- events JSONL files are generated.
- Report numbering increments without overwriting existing reports.
- Reports are written under `<target-name>/`.
- `full` reports are written under `full/`.

## Codex SDK Acceptance

- `Codex` client creation is implemented.
- `ThreadOptions` default to `sandboxMode: "read-only"` and `approvalPolicy: "never"`.
- `networkAccessEnabled: false` and `webSearchMode: "disabled"` are defaulted.
- `additionalDirectories` are passed to `ThreadOptions`.
- `runStreamed`, `outputSchema`, and `AbortSignal` are used.
- `threadId`, usage, SDK errors, `turn.failed`, and stream `error` events are normalized.
- Real Codex SDK E2E is opt-in with `RUN_CODEX_E2E=true`.

## OSS And CI Acceptance

- `README.md`, `LICENSE`, and `CONTRIBUTING.md` are present.
- GitHub Actions runs `npm ci`, `npm run lint`, `npm run test`, and `npm run build`.
- CI keeps real Codex SDK E2E disabled by default.

## Verification Commands

```bash
npm run ci
npm audit --audit-level=moderate
npm run test -- --run test/e2e/cli-acceptance.e2e.test.ts
npm run test -- --run test/e2e/codex-sdk.e2e.test.ts
```

The Codex SDK E2E command skips by default unless `RUN_CODEX_E2E=true` is set.
