# AGENTS.md

このリポジトリで作業する AI エージェントは、`Codex Ski Shop Zero Hit Radar` を OSS として公開できる品質で実装することを最優先する。

## 共通の品質基準

- UX が壊れていないことを、主要画面の手動確認または E2E テストで確認する。
- 実際に起動し、主要ユーザージャーニーが動作する状態で完了する。
- TODO、FIXME、仮実装、ダミー実装、未接続の UI、押しても動かない主要ボタンを残さない。
- 読みやすく、理解しやすい構成・命名・コメントを維持する。
- OSS として公開しても問題ないように、秘密情報、個人情報、ライセンス不明のコピーコードを含めない。
- テストカバレッジは line coverage と branch coverage の両方で 80% 以上を目標にする。届かない場合は、未達理由と追加すべきテストを明記する。
- 仕様は `spec-design/zero-hit-radar-requirment.md`、`spec-design/backend-design.md`、`spec-design/front-design.md` を優先する。
- レビュー観点は `docs/orchest-code-review*.agent.md` を参考にする。
- API、DB schema、認証仕様、画面遷移を変更する場合は、関連する設計書、型定義、テストを同時に更新する。
- 依存関係を追加する前に、標準機能または既存依存で実現できないか確認する。
- 生成 AI や外部 API を使う処理は、キー未設定、タイムアウト、失敗時にもデモ全体が破綻しない fallback を用意する。

## 技術別 AGENTS

実装対象に応じて、次の技術別指示も必ず読む。

- Java / Spring Boot: `docs/agents/java/AGENTS.md`
- Next.js: `docs/agents/nextjs/AGENTS.md`
- TypeScript: `docs/agents/typescript/AGENTS.md`

複数技術にまたがる変更では、該当するすべての AGENTS.md を適用する。

将来 `backend/`、`frontend/` など実装ディレクトリを作成する場合は、該当する技術別 AGENTS.md をそのディレクトリ直下へコピーするか、ルートの `AGENTS.md` から明示的に参照できる状態を維持する。

## セキュリティと公開品質

- `.env`、API key、token、password、個人情報、社内情報をコミットしない。
- サンプル設定は `.env.example` などに置き、実秘密情報を含めない。
- 外部から入力される値は、フロントエンドとバックエンドの両方で検証する。
- エラー表示では内部実装、SQL、token、stack trace をユーザーに見せない。
- OSS 公開を想定し、README、起動手順、テスト手順、ライセンス表記に矛盾がないようにする。

## 完了条件

- ビルド、静的解析、テストが成功している。
- フロントエンドの主要画面が崩れていない。
- バックエンド API が設計書どおりに応答する。
- Docker またはローカル起動手順で再現可能である。
- 例外、空状態、ロード中、認証失敗、API 失敗の UX が自然に見える。
- public API、public メソッド、重要なドメインロジックには理解しやすいコメントを付ける。
- 実行できなかった確認項目がある場合は、理由と残リスクを明記する。
