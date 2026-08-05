# Codex SDK Java Code Review Orchestrator Implementation Plan

## 1. Purpose

This implementation plan defines how to build the multi-agent Java source code review application based on the TypeScript version of the Codex SDK described in `spec-design/code-review-spec.md`, incrementally and without omissions.

Because the specification has a broad scope, the implementation is divided into 10 phases. Each phase clearly defines its scope, implementation tasks, and completion checklist so that omissions can be identified before proceeding to the next phase.

## 2. Implementation Approach

- Implement incrementally across 10 phases.
- Stabilize the CLI, types, agent definitions, target resolution, and Prompt generation before executing the Codex SDK.
- Define a clear boundary around Codex SDK calls so they can be tested with a Fake runner.
- Add E2E tests that use the real Codex SDK as an optional final step.
- Run `npm run build` and the relevant tests at the end of each phase.
- At the end of each phase, verify the implementation against the referenced sections of `code-review-spec.md`.
- If a specification change is required, update `code-review-spec.md` and this plan before implementation.

## 2.1 Common Completion Gate

In addition to each phase's completion checklist, verify the following every time.

- [ ] The deliverables for this phase do not conflict with the corresponding sections of `code-review-spec.md`.
- [ ] Any public API or CLI behavior added in this phase is documented in the README, plan, or specification.
- [ ] All existing tests pass.
- [ ] `npm run build` succeeds.
- [ ] No temporary implementation that deviates from the specification remains.

## 3. Phase Overview

| Phase | Name | Primary Deliverables |
| ---: | --- | --- |
| 1 | Project Foundation, Types, and Schemas | TypeScript CLI scaffold, data models, Zod/JSON schema |
| 2 | CLI and Agent Definitions | CLI parsing, validation, agent loader/registry |
| 3 | Review Target Resolution and Prompt Generation | full/file/directory/target-dir resolution, review Prompt |
| 4 | Fake Runner and Orchestration | Complete the execution flow without the SDK |
| 5 | Codex SDK Runner | `runStreamed`, thread, timeout, usage, events |
| 6 | Result Integration and Conflict Detection | normalizer, dedup, verdict, conflict, exit code |
| 7 | Tech Lead Adjudication | Run an additional thread when conflicts exist |
| 8 | Report Output | Markdown, JSON, events JSONL, numbering |
| 9 | CI/CD and OSS Quality | README, lint/test/build, GitHub Actions |
| 10 | E2E and Final Acceptance Validation | Verify the specification's acceptance criteria |

## 3.1 Specification Mapping

| Phase | Corresponding Sections of `code-review-spec.md` |
| ---: | --- |
| 1 | 5, 6, 7, 17, 18 |
| 2 | 2.3, 4, 8, 17 |
| 3 | 9, 10 |
| 4 | 3.3, 6.9, 11.5 |
| 5 | 11, 16.1 |
| 6 | 12, 13, 17 |
| 7 | 10.3, 13 |
| 8 | 14, 16 |
| 9 | 15, 18 |
| 10 | 19, 21, 22 |

## 4. Phase 1: Project Foundation, Types, and Schemas

### Phase 1 Implementation Scope

- `package.json`
- `tsconfig.json`
- ESLint / Vitest configuration
- `src/cli.ts`
- `src/config/defaults.ts`
- `src/agents/agent-types.ts`
- `src/results/review-schema.ts`
- `src/utils/errors.ts`
- Basic `test/` structure

### Phase 1 Implementation Tasks

1. Create the TypeScript CLI project scaffold.
2. Add `@openai/codex-sdk` at the exact version available at implementation time.
3. Add `commander`, `fast-glob`, `gray-matter`, `zod`, `zod-to-json-schema`.
4. Add `typescript`, `tsx`, `vitest`, `eslint`, `@types/node`.
5. Define `npm run build`, `npm run test`, `npm run lint`.
6. Create `src/cli.ts` and make a placeholder `--help` available.
7. Implement `Severity` and the severity rank.
8. Implement `AgentDefinition`, `ReviewTarget`, `TargetInput`, `AppOptions`.
9. Implement `Finding`, `UsageMetrics`, `EscalationItem`, `DesignDeviation`.
10. Implement `AgentReviewResult`, `Conflict`, `AdjudicationResult`.
11. Implement `ReviewJob`, `ReviewExecutionPlan`, `ReviewEventSink`.
12. Implement the Zod schema.
13. Generate the Codex SDK output schema with `zod-to-json-schema`.
14. Implement `CliError`.

### Phase 1 Completion Checklist

- [ ] `package.json` defines the required dependencies/devDependencies.
- [ ] `@openai/codex-sdk` is pinned to an exact version.
- [ ] `strict: true` is enabled in `tsconfig.json`.
- [ ] `npx tsx src/cli.ts --help` can be executed.
- [ ] All data models in `code-review-spec.md` are implemented as TypeScript types.
- [ ] The Zod schema corresponds to the TypeScript types.
- [ ] `agentReviewOutputSchema` is generated.
- [ ] `adjudicationOutputSchema` is generated.
- [ ] `Finding.sourceAgents`, `Finding.id` are excluded from the schema because they are assigned by the normalizer.
- [ ] `EscalationItem.sourceAgents` is excluded from the schema because it is assigned by the normalizer.
- [ ] `CliError` can retain an exit code.
- [ ] Unit tests for schema validation pass.
- [ ] `npm run lint` succeeds.
- [ ] `npm run test` succeeds.
- [ ] `npm run build` succeeds.

## 5. Phase 2: CLI and Agent Definitions

### Phase 2 Implementation Scope

- `src/cli.ts`
- `src/config/defaults.ts`
- `src/utils/path-utils.ts`
- `src/utils/errors.ts`
- `src/agents/agent-definition-loader.ts`
- `src/agents/agent-registry.ts`

### Phase 2 Implementation Tasks

1. Define CLI arguments with `commander`.
2. Implement `--target <path|full>`.
3. Implement `--target-dir <directory>`.
4. Implement `--agents <name[,name]|full>`.
5. Implement `--repo`, `--docs`, `--out`.
6. Implement `--concurrency`, `--timeout-ms`.
7. Implement `--model`, `--reasoning`, `--sandbox`, `--web-search`.
8. Implement `--format`, `--fail-on`, `--skip-git-repo-check`, `--dry-run`, `--verbose`.
9. Implement CLI validation.
10. Normalize CLI input into `AppOptions`.
11. Parse front matter with `gray-matter`.
12. Load `docs/orchest-code-review.agent.md` as the orchestrator definition.
13. Load `docs/orchest-code-review-*.agent.md` as agent definitions.
14. Exclude `orchest-code-review.agent.md` from the agent list.
15. Normalize agent IDs.
16. Accept IDs with or without the `orchest-code-review-` prefix.
17. Verify that all 14 agents exist.
18. Verify that `tech-lead` exists.
19. Expand `full` into 14 agents.
20. Return exit code `2` for an unknown agent specification.

### Phase 2 Completion Checklist

- [ ] Exactly one of `--target` and `--target-dir` is required.
- [ ] Specifying both `--target` and `--target-dir` returns exit code `2`.
- [ ] `--concurrency < 1` returns exit code `2`.
- [ ] `--timeout-ms < 1000` returns exit code `2`.
- [ ] A value outside the allowed values for `--sandbox` returns exit code `2`.
- [ ] A value outside the allowed values for `--web-search` returns exit code `2`.
- [ ] A value outside the allowed values for `--reasoning` returns exit code `2`.
- [ ] A value outside the allowed values for `--format` returns exit code `2`.
- [ ] A value outside the allowed values for `--fail-on` returns exit code `2`.
- [ ] A missing `--repo` path returns exit code `2`.
- [ ] A missing `--docs` path returns exit code `2`.
- [ ] The 14 specialist agent definitions are loaded.
- [ ] The orchestrator definition is not included in the specialist agent count.
- [ ] `tech-lead` exists in the registry.
- [ ] Specifying `full` expands to 14 agents.
- [ ] `security` and `orchest-code-review-security` resolve to the same agent.
- [ ] A specification ending in `.agent.md` returns an error.
- [ ] An unknown agent specification returns exit code `2`.
- [ ] Unit tests for the CLI, loader, and registry pass.
- [ ] `npm run build` succeeds.

## 6. Phase 3: Review Target Resolution and Prompt Generation

### Phase 3 Implementation Scope

- `src/targets/file-patterns.ts`
- `src/targets/target-resolver.ts`
- `src/utils/path-utils.ts`
- `src/prompts/review-prompt-builder.ts`
- `src/prompts/adjudication-prompt-builder.ts`

### Phase 3 Implementation Tasks

1. Implement review target file patterns.
2. Implement excluded directories.
3. Implement resolution for `--target full`.
4. Implement resolution for `--target <file>`.
5. Implement resolution for `--target <directory>`.
6. Implement resolution for `--target-dir <directory>`.
7. Reject absolute paths outside the repo.
8. Implement `targetName` generation.
9. Implement discovery of `AGENTS.md`.
10. Implement discovery of `design-docs/**`.
11. Implement discovery of `docs/migration/DESIGN.md`, `PLAN.md`.
12. Implement discovery of `../instructions/*.instructions.md`.
13. Implement a mechanism that adds external reference directories outside the repo to `additionalDirectories`.
14. Generate the common review Prompt.
15. Include the agent definition body in the Prompt.
16. Include target information, target files, and standards/design references in the Prompt.
17. Include output instructions that conform to the JSON schema.
18. Do not include results from other agents in specialist agent Prompts.
19. Generate the Tech Lead adjudication Prompt.
20. Include conflicts JSON in the Tech Lead Prompt.

### Phase 3 Completion Checklist

- [ ] `full` enumerates review target files under the repo.
- [ ] `--target <file>` targets only the specified file.
- [ ] `--target <directory>` targets only files under the specified directory.
- [ ] `--target-dir <directory>` targets only files under the specified directory.
- [ ] `--target-dir <file>` returns exit code `3`.
- [ ] An absolute path outside the repo returns exit code `2`.
- [ ] Zero target files returns exit code `3`.
- [ ] `targetKind` is correctly set to `full` / `file` / `directory`.
- [ ] `targetName` is a slug suitable for report storage.
- [ ] `AGENTS.md` and design reference files are detected only when they exist.
- [ ] When `../instructions/` exists, it can be added to `additionalDirectories`.
- [ ] The specialist review Prompt includes the agent definition, target files, and reference file list.
- [ ] The specialist review Prompt includes an instruction not to modify files.
- [ ] The specialist review Prompt does not include results from other agents.
- [ ] The Tech Lead adjudication Prompt includes conflict information and the Tech Lead definition.
- [ ] Unit tests for TargetResolver and PromptBuilder pass.
- [ ] `npm run build` succeeds.

## 7. Phase 4: Fake Runner and Orchestration

### Phase 4 Implementation Scope

- `src/codex/agent-runner.ts`
- `src/codex/fake-review-runner.ts`
- `src/orchestrator.ts`
- `src/codex/concurrency.ts`

### Phase 4 Implementation Tasks

1. Implement the `AgentRunner` interface.
2. Implement the Fake runner.
3. Implement execution plan generation.
4. Display the execution plan with `dry-run`.
5. Return agent results from the Fake runner.
6. Connect the loader, target resolver, prompt builder, and fake runner from the CLI.
7. Complete the end-to-end flow without calling the Codex SDK yet.
8. Implement `runWithConcurrency`.
9. Use `Promise.allSettled` to continue when some jobs fail.

### Phase 4 Completion Checklist

- [ ] `--dry-run` displays agents, target, files, concurrency.
- [ ] The Fake runner can execute a single agent.
- [ ] The Fake runner can execute multiple agents.
- [ ] The Fake runner generates jobs for all 14 agents with `full`.
- [ ] A case in which the Fake runner returns a result equivalent to invalid JSON can be tested.
- [ ] The CLI generates a minimal integrated result without the SDK.
- [ ] `--concurrency 1` executes sequentially.
- [ ] `--concurrency 7` runs at most 7 jobs concurrently.
- [ ] Other jobs continue when one job fails.
- [ ] A failure of all jobs can be detected.
- [ ] Integration tests pass.
- [ ] `npm run build` succeeds.

## 8. Phase 5: Codex SDK Runner

### Phase 5 Implementation Scope

- `src/codex/codex-client-factory.ts`
- `src/codex/review-runner.ts`
- `src/codex/timeout.ts`
- `src/codex/event-recorder.ts`

### Phase 5 Implementation Tasks

1. Implement `Codex` client creation.
2. Implement `buildCodexEnv`.
3. Implement `ThreadOptions` generation.
4. Set `sandboxMode: "read-only"` as the default.
5. Set `approvalPolicy: "never"` as the default.
6. Set `webSearchMode: "disabled"` as the default.
7. Set `networkAccessEnabled: false` as the default.
8. Pass `additionalDirectories` to `ThreadOptions`.
9. Pass `model` and `modelReasoningEffort` to `ThreadOptions`.
10. Implement review execution with `runStreamed`.
11. Pass `outputSchema`.
12. Implement an `AbortSignal` timeout.
13. Store `thread.id` in the result.
14. Normalize usage into `UsageMetrics`.
15. Apply JSON parse + Zod validation to `finalResponse`.
16. Normalize SDK errors, turn.failed, and error events into `AgentReviewResult`.
17. Implement an event recorder for events JSONL.

### Phase 5 Completion Checklist

- [ ] The `Codex` client can be created.
- [ ] The repo root is set in `ThreadOptions`.
- [ ] `sandboxMode: "read-only"` is set in `ThreadOptions`.
- [ ] `approvalPolicy: "never"` is set in `ThreadOptions`.
- [ ] `networkAccessEnabled: false` is set in `ThreadOptions`.
- [ ] `webSearchMode: "disabled"` is set in `ThreadOptions`.
- [ ] `additionalDirectories` is reflected in `ThreadOptions`.
- [ ] `model` and `modelReasoningEffort` are reflected in `ThreadOptions`.
- [ ] `buildCodexEnv` inherits only the required minimum, including `PATH`, `HOME`, `CODEX_API_KEY`.
- [ ] API keys and environment variable values are not written to logs.
- [ ] `runStreamed` is called.
- [ ] `outputSchema` is passed.
- [ ] `AbortSignal` fires on timeout.
- [ ] JSON is parsed from `agent_message.text`.
- [ ] A Zod validation failure produces Incomplete.
- [ ] Usage is recorded.
- [ ] The thread id is recorded.
- [ ] The event recorder does not store secrets.
- [ ] Unit tests for the SDK Runner pass with mocks.
- [ ] The real Codex SDK E2E runs only when `RUN_CODEX_E2E=true`.
- [ ] `npm run build` succeeds.

## 9. Phase 6: Result Integration and Conflict Detection

### Phase 6 Implementation Scope

- `src/results/result-normalizer.ts`
- `src/results/finding-deduplicator.ts`
- `src/results/verdict-calculator.ts`
- `src/results/conflict-detector.ts`

### Phase 6 Implementation Tasks

1. Normalize agent output into `AgentReviewResult`.
2. Generate `finding.id` with a stable hash.
3. Assign `sourceAgents`.
4. Assign `sourceAgents` to escalations.
5. Implement deduplication.
6. Implement severity maximization.
7. Implement sourceAgents merge.
8. Implement early Critical detection.
9. Implement verdict calculation.
10. Implement defined conflict patterns.
11. Implement detection of undefined conflicts.
12. Implement final exit code evaluation based on `--fail-on`.
13. Implement exit code `4` evaluation when all agents fail.

### Phase 6 Completion Checklist

- [ ] The normalizer assigns `finding.id`.
- [ ] The normalizer assigns `sourceAgents`.
- [ ] Identical findings are deduplicated.
- [ ] The severity of duplicate findings is set to the maximum value.
- [ ] The sourceAgents of duplicate findings are merged.
- [ ] If at least 1 Critical exists, the verdict is `Rejected`.
- [ ] If at least 1 Incomplete exists, the verdict is `Conditional Approval`.
- [ ] If only High findings exist, the verdict is `Conditional Approval`.
- [ ] If only Medium/Low findings exist, the verdict is `Approved with Notes`.
- [ ] If no findings exist, the verdict is `Approved`.
- [ ] With `--fail-on critical`, a Critical finding returns exit code `1`.
- [ ] With `--fail-on high`, a High or higher finding returns exit code `1`.
- [ ] With `--fail-on none`, findings still return exit code `0`.
- [ ] If all agents fail, the exit code is `4`.
- [ ] Defined conflict patterns are detected.
- [ ] Undefined conflicts are identified as candidates.
- [ ] Unit tests for results components pass.
- [ ] `npm run build` succeeds.

## 10. Phase 7: Tech Lead Adjudication

### Phase 7 Implementation Scope

- `src/prompts/adjudication-prompt-builder.ts`
- `src/orchestrator.ts`
- `src/results/conflict-detector.ts`

### Phase 7 Implementation Tasks

1. Skip Tech Lead adjudication when there are no conflicts.
2. Generate a Tech Lead adjudication job when conflicts exist.
3. Run it in a separate thread from the standard `tech-lead` review.
4. Apply the adjudication output schema.
5. Associate the Tech Lead adjudication result with the conflict.
6. Add an escalation when Tech Lead adjudication fails.

### Phase 7 Completion Checklist

- [ ] No adjudication job is generated when there are no conflicts.
- [ ] Exactly 1 adjudication job is generated when conflicts exist.
- [ ] The adjudication job runs in a separate thread from the standard review job.
- [ ] The adjudication result is schema validated.
- [ ] The adjudication result is included in the report model.
- [ ] An adjudication failure is recorded as an escalation.
- [ ] Integration tests for Tech Lead adjudication pass.
- [ ] `npm run build` succeeds.

## 11. Phase 8: Report Output

### Phase 8 Implementation Scope

- `src/reports/markdown-report-generator.ts`
- `src/reports/json-report-generator.ts`
- `src/reports/report-writer.ts`
- `src/reports/event-log-writer.ts`

### Phase 8 Implementation Tasks

1. Generate the Markdown integrated report.
2. Generate the JSON report.
3. Include the SDK execution summary in the report.
4. Generate the findings summary.
5. Generate the Critical/High findings list.
6. Generate the all findings list.
7. Generate escalation items.
8. Generate the conflict resolution record.
9. Generate the design document cross-reference results.
10. Generate incomplete reviews.
11. Generate individual agent detail reports.
12. Implement report path numbering.
13. Do not overwrite existing reports.
14. Save events JSONL.
15. Generate the review date from the current date and time at execution.
16. Generate a storage directory for each `targetName`.
17. Save the `full` report under `full/`.

### Phase 8 Completion Checklist

- [ ] The Markdown report is generated with the structure defined in the specification.
- [ ] The JSON report is generated as `IntegratedReviewReport`.
- [ ] It is saved to `../review-reports/code-review/<target-name>/check-report-<N>.md`.
- [ ] The JSON report is saved with the same `<N>`.
- [ ] The events JSONL is saved with the same `<N>`.
- [ ] When existing reports are present, `N = max + 1`.
- [ ] Existing reports are not overwritten.
- [ ] The review date is output as the current date and time at execution.
- [ ] The report for `--target full` is saved under `full/`.
- [ ] The report for `--target-dir controller` is saved under `controller/`.
- [ ] The SDK execution summary includes the thread id and usage.
- [ ] Incomplete Reviews are displayed.
- [ ] Unit tests for ReportWriter pass.
- [ ] `npm run build` succeeds.

## 12. Phase 9: CI/CD and OSS Quality

### Phase 9 Implementation Scope

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- GitHub Actions workflow
- npm scripts

### Phase 9 Implementation Tasks

1. Document installation in the README.
2. Add CLI examples to the README.
3. Document how to use `--target-dir` in the README.
4. Document Codex SDK/API key configuration in the README.
5. Add a CI/CD example to the README.
6. State in the README, as a security policy, that review target code is not modified.
7. Document the default values `sandboxMode: "read-only"` and `approvalPolicy: "never"` in the README.
8. Add LICENSE.
9. Add CONTRIBUTING.
10. Add a GitHub Actions workflow.
11. Run lint/test/build in CI.
12. Disable the real Codex E2E by default in CI.

### Phase 9 Completion Checklist

- [ ] The README alone explains basic usage.
- [ ] The README includes examples for `full`, a single agent, multiple agents, `--target-dir`.
- [ ] The README documents the required environment variables.
- [ ] The README states the policy of not modifying review target code.
- [ ] The README documents the default sandbox / approval values.
- [ ] CI runs `npm ci`, `npm run lint`, `npm run test`, `npm run build`.
- [ ] The real Codex E2E runs only when `RUN_CODEX_E2E=true`.
- [ ] LICENSE and CONTRIBUTING required for OSS publication are present.
- [ ] `npm run lint` succeeds.
- [ ] `npm run test` succeeds.
- [ ] `npm run build` succeeds.

## 13. Phase 10: E2E and Final Acceptance Validation

### Phase 10 Implementation Scope

- `test/fixtures/java-spring-sample/`
- CLI E2E tests
- optional real Codex SDK E2E
- final acceptance checklist

### Phase 10 Implementation Tasks

1. Create a small Java/Spring fixture.
2. Implement CLI E2E with the Fake runner.
3. Validate `--target full --agents full`.
4. Validate `--target-dir <directory> --agents security`.
5. Validate `--target <path> --agents security,performance,data-access`.
6. Verify that a report is generated even when an agent failure occurs.
7. Validate the Critical verdict.
8. Validate the High verdict.
9. Validate the Medium/Low verdict.
10. Validate conflict + Tech Lead adjudication.
11. Validate report numbering.
12. Validate `--fail-on critical`, `--fail-on high`, `--fail-on none`.
13. Validate exit code `4` when all agents fail.
14. Implement the optional real Codex SDK E2E.
15. Verify against the acceptance criteria in `code-review-spec.md`.

### Phase 10 Completion Checklist

- [ ] `code-review --target full --agents full` generates 14 jobs.
- [ ] `code-review --target <path> --agents security` generates 1 job.
- [ ] `code-review --target-dir <directory> --agents security` targets only the specified directory.
- [ ] `code-review --target <path> --agents security,performance,data-access` generates 3 jobs.
- [ ] Specifying both `--target` and `--target-dir` returns exit code `2`.
- [ ] A report is generated even when 1 agent fails.
- [ ] The presence of a Critical finding produces `Rejected`.
- [ ] High findings only produce `Conditional Approval`.
- [ ] Medium/Low findings only produce `Approved with Notes`.
- [ ] Tech Lead adjudication runs when a conflict exists.
- [ ] Markdown/JSON/events JSONL are saved.
- [ ] Report numbering increases without overwriting existing reports.
- [ ] The exit code for `--fail-on critical` is correct.
- [ ] The exit code for `--fail-on high` is correct.
- [ ] The exit code for `--fail-on none` is correct.
- [ ] If all agents fail, the exit code is `4`.
- [ ] The complete CLI specification is implemented.
- [ ] `--target-dir` is implemented.
- [ ] The 14 agent definitions can be loaded.
- [ ] `full` expands to 14 agents.
- [ ] Concurrent execution of multiple Codex SDK threads is implemented.
- [ ] `runStreamed`, `outputSchema`, `AbortSignal` are used.
- [ ] `sandboxMode: "read-only"` and `approvalPolicy: "never"` are the defaults.
- [ ] Structured output parse/validation is implemented.
- [ ] Invalid JSON is handled as Incomplete.
- [ ] Deduplication and severity maximization are implemented.
- [ ] Conflict detection and Tech Lead adjudication are implemented.
- [ ] The Markdown report is generated.
- [ ] The JSON report is generated.
- [ ] The events JSONL is generated.
- [ ] Report numbering is implemented.
- [ ] Existing reports are not overwritten.
- [ ] CI/CD runs lint/test/build.
- [ ] README, LICENSE, CONTRIBUTING are provided.
- [ ] `npm run lint` succeeds.
- [ ] `npm run test` succeeds.
- [ ] `npm run build` succeeds.

## 14. Recommended Implementation Order

First, complete Phase 1 through Phase 4 with the Fake runner. At that point, the design outside the SDK is nearly complete.

Next, connect the Codex SDK Runner in Phase 5. If issues arise after integrating the SDK, the Fake runner can still verify the correctness of the core application.

Finally, complete integration, adjudication, reporting, CI/CD, and E2E in Phase 6 and later. This order avoids implementing the entire large specification at once and allows completion to be verified at each stage.
<!-- markdownlint-disable MD012 -->

