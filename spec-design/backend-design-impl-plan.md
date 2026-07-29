# Codex Ski Shop Backend Service 実装計画

## 1. 目的

この実装計画は、`spec-design/backend-design.md` に記載された Spring Boot バックエンド仕様を、段階的かつ抜け漏れなく実装するための計画である。

`backend-design.md` は REST API、永続化、認証、Zero Hit Radar 集計、AI 相談、Docker、テスト、frontend 連携まで範囲が広いため、実装を 10 フェーズに分割する。各フェーズでは、実装対象、実装タスク、完了チェック項目を明確にし、次フェーズへ進む前に仕様との照合を行う。

## 2. 実装方針

- Java 21 / Spring Boot を前提に、Controller、Application Service、Domain Service、Repository、Infrastructure の責務分離を守る。
- Product API から Zero Hit 記録までの一般ユーザージャーニーを先に成立させ、その後に認証、管理 API、AI 相談、backend container 化、全体 Docker Compose 統合を積み上げる。
- AI 連携は Spring AI を主経路とし、API キー未設定でもデモが壊れない fallback を必ず実装する。
- admin endpoint は Spring Security の認証・認可で保護し、Controller 内の都度チェックに寄せない。
- 商品 seed は deterministic にし、Docker compose 起動後に 100 件の商品が再現可能に登録される状態を目指す。
- 各フェーズで該当する単体テストまたは統合テストを追加し、最終的にカバレッジ 80% 以上を目標にする。
- 仕様変更が必要になった場合は、実装前に `backend-design.md` と本計画を更新する。
- 最終成果物として、`frontend`、`backend`、`db` を `docker-compose.yml` で一括起動できる状態と、利用者が再現できる `README.md` を必ず整備する。

## 2.1 共通完了ゲート

各フェーズの完了チェックに加えて、次を毎回確認する。

- [ ] このフェーズの成果物が `backend-design.md` の対応章と矛盾していない。
- [ ] `docs/agents/java/AGENTS.md` の Spring Boot 実装ルールに反していない。
- [ ] production code に TODO、FIXME、仮実装、未接続 API、固定レスポンス、`Not implemented` が残っていない。
- [ ] 秘密情報、平文の固定パスワード、API キー、Bearer token がソースコードに含まれていない。
- [ ] 追加した public class、public method、重要なドメインロジックに必要十分な Javadoc またはコメントがある。
- [ ] 既存テストとこのフェーズで追加したテストが成功している。
- [ ] build、static analysis、format、coverage task が存在する場合は成功している。
- [ ] 失敗時 UX に必要な API error response が frontend-friendly な形で返る。
- [ ] frontend integration contract の camelCase JSON を壊していない。

## 3. フェーズ一覧

| Phase | 名称 | 主な成果 |
|---:|---|---|
| 1 | バックエンド基盤・依存関係・設定 | Spring Boot プロジェクト、設定、Actuator、共通エラー |
| 2 | DB schema・Entity・Repository・Seed | PostgreSQL schema、JPA entity、repository、100 件 seed |
| 3 | Product API・検索・DTO 契約 | 商品一覧、商品検索、DTO、validation、検索仕様 |
| 4 | Zero Hit 記録ドメイン | keyword 正規化、0 件検索 upsert、機会損失、優先度 |
| 5 | Admin 認証・Spring Security | login、token、`/api/auth/me`、admin endpoint 保護、CORS |
| 6 | Zero Hit Radar 管理 API | 一覧、期間 filter、sort、limit、summary、認可統合 |
| 7 | AI 相談 API・Spring AI fallback | prompt、Spring AI adapter、fallback/error、AI API |
| 8 | Backend container・運用設定 | backend Dockerfile、backend env mapping、logging、health |
| 9 | Backend 統合テスト・OSS 受け入れ | backend 主要 journey、coverage、仕様照合 |
| 10 | 全体 Docker Compose・README 整備 | `frontend`、`backend`、`db` 一括起動、README、再現手順 |

## 3.1 仕様書対応表

| Phase | 対応する `backend-design.md` の章 |
|---:|---|
| 1 | 1, 2, 7.1, 10, 11, 13, 16, 17 |
| 2 | 3, 4, 7.4, 13, 15.1, 15.2 |
| 3 | 5.1, 6.1, 7.1, 7.2, 10, 11, 12.1, 15 |
| 4 | 3.2, 4.2, 7.2, 7.3, 12.1, 15 |
| 5 | 5.2, 6.2, 7.1, 7.2, 8, 10.2, 11, 13, 15 |
| 6 | 5.3, 6.3, 7.1, 7.2, 7.4, 10.2, 12.2, 15 |
| 7 | 5.3, 6.4, 7.1, 7.2, 7.3, 9, 12.3, 13, 15 |
| 8 | 13, 14, 16 |
| 9 | 10, 11, 15, 16, 17 |
| 10 | 1, 10, 13, 14, 15.3, 16, 17 |

## 4. Phase 1: バックエンド基盤・依存関係・設定

### 実装対象

- Spring Boot backend project
- Java 21 build configuration
- `application.yml`
- common package structure
- global exception handling
- health endpoint
- base test setup

### 実装タスク

1. Java 21 / Spring Boot の backend project を作成する。
2. Spring Web MVC、Spring Validation、Spring Data JPA、PostgreSQL driver、Spring Security、Actuator、Flyway、Spring AI、test dependencies を追加する。
3. package root を `com.codexskishop` など分かりやすい小文字 package に統一する。
4. Controller、service、domain、repository、entity、dto、config、exception package を作成する。
5. `application.yml` に datasource、JPA、Flyway、Actuator、CORS、admin、AI の外部設定キーを定義する。
6. env var mapping を `SPRING_DATASOURCE_*`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`AI_API_KEY`、`AI_MODEL`、`CORS_ALLOWED_ORIGINS` に合わせる。
7. Jackson の camelCase JSON が DTO record と一致することを確認する。
8. `ProblemDetail` または custom error object による共通 error response を実装する。
9. validation error、認証失敗、想定外 error を frontend-friendly に返す `@ControllerAdvice` を実装する。
10. `/actuator/health` を public health endpoint として利用できる状態にする。
11. smoke test と context load test を追加する。

### 完了チェック

- [ ] backend project が Java 21 で build できる。
- [ ] Spring Boot dependencies が `backend-design.md` の technology stack と一致している。
- [ ] package 構成が layered architecture の責務と対応している。
- [ ] `application.yml` に必要な env var mapping が定義されている。
- [ ] datasource、admin credentials、AI、CORS の秘密値がコードに直書きされていない。
- [ ] `/actuator/health` が起動時に `200` を返す。
- [ ] validation error が `400` と分かりやすい JSON payload で返る。
- [ ] unexpected error が秘密情報を含まない JSON payload で返る。
- [ ] `./mvnw test` または `./gradlew test` が成功する。
- [ ] `backend-design.md` の 1, 2, 10, 11, 13, 16 章と照合済みである。

## 5. Phase 2: DB schema・Entity・Repository・Seed

### 実装対象

- Flyway migration
- `Product` entity
- `ZeroHitSearch` entity
- `Priority` enum
- `ProductRepository`
- `ZeroHitSearchRepository`
- product seed data
- repository tests

### 実装タスク

1. `products` table migration を作成する。
2. `zero_hit_searches` table migration を作成する。
3. `normalized_keyword` unique constraint を定義する。
4. `idx_products_name_lower`、`idx_products_manufacturer_lower`、`idx_products_category` を定義する。
5. `idx_zero_hit_hit_count`、`idx_zero_hit_last_searched_at` を定義する。
6. `Product` entity に UUID、manufacturer、name、category、description、price、stockStatus、imageUrl、createdAt、updatedAt を実装する。
7. `ZeroHitSearch` entity に UUID、keyword、normalizedKeyword、hitCount、priority、estimatedOpportunityLoss、firstSearchedAt、lastSearchedAt を実装する。
8. `stockStatus` と `priority` は enum または安全な値制約で表現する。
9. created/updated timestamp の設定方式を実装する。
10. `ProductRepository` に初期一覧、検索、平均価格、distinct category、distinct manufacturer の取得 method を実装する。
11. `ZeroHitSearchRepository` に normalized keyword 検索、保存、radar items、summary 用 query を実装する。
12. 実在メーカー・実在商品名をもとにした 100 件の商品 seed を deterministic に作成する。
13. seed data には category、description、price、stock status、image placeholder を必ず含める。
14. Repository test で schema、constraint、主要 query を検証する。

### 完了チェック

- [ ] `products` table が 4.2 の column、type、constraint を満たしている。
- [ ] `zero_hit_searches` table が 4.2 の column、type、constraint を満たしている。
- [ ] `normalized_keyword` が unique constraint で重複防止される。
- [ ] 4.3 の index が定義されている。
- [ ] product seed が 100 件登録される。
- [ ] seed data の category が skis、ski boots、bindings、goggles、helmets、wear、gloves、poles、wax、tuning goods をカバーしている。
- [ ] manufacturer、name、category、description、price、stock status が NULL にならない。
- [ ] average price query が機会損失計算に利用できる値を返す。
- [ ] distinct category と distinct manufacturer が AI context に利用できる。
- [ ] repository tests が成功する。
- [ ] `backend-design.md` の 3, 4, 7.4 章と照合済みである。

## 6. Phase 3: Product API・検索・DTO 契約

### 実装対象

- Product DTO records
- `ProductController`
- `ProductQueryService`
- `ProductSearchService`
- product mapping
- product/search API tests

### 実装タスク

1. `ProductDto`、`ProductListResponse`、`ProductSearchResponse` を Java record で実装する。
2. Entity から DTO への mapping を実装する。
3. `GET /api/products` を実装する。
4. `GET /api/products/search` を実装する。
5. `limit`、`category`、`sort` query parameter を validation する。
6. `q` を trim し、blank の扱いを仕様どおり制御する。
7. 商品検索は manufacturer、name、category、description を対象にする。
8. category filter と sort を repository/service に接続する。
9. `ProductSearchResponse.zeroHitRecorded` はこのフェーズでは常に false または Zero Hit service 接続前の明示的な振る舞いにし、Phase 4 で完成させる。
10. public endpoint として security なしでも呼べることを後続 Phase 5 で再確認できるように test を用意する。
11. API integration test で一覧、検索一致、blank search、不正 parameter を検証する。

### 完了チェック

- [ ] `GET /api/products` が `ProductListResponse` の camelCase JSON を返す。
- [ ] `GET /api/products` の初期表示相当で最大 20 件を返せる。
- [ ] `GET /api/products/search?q=Atomic` のような検索で一致商品を返す。
- [ ] 検索対象が manufacturer、name、category、description を含んでいる。
- [ ] blank keyword で Zero Hit 記録対象にならない制御がある。
- [ ] `limit` の上限と不正値が validation される。
- [ ] `category` filter が商品一覧と検索の両方に反映される。
- [ ] `sort` の許可値以外で `400` を返す。
- [ ] DTO field が 6.1 と一致している。
- [ ] API tests が成功する。
- [ ] `backend-design.md` の 5.1, 6.1, 7.1, 7.2, 10, 11, 12.1 章と照合済みである。

## 7. Phase 4: Zero Hit 記録ドメイン

### 実装対象

- `KeywordNormalizer`
- `OpportunityLossCalculator`
- `ZeroHitRecordingService`
- Product search との接続
- zero-hit upsert tests

### 実装タスク

1. `KeywordNormalizer.normalize()` を実装する。
2. normalize rule は trim、lower-case、repeated whitespace collapse とする。
3. `OpportunityLossCalculator.calculate()` を実装する。
4. average product price を固定値または repository query から取得する方式を決定し、仕様と矛盾しないように実装する。
5. `ZeroHitRecordingService.record(keyword)` を実装する。
6. normalized keyword が存在しない場合、`hitCount=1`、`firstSearchedAt=now`、`lastSearchedAt=now` で insert する。
7. normalized keyword が存在する場合、`hitCount` を increment し、`lastSearchedAt` を更新する。
8. insert/update 時に `estimatedOpportunityLoss` を再計算する。
9. insert/update 時に `priority` を `HIGH`、`MEDIUM`、`LOW` に再計算する。
10. MVP threshold を `backend-design.md` の例に沿って明文化する。
11. `ProductSearchService` から検索結果 0 件かつ valid non-empty search のときだけ `record(keyword)` を呼ぶ。
12. 同時更新時にも unique constraint と transaction で重複 row を作らないようにする。
13. unit test と integration test で normalize、機会損失、初回記録、繰り返し increment、blank 除外を検証する。

### 完了チェック

- [ ] `KeywordNormalizer` が trim、lower-case、whitespace collapse を満たす。
- [ ] valid non-empty search 以外では zero-hit が記録されない。
- [ ] 検索結果が 1 件以上の場合は zero-hit が記録されない。
- [ ] 検索結果 0 件の場合は `zeroHitRecorded=true` を返す。
- [ ] 初回 zero-hit で row が 1 件 insert される。
- [ ] 同じ normalized keyword の再検索で row が増えず `hitCount` が増える。
- [ ] `firstSearchedAt` は初回時刻を維持し、`lastSearchedAt` は再検索時に更新される。
- [ ] `estimatedOpportunityLoss` が `hitCount × averageProductPrice` に基づき更新される。
- [ ] `priority` が hitCount、recency、または opportunity loss の決めたルールで更新される。
- [ ] upsert 周りが transaction 境界内で実行される。
- [ ] zero-hit tests が成功する。
- [ ] `backend-design.md` の 3.2, 4.2, 7.2, 7.3, 12.1 章と照合済みである。

## 8. Phase 5: Admin 認証・Spring Security

### 実装対象

- Auth DTO records
- `AdminAuthService`
- token issuing and validation
- `AuthController`
- `SecurityConfig`
- bearer token filter
- CORS config
- security tests

### 実装タスク

1. `LoginRequest`、`LoginResponse`、`AdminUserDto`、`AuthMeResponse` を Java record で実装する。
2. `ADMIN_USERNAME`、`ADMIN_PASSWORD` を設定 properties として読み込む。
3. `AdminAuthService.login()` を実装する。
4. password は source code に直書きせず、env var の値で検証する。
5. token 方式を signed JWT または opaque in-memory token with expiry から選び、選択理由をコメントまたは設定に残す。
6. token expiry を実装し、期限切れ token は invalid token として扱う。
7. `AdminAuthService.validateToken()` を実装する。
8. valid token から `ROLE_ADMIN` authority を持つ Spring Security `Authentication` を作成する。
9. bearer token filter を `OncePerRequestFilter` または同等の Spring Security filter として実装する。
10. `POST /api/auth/login` を実装する。
11. login failure は原則 `401 Unauthorized` と error payload を返す。MVP で `LoginResponse.success=false` を返す方式を採る場合も、frontend が token を保存しない契約を README または API contract に明記する。
12. `GET /api/auth/me` を実装する。
13. `authenticated=false` の場合に `user` が `null` または JSON 上省略されても frontend が扱える response にする。
14. `SecurityConfig` で public endpoint と protected endpoint の policy を定義する。
15. `/api/products`、`/api/products/search`、`/api/auth/login`、`/actuator/health` を public にする。
16. `/api/auth/me` は bearer token required にする。
17. `/api/admin/**` は `ROLE_ADMIN` required にする。
18. `AuthenticationEntryPoint` で missing/invalid token を `401` と controlled error にする。
19. `AccessDeniedHandler` で role 不足時の `403` を controlled error にする。
20. API endpoint 用に CSRF を適切に無効化する。
21. `CORS_ALLOWED_ORIGINS` から `http://localhost:3000` などを許可する。
22. security tests で public access、login 成功/失敗、me 成功/失敗、期限切れ token、admin endpoint 未認証拒否を検証する。

### 完了チェック

- [ ] admin credentials が env var から読み込まれる。
- [ ] admin password、token secret、token value が source code に含まれない。
- [ ] valid login が token と admin user を返す。
- [ ] invalid login が `401` と error payload を返す。
- [ ] token に expiry があり、期限切れ token が `401` になる。
- [ ] `GET /api/auth/me` が valid token で `authenticated=true` を返す。
- [ ] `GET /api/auth/me` が missing/invalid token で `401` を返す。
- [ ] `AuthMeResponse` の unauthenticated state が frontend contract と矛盾しない。
- [ ] `/api/admin/**` が `ROLE_ADMIN` なしで拒否される。
- [ ] valid admin token で `/api/admin/**` に到達できる。
- [ ] Product APIs と health endpoint は public のままである。
- [ ] CORS が frontend origin からの API call を許可する。
- [ ] security tests が成功する。
- [ ] `backend-design.md` の 5.2, 6.2, 7.2, 8, 10.2, 11, 13 章と照合済みである。

## 9. Phase 6: Zero Hit Radar 管理 API

### 実装対象

- Zero Hit DTO records
- `ZeroHitQueryService`
- `AdminZeroHitController`
- radar query and summary
- admin API tests

### 実装タスク

1. `ZeroHitItemDto`、`ZeroHitSummaryDto`、`ZeroHitListResponse` を Java record で実装する。
2. `Priority` enum を API DTO と domain/entity の契約に合わせる。
3. `GET /api/admin/zero-hits` を実装する。
4. `days` query parameter を 7、30、90 などの期間 filter として実装する。
5. `sort` query parameter を hit count desc、last searched desc などの許可値で実装する。
6. `limit` query parameter の default、上限、不正値 validation を実装する。
7. `ZeroHitQueryService.listZeroHits(days, sort, limit)` を実装する。
8. `lastSearchedAt` を基準に期間 filter を適用する。
9. summary の `zeroHitKeywordCount`、`searchVolume`、`estimatedOpportunityLoss` を算出する。
10. Zero Hit がない場合も空 list と 0 summary を自然に返す。
11. Spring Security の `ROLE_ADMIN` 認可で保護されていることを確認する。
12. integration test で token なし拒否、token あり成功、sort、days、limit、summary、空状態を検証する。

### 完了チェック

- [ ] `GET /api/admin/zero-hits` が `ZeroHitListResponse` の camelCase JSON を返す。
- [ ] token なしでは `401` を返す。
- [ ] valid admin token で一覧を取得できる。
- [ ] `days` filter が直近期間の zero-hit だけを返す。
- [ ] `sort=hitCount` 相当で需要の強い順に並ぶ。
- [ ] `sort=lastSearchedAt` 相当で新しい順に並ぶ。
- [ ] `limit` が適用され、不正値では `400` を返す。
- [ ] summary の keyword count、search volume、estimated opportunity loss が items と整合する。
- [ ] zero-hit なしでも empty items と 0 summary を返す。
- [ ] DTO field が 6.3 と一致している。
- [ ] admin API tests が成功する。
- [ ] `backend-design.md` の 5.3, 6.3, 7.1, 7.2, 7.4, 10.2, 12.2 章と照合済みである。

## 10. Phase 7: AI 相談 API・Spring AI fallback

### 実装対象

- AI DTO records
- `ProviderStatus` enum
- `AiPromptBuilder`
- Spring AI adapter
- `AiConsultationService`
- `AiConsultController`
- AI fallback tests

### 実装タスク

1. `AiConsultRequest`、`AiConsultResponse`、`ProviderStatus` を Java record / enum で実装する。
2. `AiConsultRequest.question` に `@NotBlank` validation を付ける。
3. `AiPromptBuilder` を実装する。
4. prompt に keyword、hit count、last searched time、既存 category、既存 manufacturer を含める。
5. prompt は日本語で、結論、理由、仕入れ候補、注意点、次のアクションを求める。
6. Spring AI `ChatClient` を使う adapter を実装する。
7. Spring AI provider 設定を env var から注入する。
8. `AI_API_KEY` 未設定時に useful demo fallback answer と `ProviderStatus.FALLBACK` を返す。
9. AI provider error 時に service が crash せず、controlled fallback または `ProviderStatus.ERROR` を返す。
10. `AiConsultationService.consult()` で prompt 作成、product context 取得、AI adapter 呼び出し、fallback を orchestration する。
11. `POST /api/admin/ai-consult` を実装する。
12. endpoint は `/api/admin/**` として `ROLE_ADMIN` で保護する。
13. AI 回答や prompt に secret、raw bearer token、API key が混入しないようにする。
14. unit test で prompt 内容、fallback、provider error を検証する。
15. integration test で token なし拒否、valid token fallback 成功、validation error を検証する。

### 完了チェック

- [ ] `POST /api/admin/ai-consult` が `AiConsultResponse` の camelCase JSON を返す。
- [ ] token なしでは `401` を返す。
- [ ] `question` blank では `400` を返す。
- [ ] prompt に keyword、hit count、last searched time が含まれる。
- [ ] prompt に既存 category と manufacturer の context が含まれる。
- [ ] prompt が需要可能性、候補ブランド/商品タイプ、在庫検討、調達リスク、季節性、代替商品、次アクションを求めている。
- [ ] AI API key 未設定で `ProviderStatus.FALLBACK` と実用的な日本語回答を返す。
- [ ] provider error 時に backend が 500 で落ちず controlled response を返す。
- [ ] Spring AI abstraction を主経路にしており、provider-specific HTTP code が散らばっていない。
- [ ] AI secrets、password、bearer token が log や response に出ない。
- [ ] AI tests が成功する。
- [ ] `backend-design.md` の 5.3, 6.4, 7.2, 7.3, 9, 12.3, 13 章と照合済みである。

## 11. Phase 8: Backend container・運用設定

### 実装対象

- backend Dockerfile
- `.dockerignore`
- docker profile/application config
- logging
- health/readiness behavior
- backend container smoke verification

### 実装タスク

1. backend multi-stage Dockerfile を作成する。
2. build stage は JDK 21 と Maven または Gradle を使う。
3. runtime stage は JRE 21 相当で jar を実行する。
4. `.dockerignore` を整備し、build artifact、IDE file、secret file を除外する。
5. backend container が env var で datasource、admin credentials、AI config、CORS origin を受け取れることを確認する。
6. backend から PostgreSQL へ compose service name `db` で接続できる profile/config を用意する。
7. `/actuator/health` に DB connectivity が反映されることを確認する。
8. AI provider health は base readiness を阻害しない設計にする。
9. request path、status、duration、zero-hit event、AI provider status、auth failure を SLF4J で安全に log する。
10. password、API key、raw bearer token を log に出さない。
11. backend container 単体の build と smoke verification 手順を確認する。

### 完了チェック

- [ ] backend Dockerfile が multi-stage build になっている。
- [ ] container が `java -jar app.jar` 相当で起動する。
- [ ] backend container が env var だけで datasource、admin、AI、CORS 設定を受け取れる。
- [ ] backend container が PostgreSQL host `db` を使う設定に対応している。
- [ ] host から `http://localhost:8080/actuator/health` にアクセスできる構成になっている。
- [ ] migration と seed が container 起動時に適用される。
- [ ] `GET /api/products` が container 環境で seed 商品を返す。
- [ ] AI API key が空でも backend が起動し、AI fallback が使える。
- [ ] log に password、API key、raw bearer token が出力されない。
- [ ] backend container build と smoke verification が再現可能である。
- [ ] `backend-design.md` の 13, 14, 16 章と照合済みである。

## 12. Phase 9: Backend 統合テスト・OSS 受け入れ

### 実装対象

- full backend integration tests
- frontend-backend contract verification
- coverage report
- backend manual verification checklist
- backend final specification traceability

### 実装タスク

1. `backend-design.md` 15.1 の unit tests を全て実装済みか棚卸しする。
2. `backend-design.md` 15.2 の integration tests を全て実装済みか棚卸しし、未実装を追加する。
3. 商品一覧、商品検索、zero-hit 記録、admin login、zero-hit radar、AI fallback の主要 journey を一連の integration test で検証する。
4. frontend DTO と backend JSON response の field name・型・endpoint が一致していることを contract test または手動確認で検証する。
5. backend container と PostgreSQL を使った backend API 手動確認を行う。
6. Zero Hit がない空状態用 response、API validation error、認証失敗、AI fallback、DB 接続 health を確認する。
7. test coverage を測定し、80% 以上を目標に不足領域を補う。
8. 80% に届かない場合は、未達理由と追加すべき test を明記する。
9. public API、重要 domain logic、設定に必要な Javadoc/comment があるか確認する。
10. OSS 公開前観点で secret、個人情報、ライセンス不明コード、不要 artifact がないか確認する。
11. `docs/orchest-code-review*.agent.md` の観点を参考に backend source review を実施する。
12. 最終的に `backend-design.md` 全章との traceability を確認し、抜け漏れがあれば該当 Phase に戻して修正する。

### 完了チェック

- [ ] `KeywordNormalizer`、`OpportunityLossCalculator`、`AiPromptBuilder`、`AdminAuthService`、AI fallback の unit tests がある。
- [ ] Product API、search zero-hit、repeat zero-hit increment、admin auth、zero-hit radar、AI fallback の integration tests がある。
- [ ] `GET /api/products` が seed 商品を返す。
- [ ] `GET /api/products/search?q=Atomic` が matching products を返す。
- [ ] `GET /api/products/search?q=non-existing-keyword` が empty items と `zeroHitRecorded=true` を返す。
- [ ] 同一 zero-hit keyword の再検索で `hitCount` が increment される。
- [ ] `GET /api/admin/zero-hits` が token なしで拒否される。
- [ ] admin login token で `GET /api/admin/zero-hits` が成功する。
- [ ] AI endpoint が `AI_API_KEY` 未設定時に fallback を返す。
- [ ] `/actuator/health` が DB connectivity を含めて正常に返る。
- [ ] backend container と PostgreSQL を組み合わせた API smoke verification が成功する。
- [ ] frontend contract の endpoint、field name、HTTP status、error payload が backend response と一致している。
- [ ] build、static analysis、test、coverage が成功する。
- [ ] coverage が 80% 以上、または未達理由と追加すべき test が明記されている。
- [ ] production code に TODO、FIXME、仮実装、未接続 UI/API、押しても動かない主要ボタン連携が残っていない。
- [ ] secret、個人情報、ライセンス不明のコピーコードが含まれていない。
- [ ] `backend-design.md` の全章と本計画の全 Phase が照合済みである。

## 13. Phase 10: 全体 Docker Compose・README 整備

### 実装対象

- root `docker-compose.yml`
- root `.env.example` or documented env defaults
- frontend compose integration
- backend compose integration
- db compose integration
- full-stack manual verification
- root `README.md`

### 実装タスク

1. repository root に `docker-compose.yml` を作成または更新する。
2. compose service として `db`、`backend`、`frontend` を定義する。
3. `db` service は PostgreSQL を使い、database、username、password、volume、healthcheck を定義する。
4. `backend` service は backend Dockerfile から build し、`db` に依存し、host port `8080` を publish する。
5. `backend` service の env に `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/skishop`、`SPRING_DATASOURCE_USERNAME`、`SPRING_DATASOURCE_PASSWORD`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`AI_API_KEY`、`AI_MODEL`、`CORS_ALLOWED_ORIGINS=http://localhost:3000` を設定する。
6. `frontend` service は frontend Dockerfile から build し、`backend` に依存し、host port `3000` を publish する。
7. browser-side API 用に `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` を設定する。
8. server-side route handler や proxy を使う場合のみ、container-internal URL として `INTERNAL_API_BASE_URL=http://backend:8080` を設定する。
9. frontend から PostgreSQL や AI provider へ直接接続しない構成であることを確認する。
10. compose 起動後、backend migration と product seed 100 件が自動適用されることを確認する。
11. `docker compose up --build` で `frontend`、`backend`、`db` が一括起動することを確認する。
12. `http://localhost:3000` で frontend が表示され、`http://localhost:8080/actuator/health` で backend health が確認できることを確認する。
13. 一般ユーザー journey として、トップページ初期商品表示、既存商品検索、0 件検索、Zero Hit 記録を確認する。
14. 管理者 journey として、login、admin dashboard、Zero Hit Radar 表示、AI fallback 相談を確認する。
15. full-stack 起動時に CORS error が発生しないことを browser で確認する。
16. root `README.md` を作成または更新し、プロジェクトの目的を記載する。
17. `README.md` に主要なディレクトリ構成を記載する。
18. `README.md` に技術スタックと service 構成を記載する。
19. `README.md` に前提ツール、環境変数、`.env` または compose env の扱いを記載する。
20. `README.md` に local backend build/test/run 手順を記載する。
21. `README.md` に local frontend build/test/run 手順を記載する。
22. `README.md` に `docker compose up --build` による全体起動手順を記載する。
23. `README.md` に主要 URL、初期 admin login 情報の設定方法、AI key 未設定時の fallback 挙動を記載する。
24. `README.md` に主要 API endpoint、Zero Hit Radar の動作概要、トラブルシューティング、テスト・カバレッジ確認方法を記載する。
25. `README.md` に secret を commit しない注意と OSS 公開時の確認事項を記載する。

### 完了チェック

- [ ] root `docker-compose.yml` に `db`、`backend`、`frontend` service が定義されている。
- [ ] `db` service が PostgreSQL database、user、password、volume、healthcheck を持つ。
- [ ] `backend` service が `db` に接続し、host port `8080` を公開している。
- [ ] `frontend` service が host port `3000` を公開している。
- [ ] `NEXT_PUBLIC_API_BASE_URL` が browser-resolvable な `http://localhost:8080` になっている。
- [ ] container-internal backend URL が必要な場合だけ `INTERNAL_API_BASE_URL=http://backend:8080` として使われている。
- [ ] `CORS_ALLOWED_ORIGINS` が `http://localhost:3000` を許可している。
- [ ] frontend が PostgreSQL や AI provider に直接接続していない。
- [ ] `docker compose up --build` で `frontend`、`backend`、`db` が一括起動する。
- [ ] compose 起動後に product seed 100 件が登録される。
- [ ] `http://localhost:3000` でトップページが表示される。
- [ ] `http://localhost:8080/actuator/health` が healthy を返す。
- [ ] 既存商品検索で商品カードが表示される。
- [ ] 0 件検索で no-results state が表示され、Zero Hit が記録される。
- [ ] admin login 後に Zero Hit Radar dashboard が表示される。
- [ ] AI key 未設定でも AI consultation が fallback answer を返す。
- [ ] browser console と network tab で CORS error が発生していない。
- [ ] `README.md` にプロジェクト目的が記載されている。
- [ ] `README.md` に主要ディレクトリ構成が記載されている。
- [ ] `README.md` に build、test、local run、Docker Compose run の手順が記載されている。
- [ ] `README.md` に環境変数、初期 admin credentials の設定方法、AI fallback、主要 URL が記載されている。
- [ ] `README.md` に主要 API endpoint と Zero Hit Radar の動作概要が記載されている。
- [ ] `README.md` にトラブルシューティングと OSS 公開前の secret 確認事項が記載されている。
- [ ] `backend-design.md` の 14.2 と 15.3、および `front-design.md` の 6.3 と 11.2 と照合済みである。

## 14. 最終受け入れ基準

全 Phase 完了後、次を満たした時点で backend implementation を完了とする。

- [ ] Java 21 / Spring Boot backend が local と Docker compose の両方で起動する。
- [ ] PostgreSQL migration と 100 件 product seed が再現可能である。
- [ ] Product APIs が frontend contract どおりに応答する。
- [ ] valid non-empty search かつ result count 0 の場合だけ Zero Hit が記録される。
- [ ] normalized keyword と DB constraint により duplicate demand record が作られない。
- [ ] admin login、token validation、admin authorization が Spring Security で実装されている。
- [ ] Zero Hit Radar API が items と summary を正しく返す。
- [ ] AI consultation API が Spring AI を主経路とし、API key 未設定時も fallback で利用できる。
- [ ] error response、empty state 用 response、auth failure、AI failure が自然に扱える。
- [ ] `/actuator/health` が public に確認でき、DB health を含む。
- [ ] root `docker-compose.yml` により `frontend`、`backend`、`db` が一括起動する。
- [ ] `docker compose up --build` 後、追加設定なしで基本デモが成立する。
- [ ] `README.md` に目的、主要ディレクトリ構成、環境変数、ビルド、テスト、local 実行、Docker Compose 実行、主要 URL、トラブルシューティングが記載されている。
- [ ] unit/integration/E2E または手動確認により主要ユーザージャーニーが検証済みである。
- [ ] カバレッジ 80% 以上を目標にし、未達の場合は理由と追加テスト計画が明記されている。
- [ ] OSS として公開しても問題ない品質、構成、命名、コメント、秘密情報管理になっている。
