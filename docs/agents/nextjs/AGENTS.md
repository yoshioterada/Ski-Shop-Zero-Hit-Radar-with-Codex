# Next.js AGENTS.md

このファイルは、Next.js フロントエンドを実装・修正する AI エージェント向けの指示である。

## 基本方針

- Next.js App Router を前提に、画面、ルーティング、データ取得、UX 状態を実装する。
- `Codex Ski Shop` の利用者が商品を探しやすく、管理者が Zero Hit Radar を理解しやすい UI を優先する。
- 見た目だけの未接続コンポーネントを残さない。
- ローディング、空状態、エラー、認証切れ、送信中、成功状態を必ず設計する。
- 主要画面は `spec-design/front-design.md` と `images/` の参照画像を踏まえて実装する。
- Next.js、React、TypeScript は、プロジェクト作成時点で利用可能な安定版を使い、古い routing API を新規採用しない。

## UX と画面品質

- 最初の画面は実際に使える体験にする。説明だけのランディングページにしない。
- トップページ、商品一覧、ログイン、管理ダッシュボードの主要導線を自然につなげる。
- 検索結果が 0 件の場合でも、ユーザーが次に何をすればよいか分かる UI にする。
- 管理画面では、Zero Hit 件数、検索回数、推定機会損失、最終検索日時をすばやく比較できるようにする。
- ボタン、入力、選択 UI は無効状態、フォーカス状態、送信中状態を持たせる。
- テキストがボタンやカードからはみ出さないように、レスポンシブ制約を設定する。
- モバイルとデスクトップの両方でレイアウト崩れを確認する。
- 未完成に見えるプレースホルダー、ダミーカード、機能しないリンクを残さない。
- keyboard 操作、focus ring、label、aria 属性、色 contrast を確認し、基本的なアクセシビリティを満たす。
- 価格、日時、件数は日本語 UI に合わせて自然に format する。

## Next.js 実装ルール

- Server Component と Client Component の責務を明確にする。
- ブラウザイベント、状態管理、フォーム操作、localStorage などが必要な箇所だけ `use client` を使う。
- API 通信は typed API client に集約し、画面コンポーネントへ fetch 処理を散らばらせない。
- 環境変数は `NEXT_PUBLIC_API_BASE_URL` など明確な名前にし、未設定時の fallback を定義する。
- 認証 token は HttpOnly cookie を優先する。localStorage や sessionStorage を使う場合は MVP 上の理由を明確にし、XSS リスクを増やさない。
- ルート保護は admin route の入口で行い、未認証時は `/login` に遷移する。
- API エラーは握りつぶさず、画面上の自然なエラー状態として表示する。
- 画像は実際の用途に合ったものを使い、alt text を設定する。
- `next/link`、`next/image` など Next.js の標準機能を優先する。
- SEO と共有品質のため、主要 page には適切な metadata を設定する。
- 不要な client bundle を増やさず、重い依存や UI library の追加は必要性を説明する。

## コンポーネント設計

- コンポーネントは単一責務にし、props の型を明確にする。
- `Header`、`SearchBar`、`ProductGrid`、`ProductCard`、`LoginForm`、`ZeroHitSummaryCards`、`ZeroHitTable`、`AiConsultPanel` など、設計書の責務に沿って分割する。
- 再利用可能な UI とページ固有の orchestration を分ける。
- カードの中にさらに大きなカードを入れる構成は避け、視認性を優先する。
- lucide-react など既存の icon library がある場合は、ボタンや操作 UI に適切な icon を使う。

## コメントとドキュメント

- public に再利用される component、hook、API client function には目的が分かるコメントを書く。
- 複雑な認証判定、API fallback、Zero Hit の表示ロジックには短い説明コメントを置く。
- UI 上に実装説明やショートカット説明を過剰に表示しない。
- ユーザーに見せる文言は自然な日本語または設計書で指定された表現に統一する。

## 禁止事項

- production UI に TODO、FIXME、仮文言、Lorem ipsum、dummy data を残さない。
- 主要ボタンを `alert()` のみ、`console.log()` のみで済ませない。
- API レスポンス型を `any` で受けない。
- client component を不必要に増やさない。
- 認証トークンや秘密情報をコードに直書きしない。
- hydration error や console error を放置しない。
- 見た目だけ整っていて実データと接続されていない画面を完了扱いにしない。
- `<a>` で内部遷移を乱用せず、Next.js の内部遷移には `Link` を使う。
- form submit、Enter key、二重送信防止を未実装のままにしない。

## テスト

- Playwright で主要ユーザージャーニーを検証する。
- 可能な場合は Vitest または Testing Library で component / hook / utility を検証する。
- カバレッジ 80% 以上を目標にする。
- 最低限、トップページ表示、商品検索、0 件検索、ログイン成功、ログイン失敗、管理画面表示、AI 相談の失敗時 UX をテストする。
- レスポンシブ確認として、desktop と mobile viewport のスクリーンショットまたは E2E 検証を行う。
- keyboard 操作とフォーム validation のテストを追加する。

## 完了前チェック

- `npm run build`、`npm test`、`npm run lint` など、存在する品質チェックが成功する。
- `npm run typecheck` が存在する場合は成功する。
- ブラウザで主要画面を確認し、UI 崩れや未接続操作がない。
- バックエンド API が未起動または失敗した場合でも、画面が破綻しない。
- Docker またはローカル起動で再現可能である。
- Playwright などで少なくとも desktop と mobile の主要画面を確認する。
