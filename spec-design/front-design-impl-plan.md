# Codex Ski Shop Frontend Implementation Plan

## 1. 目的

この実装計画は、[front-design.md](/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/spec-design/front-design.md) に記載された Next.js フロントエンドを、段階的かつ抜け漏れなく実装するための計画である。

実装は最大 9 フェーズに分ける。各フェーズの終了時には完了チェックを必ず実施し、次フェーズへ進む前に設計内容とのズレを確認する。

## 2. 実装方針

- 先に型定義と API クライアントを固め、画面実装時の接続ミスを減らす
- 各画面は、読み込み中、空状態、成功、失敗の状態を必ず実装する
- バックエンドへの接続は `NEXT_PUBLIC_API_BASE_URL` を使う
- ブラウザからの API 呼び出しでは `http://localhost:8080` のようなブラウザ解決可能な URL を使い、`http://backend:8080` を直接使わない
- 参考画像内の `Azure SkiShop` 表記はすべて `Codex Ski Shop` に置き換える
- MVP 範囲外であるカート、購入、ユーザ登録、商品 CRUD は実装しない

## Phase 1. Project Foundation

### 実装対象

- Next.js プロジェクトの作成または既存構成の確認
- TypeScript 設定
- App Router 構成
- 基本ディレクトリ作成
- 環境変数の雛形作成
- lint / format / build コマンドの確認
- lucide-react など設計書で利用する UI 依存関係の導入

### 作成・確認する主な構成

```text
frontend
├── src
│   ├── app
│   ├── components
│   ├── lib
│   │   └── api
│   └── types
├── package.json
├── Dockerfile
└── .env.example
```

### 完了チェック

- [ ] `frontend` ディレクトリで Next.js アプリが起動できる
- [ ] TypeScript が有効になっている
- [ ] `src/app` ベースの App Router 構成になっている
- [ ] `src/components`、`src/lib/api`、`src/types` が作成されている
- [ ] `.env.example` に `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` が記載されている
- [ ] 必要に応じて `.env.example` に `INTERNAL_API_BASE_URL=http://backend:8080` が任意項目として記載されている
- [ ] lucide-react が導入され、アイコン付きボタンを実装できる状態になっている
- [ ] `npm run build` または採用した package manager の build コマンドが実行できる
- [ ] `npm run lint` または採用した lint コマンドが実行できる
- [ ] visible UI に `Azure SkiShop` ではなく `Codex Ski Shop` を使う方針が確認されている

## Phase 2. Shared Types and API Client

### 実装対象

- `front-design.md` の DTO を `src/types/api.ts` に実装
- 共通 fetch wrapper の実装
- API エラー正規化
- 環境変数から API base URL を取得
- 各 API モジュールの作成

### 実装する DTO

- `ProductDto`
- `ProductListResponse`
- `ProductSearchResponse`
- `LoginRequest`
- `LoginResponse`
- `AuthMeResponse`
- `ZeroHitItemDto`
- `ZeroHitSummaryDto`
- `ZeroHitListResponse`
- `AiConsultRequest`
- `AiConsultResponse`
- `ApiError`

### 実装する API 関数

- `listProducts`
- `searchProducts`
- `login`
- `getMe`
- `listZeroHits`
- `consultAi`

### 完了チェック

- [ ] `ProductDto` に `manufacturer`、`name`、`category`、`price`、`stockStatus`、`imageUrl` が含まれている
- [ ] `ProductSearchResponse` に `zeroHitRecorded` が含まれている
- [ ] `ZeroHitItemDto` に `priority`、`estimatedOpportunityLoss`、`firstSearchedAt`、`lastSearchedAt` が含まれている
- [ ] `AiConsultRequest` が `keyword`、`question`、`hitCount`、`lastSearchedAt` を扱える
- [ ] `AiConsultResponse` が `providerStatus: "LIVE" | "FALLBACK" | "ERROR"` を扱える
- [ ] API client が `NEXT_PUBLIC_API_BASE_URL` を使っている
- [ ] ブラウザ側 API base URL に `http://backend:8080` を使っていない
- [ ] admin API で `Authorization: Bearer ${token}` を付与できる
- [ ] Spring `ProblemDetail` の `detail`、`title`、`message` を user-facing message に変換できる
- [ ] 400 はフォーム近くの validation message として扱える
- [ ] 401 は token clear と `/login` redirect に使える
- [ ] 403 は access denied 表示に変換できる
- [ ] 404 は route に応じて not found または empty state に変換できる
- [ ] 500 は retry 可能な service error 表示に変換できる
- [ ] API client の URL 組み立てを単体で確認できる
- [ ] `listProducts`、`searchProducts`、`login`、`getMe`、`listZeroHits`、`consultAi` が Endpoint Contract と同じパスを使っている

## Phase 3. Shared UI, Layout, and Formatting Utilities

### 実装対象

- `AppLayout`
- `Header`
- `SearchBar`
- loading / error / empty state components
- currency formatter
- date formatter
- stock status label mapper
- priority label mapper
- responsive base styling
- lucide-react icons の導入
- アクセシブルなフォーム label / aria-label / disabled state の共通方針

### UI 方針

- ヘッダーは `Codex Ski Shop` ブランドを表示する
- ナビゲーションは `Home`、`Products`、`Login` を基本とする
- 管理者ログイン後は Admin dashboard へ移動できる導線を表示する
- `stockStatus` は `IN_STOCK`、`LOW_STOCK`、`OUT_OF_STOCK` を `在庫あり`、`残りわずか`、`在庫なし` に変換する
- `priority` は `HIGH`、`MEDIUM`、`LOW` を分かりやすいラベルまたはバッジで表示する

### 完了チェック

- [ ] `Header` に `Codex Ski Shop` が表示される
- [ ] `Header` から `/`、`/products`、`/login` へ移動できる
- [ ] 認証済み状態では `Header` から admin dashboard へ移動できる
- [ ] `SearchBar` が入力、送信、loading disabled 状態に対応している
- [ ] `SearchBar` に label または aria-label が設定されている
- [ ] 価格が `¥98,000` のような日本円表記になる
- [ ] 日時が管理画面で読める形式に整形される
- [ ] `stockStatus` の日本語表示が実装されている
- [ ] `priority` の表示が実装されている
- [ ] loading、empty、error の共通表示が使える
- [ ] ボタンは loading / disabled 状態が視覚的にも支援技術向けにも分かる
- [ ] キーボード操作で主要なリンク、入力欄、ボタンに移動できる
- [ ] モバイル幅でヘッダーやボタンのテキストがはみ出さない

## Phase 4. Product Components and Public Product Experience

### 実装対象

- `ProductCard`
- `ProductGrid`
- `/products` ページ
- 商品一覧 API 接続
- 商品検索 API 接続
- ページタイトル表示
- total count 表示
- カテゴリフィルタ
- ソート
- 検索結果件数表示
- 0 件検索時の no-results state

### 使用する API

- `GET /api/products?limit=&category=&sort=`
- `GET /api/products/search?q=&category=&sort=`

### 完了チェック

- [ ] `/products` にアクセスできる
- [ ] ページタイトルと総件数が表示される
- [ ] 初期表示で商品一覧を取得して表示できる
- [ ] 商品カードに `manufacturer`、`name`、`price`、`stockStatus` が表示される
- [ ] 商品カードに `category` またはカテゴリバッジが表示される
- [ ] 商品画像またはカテゴリプレースホルダーが表示される
- [ ] 商品カードのレイアウトが `images/products-list.png` の方向性に合っている
- [ ] カテゴリフィルタに all、skis、boots、wear、accessories、poles、goggles 相当の選択肢がある
- [ ] カテゴリフィルタで API query の `category` が変わる
- [ ] ソートに newest、price low to high、price high to low 相当の選択肢がある
- [ ] ソートで API query の `sort` が変わる
- [ ] 検索結果件数が表示される
- [ ] 存在する商品キーワードで検索結果が表示される
- [ ] 存在しないキーワードで 0 件状態が表示される
- [ ] 0 件検索時に frontend 側で別途 Zero Hit 登録 API を呼ばず、search API のみを呼んでいる
- [ ] 検索中に重複 submit が抑制される
- [ ] API エラー時に画面全体が壊れない

## Phase 5. Top Page Experience

### 実装対象

- `/` トップページ
- ヒーローエリア
- 商品プレビュー 20 件表示
- トップページ検索
- 検索状態ごとの表示切り替え
- `/products` への導線
- 参考画像に基づくビジュアル調整

### 使用する API

- `GET /api/products?limit=20&sort=createdAt,desc`
- `GET /api/products/search?q=&category=&sort=`

### 完了チェック

- [ ] `/` にアクセスできる
- [ ] ファーストビューで `Codex Ski Shop` が明確に見える
- [ ] `images/Top-page-after-login.png` の青基調・ヘッダー・ヒーローの方向性を踏まえている
- [ ] 初期表示で最大 20 件の商品プレビューが表示される
- [ ] トップページから商品検索できる
- [ ] トップページ検索中に重複 submit が抑制される
- [ ] 検索結果ありの場合、商品カードが表示される
- [ ] 検索結果なしの場合、自然な 0 件表示になる
- [ ] API error の場合、トップページ全体が壊れず retry 可能な表示になる
- [ ] 「商品を見る」または同等の導線で `/products` に移動できる
- [ ] `Azure SkiShop` という表示が残っていない
- [ ] PC とモバイルでヒーロー、検索欄、商品カードが重ならない

## Phase 6. Authentication and Login

### 実装対象

- `/login` ページ
- `LoginForm`
- `authToken` utility
- `POST /api/auth/login` 接続
- `GET /api/auth/me` 接続
- admin route guard
- Header の認証状態反映
- 401 時の token clear と redirect

### 認証方針

MVP では `sessionStorage` に token を保存してよい。より安全な構成にする場合は Next.js route handler と HttpOnly cookie を利用する。

### 完了チェック

- [ ] `/login` にアクセスできる
- [ ] ログイン画面が `images/login-screen.png` の方向性に合っている
- [ ] `Codex Ski Shop` の管理者ログイン画面であることが分かる
- [ ] username と password を入力できる
- [ ] login API 成功時に token を保存できる
- [ ] token は MVP 方針どおり `sessionStorage` または HttpOnly cookie 経由で一貫して扱われている
- [ ] login API 成功時に `/admin/dashboard` へ遷移する
- [ ] login API 失敗時にエラーメッセージが表示される
- [ ] `success=false` または `401 Unauthorized` を失敗として扱う
- [ ] `/admin/dashboard` 表示前に `GET /api/auth/me` で認証確認する
- [ ] 未認証で `/admin/dashboard` にアクセスした場合、`/login` にリダイレクトされる
- [ ] 401 応答時に token が削除される
- [ ] 認証済み状態では Header に admin dashboard への導線が表示される
- [ ] logout または token clear 後は admin dashboard への導線が消える、または未認証扱いになる

## Phase 7. Admin Dashboard and Zero Hit Radar

### 実装対象

- `/admin/dashboard`
- `AdminLayout`
- `ZeroHitSummaryCards`
- `ZeroHitTable`
- 期間フィルタ 7 / 30 / 90 日
- sort / limit query の初期値設定
- refresh 操作
- empty state
- Zero Hit keyword selection

### 使用する API

- `GET /api/auth/me`
- `GET /api/admin/zero-hits?days=&sort=&limit=`

### 表示項目

- zero hit keyword count
- search volume
- estimated opportunity loss
- keyword
- hit count
- priority
- first searched at
- last searched at
- estimated opportunity loss

### 完了チェック

- [ ] `/admin/dashboard` は認証済み管理者のみ表示できる
- [ ] 管理画面が `images/admin-dash-board-zero-hit.png` の方向性に合っている
- [ ] Zero Hit summary cards が表示される
- [ ] Zero Hit table/list が表示される
- [ ] `keyword` が表示される
- [ ] `hitCount` が表示される
- [ ] `priority` が表示される
- [ ] `estimatedOpportunityLoss` が日本円として表示される
- [ ] `firstSearchedAt` と `lastSearchedAt` が読める日時で表示される
- [ ] 7 / 30 / 90 日の期間フィルタが API query の `days` に反映される
- [ ] `sort` と `limit` の初期値が API query として破綻しない
- [ ] refresh 操作で最新データを再取得できる
- [ ] Zero Hit が空の場合、自然な empty state が表示される
- [ ] API エラー時に管理画面全体が壊れない
- [ ] キーワードを選択すると AI 相談パネルに引き継げる

## Phase 8. AI Consultation Panel

### 実装対象

- `AiConsultPanel`
- selected keyword 表示
- free-form question 入力
- `POST /api/admin/ai-consult` 接続
- AI sending / success / failure state
- provider status 表示

### 使用する API

- `POST /api/admin/ai-consult`

### 送信するデータ

- `keyword`
- `question`
- `hitCount`
- `lastSearchedAt`

### 完了チェック

- [ ] Zero Hit keyword を選択すると AI 相談対象として表示される
- [ ] 任意の質問文を入力できる
- [ ] question が空の場合は送信しない
- [ ] 送信中は send button が disabled になる
- [ ] request body に `keyword`、`question`、`hitCount`、`lastSearchedAt` が含まれる
- [ ] 成功時に `answer` が読みやすく表示される
- [ ] `providerStatus` が `LIVE`、`FALLBACK`、`ERROR` のいずれでも破綻しない
- [ ] 失敗時に質問文が消えず、再送できる
- [ ] 401 の場合は token を削除して `/login` に遷移する
- [ ] AI 未設定時の fallback または error 表示が自然である

## Phase 9. Docker, Verification, and Polish

### 実装対象

- frontend Dockerfile
- Docker multi-stage build
- docker compose 接続確認
- 環境変数確認
- レスポンシブ調整
- アクセシビリティ確認
- Playwright E2E 検証
- unit test または最低限の utility test
- 最終デザイン polish

### Docker / Compose 要点

- frontend は host port `3000` でアクセスできる
- backend は host port `8080` でアクセスできる
- browser-side frontend は `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` を使う
- container-to-container call が必要な場合のみ `INTERNAL_API_BASE_URL=http://backend:8080` を使う
- CORS は backend 側で `http://localhost:3000` が許可されている必要がある

### 完了チェック

- [ ] `docker compose up --build` で frontend / backend / db が起動する
- [ ] frontend Dockerfile が `deps`、`builder`、`runner` 相当の multi-stage build になっている
- [ ] `http://localhost:3000` でトップページが表示される
- [ ] frontend から backend API へ CORS エラーなしで接続できる
- [ ] `http://backend:8080` を browser-side code で使っていない
- [ ] トップページで `Codex Ski Shop` が表示される
- [ ] 商品 20 件が表示される
- [ ] 存在する商品検索で商品カードが表示される
- [ ] 存在しない商品検索で 0 件表示になり、Zero Hit Radar に反映される
- [ ] 管理者ログイン後 `/admin/dashboard` に遷移する
- [ ] Zero Hit Radar に keyword、hit count、priority、estimated opportunity loss が表示される
- [ ] AI 相談が成功、fallback、error のいずれでも画面が壊れない
- [ ] PC 幅でトップ、商品一覧、ログイン、管理画面が破綻しない
- [ ] モバイル幅でトップ、商品一覧、ログイン、管理画面が破綻しない
- [ ] ボタン、入力欄、テーブル、カード内のテキストがはみ出さない
- [ ] `Azure SkiShop` という表示が残っていない
- [ ] 主要画面で loading、empty、error state が確認できる
- [ ] Playwright でトップ、商品検索、ログイン、管理画面、AI 相談の主要シナリオを確認できる
- [ ] currency formatting、date formatting、auth token utility、API client URL construction のいずれかに unit test または手動確認がある
- [ ] 入力欄に label または aria-label がある
- [ ] キーボード操作で主要操作を完了できる
- [ ] 色だけに依存したエラー表示や状態表示になっていない

## 3. 最終受け入れチェック

すべてのフェーズ完了後、以下を確認する。

- [ ] `front-design.md` の Page Ownership に記載された 4 画面が実装されている
- [ ] `front-design.md` の DTO と実装上の TypeScript 型が一致している
- [ ] `front-design.md` の Endpoint Contract に記載された API 関数がすべて実装されている
- [ ] `front-design.md` の Component Responsibilities に記載された主要コンポーネントが実装されている
- [ ] `front-design.md` の Error Contract に記載された 400 / 401 / 403 / 404 / 500 の扱いが実装されている
- [ ] frontend は PostgreSQL や AI provider を直接呼び出していない
- [ ] Zero Hit 登録は frontend ではなく backend の search API に委譲されている
- [ ] 管理者 API には Bearer token が付与されている
- [ ] 未認証状態で admin dashboard を表示できない
- [ ] 参考画像 4 点の意図が各画面に反映されている
- [ ] `Codex Ski Shop` として統一された見た目になっている
- [ ] Docker compose で動作確認できる
- [ ] Playwright または同等の手動 E2E シナリオで主要導線が確認されている
- [ ] アクセシビリティとレスポンシブの最低限の確認が完了している
- [ ] OSS として公開しても未完成に見えない UX になっている
