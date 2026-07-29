# Contributing

Thank you for helping improve Java Code Review Orchestrator.

## Development Setup

```bash
npm install
npm run build
npm run test
npm run lint
```

Use Node.js 20 or newer.

## Quality Bar

- Keep TypeScript strict and readable.
- Prefer small pure functions for parsing, target resolution, prompt generation, result integration, and report generation.
- Keep Codex SDK calls isolated under `src/codex/`.
- Do not log API keys, tokens, secrets, or raw environment variable values.
- Do not modify review target source code during reviews.
- Add or update tests for behavior changes.

## Tests

Normal tests use fake or mocked Codex execution:

```bash
npm run test
```

Real Codex SDK E2E tests are opt-in:

```bash
RUN_CODEX_E2E=true npm run test:e2e:codex
```

Do not enable real Codex E2E by default in CI.

## Pull Requests

Before opening a pull request:

```bash
npm run ci
npm audit --audit-level=moderate
npm pack --dry-run
```

Include a short summary, testing notes, and any security or behavior implications.

## Release Checklist

- Confirm `npm run ci` passes, including line and branch coverage thresholds of 80% or higher.
- Confirm `npm audit --audit-level=moderate` has no actionable production dependency findings.
- Confirm `npm pack --dry-run` only includes `dist/**/*.js`, `dist/**/*.d.ts`, package metadata, and user-facing docs.
- Verify no `.env`, API key, token, generated report, coverage artifact, test fixture build output, or source map is included in the package.
- Set package repository, homepage, and issue tracker metadata when the public repository URL is finalized.
