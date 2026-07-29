# Codex SDK Java Code Review Orchestrator 実装計画

## 1. 目的

この実装計画は、`spec-design/code-review-spec.md` に記載された Codex SDK TypeScript 版によるマルチ・エージェント Java ソースコードレビューアプリケーションを、段階的かつ漏れなく実装するための計画である。

仕様書は範囲が広いため、実装を 10 フェーズに分割する。各フェーズでは、実装対象、実装タスク、完了チェック項目を明確にし、次フェーズへ進む前に抜け漏れを確認する。

## 2. 実装方針

- 10 フェーズで段階的に実装する。
- Codex SDK 実行前に、CLI、型、エージェント定義、対象解決、Prompt 生成を先に安定させる。
- Codex SDK 呼び出し部分は境界を明確にし、Fake runner でテスト可能にする。
- 実 Codex SDK を使う E2E は最後に任意実行として追加する。
- 各フェーズ終了時に `npm run build` と該当テストを実行する。
- 各フェーズ終了時に、そのフェーズが参照する `code-review-spec.md` の章と照合する。
- 仕様変更が必要になった場合は、実装前に `code-review-spec.md` と本計画を更新する。

## 2.1 共通完了ゲート

各フェーズの完了チェックに加えて、次を毎回確認する。

- [ ] このフェーズの成果物が `code-review-spec.md` の対応章と矛盾していない。
- [ ] このフェーズで追加した公開 API または CLI 挙動が README/計画/仕様のいずれかに反映されている。
- [ ] 既存テストがすべて成功している。
- [ ] `npm run build` が成功している。
- [ ] 仕様から外れた暫定実装が残っていない。

## 3. フェーズ一覧

| Phase | 名称 | 主な成果 |
|---:|---|---|
| 1 | プロジェクト基盤・型・スキーマ | TypeScript CLI 骨格、データモデル、Zod/JSON schema |
| 2 | CLI・エージェント定義 | CLI 解析、バリデーション、agent loader/registry |
| 3 | レビュー対象解決・Prompt 生成 | full/file/directory/target-dir 解決、レビュー Prompt |
| 4 | Fake Runner・オーケストレーション | SDK なしで実行フローを完成 |
| 5 | Codex SDK Runner | `runStreamed`、thread、timeout、usage、events |
| 6 | 結果統合・競合検出 | normalizer、dedup、verdict、conflict、exit code |
| 7 | Tech Lead 裁定 | conflict がある場合の追加 thread 実行 |
| 8 | レポート出力 | Markdown、JSON、events JSONL、採番 |
| 9 | CI/CD・OSS 品質 | README、lint/test/build、GitHub Actions |
| 10 | E2E・最終受け入れ検証 | 仕様書の受け入れ基準確認 |

## 3.1 仕様書対応表

| Phase | 対応する `code-review-spec.md` の章 |
|---:|---|
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

## 4. Phase 1: プロジェクト基盤・型・スキーマ

### 実装対象

- `package.json`
- `tsconfig.json`
- ESLint / Vitest 設定
- `src/cli.ts`
- `src/config/defaults.ts`
- `src/agents/agent-types.ts`
- `src/results/review-schema.ts`
- `src/utils/errors.ts`
- `test/` 基本構成

### 実装タスク

1. TypeScript CLI プロジェクトの骨格を作成する。
2. `@openai/codex-sdk` を実装時点の exact version で追加する。
3. `commander`、`fast-glob`、`gray-matter`、`zod`、`zod-to-json-schema` を追加する。
4. `typescript`、`tsx`、`vitest`、`eslint`、`@types/node` を追加する。
5. `npm run build`、`npm run test`、`npm run lint` を定義する。
6. `src/cli.ts` を作成し、仮の `--help` が表示できる状態にする。
7. `Severity` と severity rank を実装する。
8. `AgentDefinition`、`ReviewTarget`、`TargetInput`、`AppOptions` を実装する。
9. `Finding`、`UsageMetrics`、`EscalationItem`、`DesignDeviation` を実装する。
10. `AgentReviewResult`、`Conflict`、`AdjudicationResult` を実装する。
11. `ReviewJob`、`ReviewExecutionPlan`、`ReviewEventSink` を実装する。
12. Zod schema を実装する。
13. `zod-to-json-schema` で Codex SDK 用 output schema を生成する。
14. `CliError` を実装する。

### 完了チェック

- [ ] `package.json` に必要な dependencies/devDependencies が定義されている。
- [ ] `@openai/codex-sdk` が exact version で固定されている。
- [ ] `tsconfig.json` で `strict: true` が有効である。
- [ ] `npx tsx src/cli.ts --help` が実行できる。
- [ ] `code-review-spec.md` の全データモデルが TypeScript 型として実装されている。
- [ ] Zod schema と TypeScript 型の対応が取れている。
- [ ] `agentReviewOutputSchema` が生成される。
- [ ] `adjudicationOutputSchema` が生成される。
- [ ] `Finding.sourceAgents`、`Finding.id` は normalizer 付与項目として schema から除外されている。
- [ ] `EscalationItem.sourceAgents` は normalizer 付与項目として schema から除外されている。
- [ ] `CliError` が exit code を保持できる。
- [ ] schema validation の単体テストが成功する。
- [ ] `npm run lint` が成功する。
- [ ] `npm run test` が成功する。
- [ ] `npm run build` が成功する。

## 5. Phase 2: CLI・エージェント定義

### 実装対象

- `src/cli.ts`
- `src/config/defaults.ts`
- `src/utils/path-utils.ts`
- `src/utils/errors.ts`
- `src/agents/agent-definition-loader.ts`
- `src/agents/agent-registry.ts`

### 実装タスク

1. `commander` で CLI 引数を定義する。
2. `--target <path|full>` を実装する。
3. `--target-dir <directory>` を実装する。
4. `--agents <name[,name]|full>` を実装する。
5. `--repo`、`--docs`、`--out` を実装する。
6. `--concurrency`、`--timeout-ms` を実装する。
7. `--model`、`--reasoning`、`--sandbox`、`--web-search` を実装する。
8. `--format`、`--fail-on`、`--skip-git-repo-check`、`--dry-run`、`--verbose` を実装する。
9. CLI バリデーションを実装する。
10. CLI 入力を `AppOptions` へ正規化する。
11. `gray-matter` で front matter を解析する。
12. `docs/orchest-code-review.agent.md` を orchestrator definition として読み込む。
13. `docs/orchest-code-review-*.agent.md` を agent definition として読み込む。
14. `orchest-code-review.agent.md` を agent list から除外する。
15. agent ID を正規化する。
16. `orchest-code-review-` 接頭辞の有無を吸収する。
17. 全 14 エージェントが存在することを検証する。
18. `tech-lead` が存在することを検証する。
19. `full` を 14 エージェントへ展開する。
20. 不明な agent 指定を exit code `2` にする。

### 完了チェック

- [ ] `--target` と `--target-dir` の片方だけが必須である。
- [ ] `--target` と `--target-dir` の同時指定で exit code `2` になる。
- [ ] `--concurrency < 1` で exit code `2` になる。
- [ ] `--timeout-ms < 1000` で exit code `2` になる。
- [ ] `--sandbox` の許可値以外で exit code `2` になる。
- [ ] `--web-search` の許可値以外で exit code `2` になる。
- [ ] `--reasoning` の許可値以外で exit code `2` になる。
- [ ] `--format` の許可値以外で exit code `2` になる。
- [ ] `--fail-on` の許可値以外で exit code `2` になる。
- [ ] `--repo` が存在しない場合 exit code `2` になる。
- [ ] `--docs` が存在しない場合 exit code `2` になる。
- [ ] 14 個の専門エージェント定義が読み込まれる。
- [ ] orchestrator definition は専門エージェント数に含まれない。
- [ ] `tech-lead` が registry に存在する。
- [ ] `full` 指定で 14 エージェントへ展開される。
- [ ] `security` と `orchest-code-review-security` が同じ agent に解決される。
- [ ] `.agent.md` 付き指定はエラーになる。
- [ ] 不明な agent 指定は exit code `2` になる。
- [ ] CLI、loader、registry の単体テストが成功する。
- [ ] `npm run build` が成功する。

## 6. Phase 3: レビュー対象解決・Prompt 生成

### 実装対象

- `src/targets/file-patterns.ts`
- `src/targets/target-resolver.ts`
- `src/utils/path-utils.ts`
- `src/prompts/review-prompt-builder.ts`
- `src/prompts/adjudication-prompt-builder.ts`

### 実装タスク

1. レビュー対象ファイルパターンを実装する。
2. 除外ディレクトリを実装する。
3. `--target full` の解決を実装する。
4. `--target <file>` の解決を実装する。
5. `--target <directory>` の解決を実装する。
6. `--target-dir <directory>` の解決を実装する。
7. repo 外絶対パスを拒否する。
8. `targetName` 生成を実装する。
9. `AGENTS.md` 探索を実装する。
10. `design-docs/**` 探索を実装する。
11. `docs/migration/DESIGN.md`、`PLAN.md` 探索を実装する。
12. `../instructions/*.instructions.md` 探索を実装する。
13. `additionalDirectories` に repo 外参照ディレクトリを追加する仕組みを実装する。
14. 共通レビュー Prompt を生成する。
15. agent definition body を Prompt に含める。
16. target 情報、target files、standards/design references を Prompt に含める。
17. JSON schema に従う出力指示を含める。
18. 専門エージェント Prompt には他エージェント結果を含めない。
19. Tech Lead 裁定 Prompt を生成する。
20. conflicts JSON を Tech Lead Prompt に含める。

### 完了チェック

- [ ] `full` で repo 配下のレビュー対象ファイルが列挙される。
- [ ] `--target <file>` で指定ファイルだけが対象になる。
- [ ] `--target <directory>` で指定ディレクトリ配下だけが対象になる。
- [ ] `--target-dir <directory>` で指定ディレクトリ配下だけが対象になる。
- [ ] `--target-dir <file>` は exit code `3` になる。
- [ ] repo 外の絶対パスは exit code `2` になる。
- [ ] 対象ファイル 0 件は exit code `3` になる。
- [ ] `targetKind` が `full` / `file` / `directory` のいずれかに正しく設定される。
- [ ] `targetName` がレポート保存に使える slug になる。
- [ ] `AGENTS.md` と設計参照ファイルが存在する場合だけ検出される。
- [ ] `../instructions/` が存在する場合、`additionalDirectories` に反映できる。
- [ ] 専門レビュー Prompt に agent definition、target files、参照ファイル一覧が含まれる。
- [ ] 専門レビュー Prompt に「ファイルを変更しない」指示が含まれる。
- [ ] 専門レビュー Prompt に他エージェント結果が含まれない。
- [ ] Tech Lead 裁定 Prompt に conflict 情報と Tech Lead definition が含まれる。
- [ ] TargetResolver と PromptBuilder の単体テストが成功する。
- [ ] `npm run build` が成功する。

## 7. Phase 4: Fake Runner・オーケストレーション

### 実装対象

- `src/codex/agent-runner.ts`
- `src/codex/fake-review-runner.ts`
- `src/orchestrator.ts`
- `src/codex/concurrency.ts`

### 実装タスク

1. `AgentRunner` interface を実装する。
2. Fake runner を実装する。
3. execution plan 生成を実装する。
4. `dry-run` で execution plan を表示する。
5. Fake runner で agent results を返す。
6. CLI から loader、target resolver、prompt builder、fake runner を接続する。
7. まだ Codex SDK を呼ばずに end-to-end の流れを完成させる。
8. `runWithConcurrency` を実装する。
9. `Promise.allSettled` で一部 job 失敗時も継続する仕組みを実装する。

### 完了チェック

- [ ] `--dry-run` で agents、target、files、concurrency が表示される。
- [ ] Fake runner で単一 agent 実行ができる。
- [ ] Fake runner で複数 agent 実行ができる。
- [ ] Fake runner で `full` 14 agent の job が生成される。
- [ ] Fake runner が不正 JSON 相当の結果を返すケースをテストできる。
- [ ] CLI から SDK なしで最小の統合結果が生成される。
- [ ] `--concurrency 1` で逐次実行される。
- [ ] `--concurrency 7` で最大 7 並列になる。
- [ ] 1 job が失敗しても他 job が継続する。
- [ ] 全 job が失敗した場合を検出できる。
- [ ] 結合テストが成功する。
- [ ] `npm run build` が成功する。

## 8. Phase 5: Codex SDK Runner

### 実装対象

- `src/codex/codex-client-factory.ts`
- `src/codex/review-runner.ts`
- `src/codex/timeout.ts`
- `src/codex/event-recorder.ts`

### 実装タスク

1. `Codex` client 生成を実装する。
2. `buildCodexEnv` を実装する。
3. `ThreadOptions` 生成を実装する。
4. `sandboxMode: "read-only"` を既定にする。
5. `approvalPolicy: "never"` を既定にする。
6. `webSearchMode: "disabled"` を既定にする。
7. `networkAccessEnabled: false` を既定にする。
8. `additionalDirectories` を `ThreadOptions` に渡す。
9. `model` と `modelReasoningEffort` を `ThreadOptions` に渡す。
10. `runStreamed` によるレビュー実行を実装する。
11. `outputSchema` を渡す。
12. `AbortSignal` timeout を実装する。
13. `thread.id` を結果に保存する。
14. usage を `UsageMetrics` に正規化する。
15. `finalResponse` を JSON parse + Zod validation する。
16. SDK error、turn.failed、error event を `AgentReviewResult` に正規化する。
17. events JSONL 用の event recorder を実装する。

### 完了チェック

- [ ] `Codex` client が生成できる。
- [ ] `ThreadOptions` に repo root が設定される。
- [ ] `ThreadOptions` に `sandboxMode: "read-only"` が設定される。
- [ ] `ThreadOptions` に `approvalPolicy: "never"` が設定される。
- [ ] `ThreadOptions` に `networkAccessEnabled: false` が設定される。
- [ ] `ThreadOptions` に `webSearchMode: "disabled"` が設定される。
- [ ] `ThreadOptions` に `additionalDirectories` が反映される。
- [ ] `ThreadOptions` に `model` と `modelReasoningEffort` が反映される。
- [ ] `buildCodexEnv` が `PATH`、`HOME`、`CODEX_API_KEY` など必要最小限を引き継ぐ。
- [ ] API key や環境変数値がログに出力されない。
- [ ] `runStreamed` が呼び出される。
- [ ] `outputSchema` が渡される。
- [ ] timeout 時に `AbortSignal` が発火する。
- [ ] `agent_message.text` から JSON が parse される。
- [ ] Zod validation 失敗時は Incomplete になる。
- [ ] usage が記録される。
- [ ] thread id が記録される。
- [ ] event recorder が秘密情報を保存しない。
- [ ] SDK Runner の単体テストは mock で成功する。
- [ ] 実 Codex SDK E2E は `RUN_CODEX_E2E=true` のときだけ実行される。
- [ ] `npm run build` が成功する。

## 9. Phase 6: 結果統合・競合検出

### 実装対象

- `src/results/result-normalizer.ts`
- `src/results/finding-deduplicator.ts`
- `src/results/verdict-calculator.ts`
- `src/results/conflict-detector.ts`

### 実装タスク

1. agent output を `AgentReviewResult` に正規化する。
2. `finding.id` を stable hash で生成する。
3. `sourceAgents` を付与する。
4. escalation に `sourceAgents` を付与する。
5. 重複排除を実装する。
6. severity 最大化を実装する。
7. sourceAgents merge を実装する。
8. Critical 早期検出を実装する。
9. verdict 計算を実装する。
10. 定義済み conflict pattern を実装する。
11. 未定義 conflict 検出を実装する。
12. `--fail-on` に基づく最終 exit code 判定を実装する。
13. 全 agent 失敗時の exit code `4` 判定を実装する。

### 完了チェック

- [ ] normalizer が `finding.id` を付与する。
- [ ] normalizer が `sourceAgents` を付与する。
- [ ] 同一 finding が重複排除される。
- [ ] 重複 finding の severity は最大値になる。
- [ ] 重複 finding の sourceAgents が merge される。
- [ ] Critical が 1 件以上なら verdict は `Rejected` になる。
- [ ] Incomplete が 1 件以上なら verdict は `Conditional Approval` になる。
- [ ] High のみなら verdict は `Conditional Approval` になる。
- [ ] Medium/Low のみなら verdict は `Approved with Notes` になる。
- [ ] finding なしなら verdict は `Approved` になる。
- [ ] `--fail-on critical` で Critical がある場合 exit code `1` になる。
- [ ] `--fail-on high` で High 以上がある場合 exit code `1` になる。
- [ ] `--fail-on none` では finding があっても exit code `0` になる。
- [ ] 全 agent 失敗時は exit code `4` になる。
- [ ] 定義済み conflict pattern が検出される。
- [ ] 未定義 conflict が候補化される。
- [ ] results 系の単体テストが成功する。
- [ ] `npm run build` が成功する。

## 10. Phase 7: Tech Lead 裁定

### 実装対象

- `src/prompts/adjudication-prompt-builder.ts`
- `src/orchestrator.ts`
- `src/results/conflict-detector.ts`

### 実装タスク

1. conflict がない場合は Tech Lead 裁定をスキップする。
2. conflict がある場合は Tech Lead 裁定 job を生成する。
3. 通常 `tech-lead` レビューとは別 thread で実行する。
4. adjudication output schema を適用する。
5. Tech Lead 裁定結果を conflict に紐づける。
6. Tech Lead 裁定失敗時は escalation に追加する。

### 完了チェック

- [ ] conflict なしでは裁定 job が生成されない。
- [ ] conflict ありでは裁定 job が 1 件生成される。
- [ ] 裁定 job は通常レビュー job と別 thread で実行される。
- [ ] adjudication result が schema validation される。
- [ ] adjudication result が report model に含まれる。
- [ ] 裁定失敗時は escalation に記録される。
- [ ] Tech Lead 裁定の結合テストが成功する。
- [ ] `npm run build` が成功する。

## 11. Phase 8: レポート出力

### 実装対象

- `src/reports/markdown-report-generator.ts`
- `src/reports/json-report-generator.ts`
- `src/reports/report-writer.ts`
- `src/reports/event-log-writer.ts`

### 実装タスク

1. Markdown integrated report を生成する。
2. JSON report を生成する。
3. SDK execution summary を report に含める。
4. findings summary を生成する。
5. Critical/High findings list を生成する。
6. all findings list を生成する。
7. escalation items を生成する。
8. conflict resolution record を生成する。
9. design document cross-reference results を生成する。
10. incomplete reviews を生成する。
11. individual agent detail reports を生成する。
12. report path 採番を実装する。
13. 既存 report を上書きしない。
14. events JSONL を保存する。
15. review date を実行時の現在日時から生成する。
16. `targetName` ごとの保存ディレクトリを生成する。
17. `full` の report は `full/` 配下に保存する。

### 完了チェック

- [ ] Markdown report が仕様書の構成で生成される。
- [ ] JSON report が `IntegratedReviewReport` として生成される。
- [ ] `../review-reports/code-review/<target-name>/check-report-<N>.md` に保存される。
- [ ] JSON report が同じ `<N>` で保存される。
- [ ] events JSONL が同じ `<N>` で保存される。
- [ ] 既存 report がある場合、`N = max + 1` になる。
- [ ] 既存 report は上書きされない。
- [ ] review date が実行時の現在日時で出力される。
- [ ] `--target full` の report は `full/` 配下に保存される。
- [ ] `--target-dir controller` の report は `controller/` 配下に保存される。
- [ ] SDK execution summary に thread id と usage が含まれる。
- [ ] Incomplete Reviews が表示される。
- [ ] ReportWriter の単体テストが成功する。
- [ ] `npm run build` が成功する。

## 12. Phase 9: CI/CD・OSS 品質

### 実装対象

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- GitHub Actions workflow
- npm scripts

### 実装タスク

1. README に install 方法を書く。
2. README に CLI examples を書く。
3. README に `--target-dir` の使い方を書く。
4. README に Codex SDK/API key 設定を書く。
5. README に CI/CD 例を書く。
6. セキュリティ方針として、レビュー対象コードを変更しないことを README に明記する。
7. `sandboxMode: "read-only"` と `approvalPolicy: "never"` の既定値を README に明記する。
8. LICENSE を追加する。
9. CONTRIBUTING を追加する。
10. GitHub Actions workflow を追加する。
11. lint/test/build を CI で実行する。
12. 実 Codex E2E は CI 既定では無効にする。

### 完了チェック

- [ ] README だけで基本利用方法が分かる。
- [ ] README に `full`、単一 agent、複数 agent、`--target-dir` の例がある。
- [ ] README に必要な環境変数が記載されている。
- [ ] README にレビュー対象コードを変更しない方針が記載されている。
- [ ] README に sandbox / approval の既定値が記載されている。
- [ ] CI で `npm ci`、`npm run lint`、`npm run test`、`npm run build` が実行される。
- [ ] 実 Codex E2E は `RUN_CODEX_E2E=true` のときだけ実行される。
- [ ] OSS 公開に必要な LICENSE と CONTRIBUTING がある。
- [ ] `npm run lint` が成功する。
- [ ] `npm run test` が成功する。
- [ ] `npm run build` が成功する。

## 13. Phase 10: E2E・最終受け入れ検証

### 実装対象

- `test/fixtures/java-spring-sample/`
- CLI E2E tests
- optional real Codex SDK E2E
- final acceptance checklist

### 実装タスク

1. 小さな Java/Spring fixture を作成する。
2. Fake runner で CLI E2E を実装する。
3. `--target full --agents full` を検証する。
4. `--target-dir <directory> --agents security` を検証する。
5. `--target <path> --agents security,performance,data-access` を検証する。
6. agent failure があっても report が生成されることを検証する。
7. Critical verdict を検証する。
8. High verdict を検証する。
9. Medium/Low verdict を検証する。
10. conflict + Tech Lead adjudication を検証する。
11. report 採番を検証する。
12. `--fail-on critical`、`--fail-on high`、`--fail-on none` を検証する。
13. 全 agent 失敗時の exit code `4` を検証する。
14. optional real Codex SDK E2E を実装する。
15. `code-review-spec.md` の受け入れ基準と照合する。

### 完了チェック

- [ ] `code-review --target full --agents full` で 14 job が生成される。
- [ ] `code-review --target <path> --agents security` で 1 job が生成される。
- [ ] `code-review --target-dir <directory> --agents security` で指定 directory のみ対象になる。
- [ ] `code-review --target <path> --agents security,performance,data-access` で 3 job が生成される。
- [ ] `--target` と `--target-dir` の同時指定は exit code `2` になる。
- [ ] 1 agent 失敗時も report が生成される。
- [ ] Critical ありで `Rejected` になる。
- [ ] High のみで `Conditional Approval` になる。
- [ ] Medium/Low のみで `Approved with Notes` になる。
- [ ] conflict ありで Tech Lead 裁定が実行される。
- [ ] Markdown/JSON/events JSONL が保存される。
- [ ] report 採番が上書きなしで増加する。
- [ ] `--fail-on critical` の exit code が正しい。
- [ ] `--fail-on high` の exit code が正しい。
- [ ] `--fail-on none` の exit code が正しい。
- [ ] 全 agent 失敗時は exit code `4` になる。
- [ ] CLI 仕様がすべて実装されている。
- [ ] `--target-dir` が実装されている。
- [ ] 14 エージェント定義が読み込める。
- [ ] `full` が 14 エージェントに展開される。
- [ ] Codex SDK の複数 thread 並列実行が実装されている。
- [ ] `runStreamed`、`outputSchema`、`AbortSignal` が利用されている。
- [ ] `sandboxMode: "read-only"` と `approvalPolicy: "never"` が既定である。
- [ ] Structured output の parse/validation が実装されている。
- [ ] 不正 JSON は Incomplete として扱われる。
- [ ] 重複排除と severity 最大化が実装されている。
- [ ] conflict detection と Tech Lead adjudication が実装されている。
- [ ] Markdown report が生成される。
- [ ] JSON report が生成される。
- [ ] events JSONL が生成される。
- [ ] report 採番が実装されている。
- [ ] 既存 report を上書きしない。
- [ ] CI/CD で lint/test/build が実行される。
- [ ] README、LICENSE、CONTRIBUTING が整備されている。
- [ ] `npm run lint` が成功する。
- [ ] `npm run test` が成功する。
- [ ] `npm run build` が成功する。

## 14. 推奨実装順序

まず Phase 1 から Phase 4 までを Fake runner で完了させる。ここまでで、SDK 以外の設計がほぼ完成する。

次に Phase 5 で Codex SDK Runner を接続する。SDK 接続後に問題が出た場合でも、Fake runner でアプリケーション本体の正しさを確認できる。

最後に Phase 6 以降で統合、裁定、レポート、CI/CD、E2E を固める。この順序により、大きな仕様を一度に抱えず、各段階で完了状態を確認しながら進められる。

