# Java Code Review Orchestrator

Java Code Review Orchestrator is a TypeScript CLI that uses the Codex SDK to run multiple specialized review agents against Java source code, aggregate their findings, detect conflicts, and write Markdown/JSON reports.

The project is designed for phased automation in development workflows and CI/CD. Each specialist agent reviews independently; when conflicting recommendations are detected, a Tech Lead adjudication job can resolve the conflict in a separate Codex thread.

## Requirements

- Node.js 20 or newer
- npm
- Codex SDK access
- `CODEX_API_KEY` or `OPENAI_API_KEY`
- Agent definition files under `docs/`, including `orchest-code-review.agent.md` and the specialized `orchest-code-review-*.agent.md` files

## Install

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev -- --target full --repo .. --docs ../docs --agents security --dry-run
```

After publishing or linking the package, use the binary:

```bash
code-review --target full --repo /path/to/repo --docs /path/to/repo/docs --agents full
```

## API Key

Set one of the following environment variables before running real Codex SDK reviews:

```bash
export CODEX_API_KEY="..."
# or
export OPENAI_API_KEY="..."
```

The CLI and event logging code must not print API keys or raw environment variable values. SDK event JSONL logging redacts key names that look like tokens, secrets, passwords, credentials, authorization headers, or API keys.

## Basic Usage

Run all available agents against all reviewable Java-related files:

```bash
code-review --target full --agents full --repo /path/to/repo --docs /path/to/repo/docs
```

Run a single agent:

```bash
code-review --target full --agents security --repo /path/to/repo --docs /path/to/repo/docs
```

Run multiple agents:

```bash
code-review --target full --agents security,performance,test-quality --repo /path/to/repo --docs /path/to/repo/docs
```

Review a specific file:

```bash
code-review --target src/main/java/com/example/App.java --agents security --repo /path/to/repo --docs /path/to/repo/docs
```

Review a directory with `--target`:

```bash
code-review --target src/main/java/com/example/controller --agents full --repo /path/to/repo --docs /path/to/repo/docs
```

Review a directory explicitly with `--target-dir`:

```bash
code-review --target-dir src/main/java/com/example/controller --agents security,api-endpoint --repo /path/to/repo --docs /path/to/repo/docs
```

`--target-dir` accepts only directories. If a file path is provided, the CLI exits with code `3`.

## Output

Reports are written to:

```text
../review-reports/code-review/<target-name>/check-report-<N>.md
../review-reports/code-review/<target-name>/check-report-<N>.json
../review-reports/code-review/<target-name>/check-report-<N>.events.jsonl
```

Use `--out` to choose another output root:

```bash
code-review --target full --agents full --repo /path/to/repo --docs /path/to/repo/docs --out /tmp/code-review-reports
```

Existing reports are not overwritten. The next report number is `max(existing check-report-*.md) + 1`.

## Review Scope

The resolver includes:

- `**/*.java`
- `**/pom.xml`
- `**/application*.properties`
- `**/application*.yml`
- `**/application*.yaml`
- `**/*Application.java`
- `**/*Config.java`
- `**/SecurityConfig.java`
- `**/db/migration/*.sql`
- `**/Dockerfile`
- `**/.dockerignore`

Excluded directories include `.git`, `node_modules`, `target`, `build`, `dist`, `.gradle`, `.idea`, `.vscode`, and `review-reports`.

## Safety Defaults

This tool is for review only. Specialist prompts explicitly instruct agents: do not modify files.

The Codex SDK thread defaults are intentionally conservative:

- `sandboxMode: "read-only"`
- `approvalPolicy: "never"`
- `networkAccessEnabled: false`
- `webSearchMode: "disabled"`
- `modelReasoningEffort: "high"`

These defaults reduce the risk of changing review target code, hanging on interactive approvals, or producing inconsistent results from live external information.

## CLI Options

| Option | Description |
|---|---|
| `--target <path|full>` | Review `full`, a file, or a directory |
| `--target-dir <directory>` | Review a directory explicitly |
| `--agents <name[,name]|full>` | Agent selection |
| `--repo <path>` | Repository root |
| `--docs <path>` | Agent definition directory |
| `--out <path>` | Report output root |
| `--concurrency <number>` | Maximum parallel agent reviews, default `7` |
| `--timeout-ms <number>` | Per-agent timeout, default `900000` |
| `--model <model>` | Codex model override |
| `--reasoning <minimal|low|medium|high|xhigh>` | Reasoning effort |
| `--sandbox <read-only|workspace-write|danger-full-access>` | Sandbox mode, default `read-only` |
| `--web-search <disabled|cached|live>` | Web search mode, default `disabled` |
| `--format <markdown|json|both>` | Report format preference |
| `--fail-on <critical|high|none>` | Exit code failure threshold |
| `--skip-git-repo-check` | Skip Codex git repo check |
| `--dry-run` | Print execution plan only |
| `--verbose` | Enable verbose logs |

## Exit Codes

| Code | Meaning |
|---:|---|
| `0` | Review completed and `--fail-on` condition was not met |
| `1` | Review completed and `--fail-on` condition was met |
| `2` | CLI argument, agent definition, or configuration error |
| `3` | Review target error or zero reviewable files |
| `4` | All agent reviews failed |
| `5` | Report write error |

## CI/CD Example

```yaml
name: Java Code Review

on:
  pull_request:
    paths:
      - "**/*.java"
      - "**/pom.xml"
      - "**/application*.yml"
      - "**/application*.properties"

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npx code-review --target full --agents full --fail-on critical
        env:
          CODEX_API_KEY: ${{ secrets.CODEX_API_KEY }}
```

Real Codex SDK E2E tests are disabled by default. Run them explicitly with:

```bash
RUN_CODEX_E2E=true npm run test:e2e:codex
```

## Development

```bash
npm run lint
npm run test
npm run build
npm run ci
```

## License

Apache-2.0. See [LICENSE](./LICENSE).
