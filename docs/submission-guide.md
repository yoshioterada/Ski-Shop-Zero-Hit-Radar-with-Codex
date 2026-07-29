# 提出ガイド

このガイドは `Codex Ski Shop Zero Hit Radar` の最終提出に向けた引き渡しチェックリストです。

## 必須提出物

- Git リポジトリ、または ZIP ファイルとして提出できるコード。
- ログイン/認可、永続化、意味のあるテスト、プログラム的な Codex 利用を含む、動作するアプリケーション。
- 音声付きの約 5 分間のデスクトップ録画。
- 評価者が承認なしで閲覧できる動画リンク。

## コード提出チェックリスト

- 合理的に実行できる範囲で、品質ゲートをすべて実行してください。

```bash
cd backend && ./mvnw verify
cd ../frontend && npm run lint && npm run typecheck && npm test && npm run build && npm run e2e
cd ../code-review && npm run ci
```

- Docker Compose でアプリを起動し、主要ジャーニーを手動確認してください。

```bash
cp .env.example .env
docker compose up --build
```

- 次のジャーニーを確認してください。
  - Storefront が `http://localhost:3000` で表示される。
  - 既存の商品名またはメーカー名で商品検索結果が返る。
  - 存在しない一意のキーワードで商品検索すると Zero Hit が記録される。
  - 設定済みのデモアカウントで管理者ログインに成功する。
  - Zero Hit Radar に記録したキーワードが表示される。
  - `AI_API_KEY` が空の場合でも、AI consultation が provider response または fallback response を返す。

- ZIP 作成またはリポジトリ push の前に、ignored/local file が含まれていないことを確認してください。

```bash
git status --short --ignored
```

`.env`、`.DS_Store`、`node_modules/`、`.next/`、`target/`、`coverage/`、`playwright-report/`、`test-results/` は含めないでください。

## ZIP 提出

提出対象ファイルを commit した後、`git archive` を使って ZIP を作成してください。

```bash
git archive --format=zip --output codex-ski-shop-zero-hit-radar.zip HEAD
```

まだ commit がない場合は、working directory 全体を ZIP 化せず、明示的に filter したファイルリストから ZIP を作成してください。

## 動画構成

全体で 4:30 から 5:30 程度を目安にしてください。

| 時間 | セクション | 見せる内容 |
| --- | --- | --- |
| `0:00-0:30` | コンテキスト | アプリ概要、4 時間制限、中心となるアイデアを簡潔に説明する。 |
| `0:30-2:30` | デモ | Storefront、検索、Zero Hit 記録、管理者ログイン、ダッシュボード、AI consultation fallback。 |
| `2:30-4:30` | 作り方 | 仕様駆動の計画、backend/frontend 分割、永続化、認証、テスト、Docker Compose。 |
| `4:30-5:00` | Codex 利用 | `code-review/` CLI を見せ、Codex SDK による multi-agent review workflow を説明する。 |

締めの一言の例:

```text
このデモは指定された 4 時間の制限内で構築し、広いが未完成な機能よりも、見える主要ユーザージャーニーを完結させることを優先しました。
```

## Loom 設定

録画には Loom の利用を推奨します。共有設定は次の状態にしてください。

```text
Anyone with the link can view
```

提出前に、動画リンクをプライベートブラウザウィンドウで開いて確認してください。

## 提出前チェック

提出形式、5 分前後のデモ動画構成、Loom の共有設定、ZIP 作成時の除外対象はこのドキュメントにまとめています。

提出前には少なくとも次を確認してください。

- Git または ZIP に `.env`、生成物、coverage report、ローカル実行 artifact が含まれていない。
- 動画は「アプリのデモ」と「Codex を使った構築プロセス」の 2 セクションを含んでいる。
- Loom などの動画リンクは `Anyone with the link can view` 相当で開ける。
- `code-review/` が Codex SDK をアプリ内ワークフローとしてプログラム的に使う要件の説明材料になっている。

## OSS 公開前チェックリスト

公開または外部共有前に、少なくとも次を確認してください。

- `.env`、実 API key、token、password、個人情報、社内情報をコミットしていない。
- 過去にローカル設定へ貼り付けた秘密情報がある場合は、該当キーを rotate している。
- `.env.example` には開発用サンプル値のみが含まれている。
- デモ用認証情報が本番用と誤解されないよう明示されている。
- `docker compose up --build` で基本デモが再現できる。
- バックエンドの `./mvnw verify` が成功している。
- フロントエンドの `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e` が成功している。
- 主要画面を手動または E2E で確認している。
- API、DB schema、認証仕様、画面遷移を変更した場合、設計書、型定義、テストも更新している。
- TODO、FIXME、仮実装、未接続の主要 UI を残していない。
- エラー表示で SQL、stack trace、token、内部実装詳細をユーザーに見せていない。
- AI API キー未設定、タイムアウト、provider 失敗時にもデモ全体が破綻しない。
- README、起動手順、テスト手順、ライセンス表記に矛盾がない。
- リポジトリルートの `LICENSE` とサブプロジェクトのライセンス表記に矛盾がない。
