# TypeScript AGENTS.md

このファイルは、TypeScript コードを実装・修正する AI エージェント向けの指示である。

## 基本方針

- TypeScript は strict mode を前提に書く。
- 型は実装の説明ではなく、バグを防ぐための契約として扱う。
- API DTO、domain model、component props、form state、error state を明確に型定義する。
- `any` に逃げず、unknown、union、generic、type guard を適切に使う。
- 読み手が推論しやすい命名とファイル構成を優先する。
- TypeScript はプロジェクト作成時点で利用可能な安定版を使い、最新の型システム機能を読みやすさを損なわない範囲で活用する。

## 型設計

- API レスポンスとリクエストは専用の `type` または `interface` として定義する。
- 外部 API や backend API から来る値は信用せず、必要に応じて runtime validation を行う。
- 状態遷移は boolean の乱立ではなく、discriminated union を優先する。
- optional property と nullable value を混同しない。
- `Record<string, unknown>`、`unknown`、型ガードを使い、未検証データを安全に扱う。
- 配列や map の要素型を省略しない。
- public function の引数と戻り値は、読み手が分かるように明示する。
- literal union、`as const`、`satisfies` を使い、状態値や設定値の型安全性を高める。
- backend DTO と frontend DTO の差分が必要な場合は、変換関数を明示し、暗黙の shape 依存を避ける。
- runtime validation 用ライブラリを追加する場合は、導入理由、bundle 影響、代替案を説明する。

## コーディング規約

- 変数・関数は camelCase、型・interface・React component は PascalCase にする。
- boolean は `isLoading`、`hasError`、`canSubmit`、`shouldRedirect` など意味が分かる名前にする。
- 関数は 1 つの責務に絞り、長すぎる処理は pure function に分ける。
- date、price、count などの format 処理は utility に分離する。
- error message は UI 用とログ用を分け、ユーザーに内部実装を見せない。
- `const` を基本とし、再代入が必要な場合だけ `let` を使う。
- import は整理し、循環依存を作らない。
- 価格や日時の format は `Intl.NumberFormat`、`Intl.DateTimeFormat` など標準 API を優先する。
- async 処理は戻り値の `Promise` 型と error handling を明確にする。

## tsconfig と lint

- `strict: true` を維持する。
- 可能な場合は `noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride` を有効にする。
- ESLint は type-aware rules を使える構成を優先する。
- 型エラーを build から切り離さず、CI または通常の品質チェックで検出できるようにする。

## コメントとドキュメント

- export される function、hook、型、重要な utility には、必要に応じて JSDoc を書く。
- JSDoc は引数の羅列ではなく、その関数が保証する振る舞いを説明する。
- 複雑な type guard、discriminated union、API error normalization には短いコメントを付ける。
- 自明な変数や JSX に説明コメントを付けすぎない。

## 禁止事項

- `any`、`as any`、二重 assertion を安易に使わない。
- non-null assertion `!` を安易に使わない。
- `// @ts-ignore`、`// @ts-expect-error` を放置しない。必要な場合は理由を書く。
- production code に TODO、FIXME、HACK、placeholder、dummy を残さない。
- `console.log` をデバッグ目的で残さない。
- floating promise を放置しない。意図的に待たない場合は理由を明確にする。
- API client で response shape を未検証のまま UI に渡さない。
- 文字列リテラルの状態値を散らばらせず、union type や enum-like const に集約する。
- 型を合わせるためだけの過剰な assertion で実データの不整合を隠さない。

## テスト

- utility、API client、format 関数、type guard、state reducer は unit test を書く。
- UI 状態に関係する処理は、正常系だけでなく error、empty、loading を検証する。
- カバレッジ 80% 以上を目標にする。
- 型だけで守っている重要な契約は、可能な範囲で runtime test も追加する。
- branch coverage を意識し、union の各状態と API error 分岐を検証する。

## 完了前チェック

- `tsc --noEmit` または同等の typecheck が成功する。
- lint と test が成功する。
- `any` や unsafe assertion が残っていないか確認する。
- public に使われる型・関数が理解しやすい名前とコメントを持っている。
- tsconfig を緩めて問題を回避していない。
