# Full Review Modify Plan

作成日: 2026-06-04  
対象: `backend`  
参照レビュー: `review-reports/manual-backend-full/backend/check-report-1.md`  
対象重要度: Critical / High

## 1. 方針

`check-report-1.md` の Critical / High は、同じ根本原因を複数エージェントが別観点で指摘しているものが多い。したがって本計画では、指摘番号を個別に逐次修正するのではなく、実装上の責務単位で束ねて対応する。

優先順位は次の順に置く。

1. セキュリティ、入力検証、秘密情報、認証保護
2. zero-hit 記録のデータ整合性と並行実行安全性
3. AI provider 境界の resilience、timeout、transaction 分離
4. エラー、ログ、相関 ID、セキュリティヘッダー
5. API 契約、REST semantics、pagination、data access 最適化
6. ドメインモデル、パッケージ標準、依存関係、テスト品質

## 2. Critical / High 指摘の対応マップ

| 対応テーマ | 対象指摘 |
| --- | --- |
| 入力検証とサイズ制限 | #7, #8, #9, #15, #39 |
| zero-hit の upsert / concurrency / aggregate invariant | #1, #3, #4, #18, #29 |
| GET search の副作用分離 | #6, #37 |
| 管理者認証の brute force 対策と token lifecycle | #36, #40 |
| 設定 profile / secret / TLS / virtual threads | #19, #26, #31, #33, #34, #35 |
| AI provider resilience / timeout / transaction 境界 | #20, #64, #76, #77 |
| error response / logging / correlation / security headers / PII logging | #11, #21, #22, #23, #24, #25, #32, #38, #41, #44 |
| data access / entity / null safety / pagination / projection | #2, #5, #10, #14, #16, #17, #27, #28, #30, #43, #68, #69, #70, #71 |
| test / dependency / release hygiene | #12, #13, #42, #45, #46 |

## 3. 実装フェーズ

### Phase A: 先に決めるべき設計判断

次の項目は、実装を始める前にプロジェクト標準として決める。推奨判断も併記する。

| 判断項目 | 推奨判断 | 理由 |
| --- | --- | --- |
| `GET /api/products/search` が zero-hit を記録してよいか | GET は read-only にし、zero-hit 記録は `POST /api/zero-hit-searches` または `POST /api/products/search-events` に分離する | HTTP safe method の原則、キャッシュ、bot / CSRF 的な汚染リスクを避けるため。現行 `backend-design.md` には GET で記録する記述があるため、設計書と frontend API 呼び出しも同時更新する。 |
| Error response を `ApiErrorResponse` のままにするか | Spring `ProblemDetail` / RFC 9457 shape に移行する | レビュー標準に合わせる。frontend は `message` / `detail` / `title` を吸収できる実装にして、破壊的変更を最小化する。 |
| entity package を `entity` のままにするか `model` に移すか | OSS 品質の標準として `com.skishop.model` に移行し、DTO は `dto.request` / `dto.response` に分割する。ただしこの変更は最後の構造整理フェーズで行う | 機能修正と package rename を同時に行うと差分が読みにくくなるため、先に correctness を直す。 |
| Primary key を PostgreSQL `UUID` のままにするか String UUID にするか | PostgreSQL / Hibernate の型安全性を優先し、`UUID` は維持する。レビュー標準が String UUID を必須にする場合のみ別途 migration を作る | `backend-design.md` と migration は UUID を前提にしている。String 化は広範囲な API / DB 変更になり、品質向上より破壊リスクが大きい。 |
| AI retry を入れてよいか | 低回数 retry と circuit breaker を provider 境界に入れる。token cost を抑えるため、network / transient error のみに限定する | live provider 障害で request path が詰まることを避ける。fallback は維持する。 |
| TLS | Spring Boot 直 SSL ではなく reverse proxy / load balancer 終端を標準にし、`server.forward-headers-strategy=framework` と HSTS 条件を整理する | docker compose demo と production 想定を分けやすい。 |

### Phase B: セキュリティと validation の即時対応

#### B-1. Controller query parameter validation

対象指摘: #7, #8, #39  
対象ファイル: `ProductController`, `AdminZeroHitController`, `GlobalExceptionHandler`, `application.yml`

現状:

- `ProductController` と `AdminZeroHitController` は `@Validated` がなく、query parameter は service 側の `IllegalArgumentException` に依存している。
- `limit`, `days`, `sort`, `q`, `category` に Bean Validation の境界がない。
- request body / free text のサイズ上限が application config と DTO の両方で不足している。

最適な修正:

- controller に `@Validated` を付与する。
- query parameter に Bean Validation を追加する。
  - `limit`: `@Min(1) @Max(100)`
  - `days`: `@Min(1) @Max(365)`
  - `q`: `@Size(max = 100)`
  - `category`: `@Size(max = 80)`
  - product sort: `createdAt,desc|price,asc|price,desc`
  - zero-hit sort: `hitCount,desc|lastSearchedAt,desc`
- `HandlerMethodValidationException` と `ConstraintViolationException` を 400 として扱う。
- Tomcat の request limit を設定する。
  - `server.tomcat.max-http-form-post-size`
  - `server.tomcat.max-swallow-size`
  - `server.max-http-request-header-size`
- service 側の validation は defense in depth として残す。

検証:

- `GET /api/products?limit=0` が 400。
- `GET /api/products?limit=101` が 400。
- `GET /api/products/search?q=<101文字以上>` が 400。
- `GET /api/admin/zero-hits?days=0` が 400。
- `GET /api/admin/zero-hits?sort=bad` が 400。

#### B-2. AI consultation request validation / null contract

対象指摘: #9, #15, #39  
対象ファイル: `AiConsultRequest`, `AiConsultController`, `AiPromptBuilder`

現状:

- `AiConsultRequest.question` は `@NotBlank` のみ。
- `keyword`, `hitCount`, `lastSearchedAt` の optional / nullable 契約が明示されていない。
- prompt に入る free text の長さ制限がない。

最適な修正:

- `AiConsultRequest` に明示的な制約を追加する。
  - `keyword`: `@Nullable @Size(max = 200)`
  - `question`: `@NotBlank @Size(max = 1000)`
  - `hitCount`: `@Nullable @Min(0) @Max(1_000_000)`
  - `lastSearchedAt`: `@Nullable @PastOrPresent`
- `AiPromptBuilder` 側でも trim 後の値を使い、null / blank を safe value に変換する。
- prompt には token / API key / Authorization header を絶対に含めない方針をテストで固定する。

検証:

- question blank / 1001 文字で 400。
- hitCount 負数で 400。
- future timestamp で 400。
- fallback / provider error の応答に secrets や exception message が露出しない。

#### B-3. Admin login rate limiting / lockout

対象指摘: #36  
対象ファイル: `AdminAuthService`, `AuthController`, `SecurityConfig`

現状:

- `AdminAuthService.login()` は認証失敗回数を保持せず、brute force を防げない。
- username と source IP の両面での制限がない。

最適な修正:

- `LoginAttemptLimiter` を導入する。
  - key: `normalizedUsername + sourceIp`
  - threshold: 5 failures / 10 minutes
  - lock duration: 15 minutes
  - demo では in-memory、将来 Redis 等へ差し替え可能な interface にする。
- `AuthController.login()` は `HttpServletRequest` から source IP を渡すか、専用 filter で `/api/auth/login` を保護する。
- 成功時は該当 key の失敗カウンタを clear する。
- ログには username / password の raw value を出さない。username も必要なら hash 化する。
- 応答は常に `401 AUTHENTICATION_FAILED` または `429 RATE_LIMITED` の安全な固定文言にする。

検証:

- 連続失敗後に 429 または lockout 用 401 が返る。
- lockout 中は正しい password でも拒否される。
- 成功 login 後に失敗カウンタが reset される。
- password がログに出ない。

#### B-4. Token revocation / active token cap

対象指摘: #40  
対象ファイル: `AdminAuthService`, `AdminAuthUseCase`, `AuthController`, `SecurityConfig`

現状:

- opaque bearer token は expiry のみで、logout / revoke がない。
- login のたびに token が無制限に追加される。

最適な修正:

- `POST /api/auth/logout` を追加し、現在 token を revoke する。
- `AdminAuthUseCase` に `revokeToken(String token)` と `purgeExpiredSessions()` を追加する。
- admin ごとの active token を最大 3 件程度に制限する。MVP なら新規 login 時に古い token を失効させる方式が最も単純。
- `BearerTokenAuthenticationFilter` は logout endpoint でも token を認証できるようにする。
- frontend の logout 操作は token 削除だけでなく logout API 呼び出しも行う。

検証:

- logout 後の `/api/auth/me` は 401。
- 4 回 login したとき最古 token が無効化される。
- expired token は validation 時または purge で除去される。

### Phase C: zero-hit 記録の整合性修正

#### C-1. PostgreSQL atomic upsert への変更

対象指摘: #1, #18, #29  
対象ファイル: `ZeroHitRecordingService`, `ZeroHitSearchRepository`, `ZeroHitSearch`, migration

現状:

- `ZeroHitRecordingService.record()` は `findByNormalizedKeyword()` -> entity update -> save の read-modify-write。
- concurrent request では hit count の lost update が起きうる。
- first insert の duplicate key recovery は `saveAndFlush()` の `DataIntegrityViolationException` を catch したあと、同じ transaction 内で recovery している。PostgreSQL では transaction が abort 状態になりうるため危険。

最適な修正:

- PostgreSQL native upsert を repository 境界に追加する。
- 推奨 SQL:
  - `INSERT INTO zero_hit_searches (...) VALUES (...)`
  - `ON CONFLICT (normalized_keyword) DO UPDATE SET`
  - `keyword = EXCLUDED.keyword`
  - `hit_count = zero_hit_searches.hit_count + 1`
  - `last_searched_at = EXCLUDED.last_searched_at`
  - `estimated_opportunity_loss = :calculatedLossForNextCount`
  - `priority = :priorityForNextCount`
  - `RETURNING *`
- `estimated_opportunity_loss` と `priority` は次回 count に依存するため、最も堅牢なのは SQL 内で `hit_count + 1` を基準に CASE / 計算するか、`UPDATE ... RETURNING hit_count` 後に同一文または stored expression で整合させること。
- JPA entity を返す必要がある場合は native query の returning mapping を使う。難しければ upsert 後に `findByNormalizedKeyword()` を read-only で取得する。ただし increment は upsert 文で完了させる。
- duplicate insert retry は削除する。

代替案:

- `@Version` + optimistic retry でも lost update は防げるが、duplicate insert recovery の failed transaction 問題は別対応が必要。PostgreSQL を前提にできる本プロジェクトでは atomic upsert が最適。

検証:

- Testcontainers PostgreSQL で 20 並列 `record("Powder Finder XL")` を実行し、1 row / `hit_count=20` を確認。
- 同一 normalized keyword の異なる display keyword でも 1 row のまま更新される。
- first / repeat の priority と estimated opportunity loss が hit count と一致する。

#### C-2. Aggregate invariant と domain policy の強化

対象指摘: #3, #4  
対象ファイル: `ZeroHitSearch`, `OpportunityLossCalculator`, `ZeroHitPriorityDecider`, `ZeroHitRecordingService`

現状:

- `ZeroHitSearch` の public all-args constructor は blank keyword、hitCount 0、timestamp 逆転、負の金額などの不正状態を作れる。
- `updateDemandSignals()` で opportunity loss / priority を外部から任意に上書きできる。
- `recordRepeat()` も priority / loss の整合性を外部計算に依存している。

最適な修正:

- `ZeroHitSearch.firstHit(...)` と `recordRepeat(...)` を唯一の business mutation にする。
- all-args constructor は package-private にするか、test fixture 用 factory に寄せる。
- invariant:
  - keyword / normalizedKeyword は non-blank
  - hitCount >= 1
  - estimatedOpportunityLoss は null でない、または non-negative
  - firstSearchedAt <= lastSearchedAt
  - priority は hitCount の rule と一致
- `ZeroHitDemandPolicy` のような pure domain service を作り、hitCount / averagePrice から `Priority` と `Money` をまとめて返す。
- `updateDemandSignals()` は削除または private/package-private にする。

検証:

- invalid constructor / factory 入力で例外。
- repeat 後に hitCount、priority、lastSearchedAt、loss が一貫する。
- mutation method が arbitrary priority を受け付けない。

#### C-3. User-controlled keyword logging の除去

対象指摘: #41  
対象ファイル: `ZeroHitRecordingService`, logging config

現状:

- `zero_hit_recorded normalizedKeyword={...}` で user input 由来の normalized keyword が raw log に残る。

最適な修正:

- raw keyword / normalizedKeyword はログに出さない。
- 代わりに次を出す。
  - event name
  - stable hash prefix: SHA-256 normalized keyword の先頭 12 文字
  - keyword length
  - hitCount
  - priority
- hash salt を使う場合は env 由来。ただし demo では salt 未設定でも raw value を出さないことを優先する。

検証:

- ログ出力テストで検索語そのものが含まれない。
- hash / length / priority は含まれる。

### Phase D: GET search の副作用分離

対象指摘: #6, #37  
対象ファイル: `ProductController`, `ProductSearchService`, `ZeroHitRecordingService`, frontend API client, `backend-design.md`

現状:

- `backend-design.md` と要件定義は「検索結果が 0 件の場合、バックエンドに Zero Hit として記録する」としている。
- 実装は `GET /api/products/search` の service 内で zero-hit を記録している。
- レビューは HTTP safe method と analytics pollution の観点で High と判定している。

最適な修正:

- GET は検索結果の取得だけにする。
- `ProductSearchResponse.zeroHitRecorded` は `zeroHitCandidate` または `zeroHitDetected` に改名するか、互換性のため残しつつ false にする期間を設ける。
- 新規 command endpoint を追加する。
  - `POST /api/zero-hit-searches`
  - request: `{ "keyword": "..." }`
  - response: `{ "recorded": true, "keywordHash": "...", "hitCount": ... }`
- frontend は検索 submit の結果が 0 件かつ keyword non-blank の場合だけ POST する。
- API abuse を避けるため POST endpoint に validation、rate limit、CORS、必要に応じて CSRF 相当の防御を入れる。
- `backend-design.md` と `front-design.md` の API contract を同時更新する。

互換案:

- 既存 frontend を短期的に壊さないため、移行期間だけ GET 側記録を feature flag で残すことは可能。ただし OSS 公開品質では最終的に read-only GET へ収束させる。

検証:

- GET search を複数回叩いても zero_hit_searches が増えない。
- 0 件検索後の POST で 1 row 記録される。
- 空 keyword / 長すぎる keyword は POST 400。
- frontend の一般検索 journey で zero-hit が漏れずに記録される。

### Phase E: AI provider の resilience と transaction 分離

#### E-1. Transaction scope 分離

対象指摘: #20  
対象ファイル: `AiConsultationService`, `ProductRepository`

現状:

- `AiConsultationService.consult()` 全体が `@Transactional(readOnly = true)`。
- product context 取得後も transaction が開いたまま live AI provider call が行われる。

最適な修正:

- `AiConsultationContextService` などを作り、DB context 取得だけを `@Transactional(readOnly = true)` にする。
- `AiConsultationService.consult()` から `@Transactional` を外し、AI call は transaction outside で実行する。
- context は immutable record にして、provider 境界へ entity を渡さない。

検証:

- `consult()` が transaction active で provider を呼ばないことを unit / integration で確認。
- provider が遅延 / 失敗しても DB connection が保持されない。

#### E-2. Retry / circuit breaker / timeout

対象指摘: #64, #76, #77  
対象ファイル: `SpringAiProviderClient`, `SpringAiConfig`, `AiProperties`, `application.yml`, `pom.xml`

現状:

- `SpringAiProviderClient.generate()` は provider call を直接行い、retry / circuit breaker がない。
- OpenAI client に明示 timeout がない。
- branch coverage が不足している。

最適な修正:

- Resilience4j Spring Boot 3 を追加する。
  - `resilience4j-spring-boot3`
  - `resilience4j-retry`
  - `resilience4j-circuitbreaker`
- `SpringAiProviderClient.generate()` の live call 境界に `@Retry(name = "aiProvider")` と `@CircuitBreaker(name = "aiProvider")` を付ける。
- retry は低回数にする。
  - max attempts: 2 または 3
  - wait duration: 250ms から exponential backoff
  - retry 対象: transient network / timeout / 5xx 相当のみ
- `app.ai.response-timeout` を追加し、Spring AI / underlying HTTP client に適用する。
- timeout 適用が Spring AI builder で困難な場合は、provider adapter を `RestClient` / `WebClient` 経由の OpenAI-compatible endpoint に切り出す。ただし Spring AI 優先方針を保ち、最小差分にする。
- provider failure は `AiProviderException` に包み、fallback response は継続する。

検証:

- API key 未設定 -> `Optional.empty()`。
- `ChatClient` 未登録 -> `Optional.empty()`。
- blank answer -> `Optional.empty()`。
- provider success -> answer。
- provider RuntimeException -> `AiProviderException`。
- retry 対象例外で retry される。
- circuit open 時は fallback / error response になる。
- timeout 設定が property binding される。

### Phase F: Error / logging / observability / security headers

#### F-1. ProblemDetail migration

対象指摘: #11, #24  
対象ファイル: `GlobalExceptionHandler`, `ApiErrorWriter`, frontend error normalization tests

現状:

- `GlobalExceptionHandler` は custom `ApiErrorResponse` を返す。
- security handler は `ApiErrorWriter` で同じ custom payload を書く。

最適な修正:

- Spring `ProblemDetail` に移行する。
- stable extension properties:
  - `code`
  - `path`
  - `errors`
  - `correlationId`
- response content type は `application/problem+json` を基本にする。
- frontend は `message`, `detail`, `title` のどれでも表示できるようにしておく。
- 移行により `ApiErrorResponse` は削除または deprecated internal adapter にする。

検証:

- validation error に `code=VALIDATION_ERROR` と `errors` がある。
- auth failure に `code=AUTHENTICATION_REQUIRED` / `AUTHENTICATION_FAILED` がある。
- unexpected error は stack trace / SQL / token を response に出さない。

#### F-2. Throwable logging と AI fallback logging

対象指摘: #22, #23  
対象ファイル: `GlobalExceptionHandler`, `AiConsultationService`

現状:

- catch-all 500 log は exception class 名だけで stack trace が出ない。
- AI provider fallback の warn log は exception details を落としている。

最適な修正:

- `LOGGER.error("Unexpected API error at {}", request.getRequestURI(), exception);`
- `LOGGER.warn("ai_consultation providerStatus={}", response.providerStatus(), exception);`
- prompt、API key、Authorization、password、raw keyword はログに含めない。

検証:

- log capture で Throwable が渡されることを確認。
- response には exception message が出ない。

#### F-3. X-Correlation-Id / MDC

対象指摘: #21  
対象ファイル: `RequestLoggingFilter`, `SecurityConfig`, logback

現状:

- request logging は path / status / duration のみ。
- `X-Correlation-Id` を読まず、生成せず、response header にも返さない。
- MDC cleanup がない。

最適な修正:

- `RequestLoggingFilter` で以下を実装する。
  - request header `X-Correlation-Id` が valid なら使用
  - なければ UUID 生成
  - `MDC.put("correlationId", id)`
  - response header に `X-Correlation-Id`
  - finally で `MDC.remove("correlationId")`
- CORS exposed headers に `X-Correlation-Id` を追加する。

検証:

- header 指定あり -> 同じ ID が response。
- header 指定なし -> UUID が response。
- 連続 request で MDC が漏れない。

#### F-4. Structured JSON logging

対象指摘: #25, #44  
対象ファイル: `pom.xml`, `logback-spring.xml`, `application-dev.yml`, `application-prod.yml`

現状:

- `logstash-logback-encoder` がない。
- `logback-spring.xml` がない。

最適な修正:

- `net.logstash.logback:logstash-logback-encoder` を追加する。
- `logback-spring.xml` を追加する。
  - dev: readable pattern log
  - prod/docker: JSON log
  - fields: application name, profile, correlationId, trace/span if present, method/path/status/duration
- password / token / raw keyword を field に入れない。

検証:

- docker profile で JSON log が出る。
- correlationId が log に含まれる。

#### F-5. Security headers

対象指摘: #32, #38  
対象ファイル: `SecurityConfig`

現状:

- SecurityFilterChain に明示的な `.headers(...)` がない。

最適な修正:

- API と frontend が別 origin の構成を前提に、Spring Security headers を明示設定する。
  - `frameOptions().deny()`
  - `contentTypeOptions`
  - `referrerPolicy(STRICT_ORIGIN_WHEN_CROSS_ORIGIN)`
  - `permissionsPolicy("geolocation=(), microphone=(), camera=()")`
  - CSP: JSON API として最小化。必要なら frontend 側 CSP と分担する。
  - HSTS: TLS 終端が確定した profile のみ有効化。

検証:

- `/api/products` と `/api/admin/zero-hits` の response に期待 header がある。
- CORS と Authorization header が壊れない。

### Phase G: Configuration / secret / profile / runtime

対象指摘: #19, #26, #31, #33, #34, #35  
対象ファイル: `application.yml`, `application-dev.yml`, `application-docker.yml`, `application-prod.yml`, `.env.example`, `docker-compose.yml`

現状:

- default `application.yml` に `SPRING_DATASOURCE_URL` の localhost fallback がある。
- `application-docker.yml` に `skishop` password fallback がある。
- dev / prod profile が分離されていない。
- virtual threads が有効化されていない。
- TLS / reverse proxy termination の設定または文書化がない。

最適な修正:

- `application.yml` は共通設定のみとし、secret / datasource は env 必須にする。
  - `url: ${SPRING_DATASOURCE_URL}`
  - `username: ${SPRING_DATASOURCE_USERNAME}`
  - `password: ${SPRING_DATASOURCE_PASSWORD}`
- `application-dev.yml` に localhost fallback を移す。
- `application-docker.yml` は compose から env を渡す。profile 内に literal password fallback を置かない。
- `application-prod.yml` を追加する。
  - root log level WARN
  - SQL display disabled
  - stacktrace disabled
  - env required
  - `server.forward-headers-strategy=framework`
  - HSTS は TLS termination 方針に合わせる。
- `.env.example` に非秘密のサンプル名のみを書く。実 password は入れないか、local demo 用であることを明記する。
- Java 21 / Spring Boot の virtual threads を有効化する。
  - `spring.threads.virtual.enabled: true`
  - request logging / security filter / MDC の動作確認を行う。

検証:

- prod profile で DB env 未設定なら fail fast。
- docker compose は `.env` または compose env で起動する。
- `application-docker.yml` に literal password fallback がない。
- virtual threads 有効状態で backend test / smoke test が通る。

### Phase H: Data access / API performance / null safety

#### H-1. Pagination と duplicate count の修正

対象指摘: #68, #69, #70  
対象ファイル: `ProductRequestOptions`, `ProductQueryService`, `ProductSearchService`, DTO, frontend

現状:

- page は常に 0 固定で、`limit` のみ。
- `findAll(spec, pageable)` が count を発行しうるのに、さらに `count(spec)` を呼ぶ。
- search でも count を重複実行している。

最適な修正:

- API を `page` / `size` に拡張する。既存 `limit` は `size` alias として移行期間だけ許容する。
- `Page<Product> page = repository.findAll(spec, pageable)` を使い、`page.getTotalElements()` を response に使う。
- `ProductListResponse` / `ProductSearchResponse` に `page`, `size`, `totalPages`, `totalCount` を含める。
- frontend の pagination UI がまだない場合は、まず API 側は page=0 を default にして既存 UX を維持する。

検証:

- `page=1&size=20` で 2 ページ目が取得できる。
- count query が二重に呼ばれないことを repository mock / SQL log で確認。
- 既存 frontend の初期表示が壊れない。

#### H-2. DTO projection

対象指摘: #71  
対象ファイル: `ProductRepository`, `ProductDto`, `ProductMapper`, query service

現状:

- public list/search は managed `Product` entity を materialize し、service で DTO mapping している。

最適な修正:

- read-only public API は DTO projection / interface projection を使う。
- `ProductReadProjection` を定義し、repository query で必要列だけ取得する。
- `ProductMapper` は projection -> DTO に対応する。
- admin / domain mutation で entity が必要な箇所とは分ける。

検証:

- list/search response が既存 DTO と一致する。
- SQL が必要列だけを select する。

#### H-3. Null safety

対象指摘: #16, #17  
対象ファイル: `ProductDto`, `Product`, `ProductRepository`

現状:

- `imageUrl` は nullable だが DTO / getter / constructor parameter に nullable 契約がない。
- repository query は `category` null を受け入れる設計だが `@Nullable` がない。

最適な修正:

- `org.springframework.lang.Nullable` を付与する。
  - `Product.imageUrl`
  - `Product.getImageUrl()`
  - `ProductDto.imageUrl`
  - repository `@Param("category")`
- 代替として image URL を non-null fallback にすることも可能だが、DB schema は nullable のため nullable 明示が最小で正しい。

検証:

- null image URL の product が response で安全に扱われる。
- repository method の static analysis / IDE warning が消える。

#### H-4. Entity column / audit timestamp

対象指摘: #28, #30  
対象ファイル: `Product`, `ZeroHitSearch`

現状:

- 一部 `@Column` が `name` を省略している。
- `Product` は `@PrePersist` / `@PreUpdate` で audit timestamp を手動更新している。

最適な修正:

- 全 persisted field に explicit `@Column(name = "...")` を付ける。
- `Product.createdAt` に `@CreationTimestamp`、`updatedAt` に `@UpdateTimestamp` を付ける。
- `ZeroHitSearch` の time は business event time なので、automatic audit ではなく domain method で制御してよい。ただし id / keyword / priority の column name は明示する。

検証:

- Hibernate `ddl-auto=validate` が通る。
- Product persist / update 時に timestamp がセットされる。

#### H-5. Primary key type

対象指摘: #27  
対象ファイル: `Product`, `ZeroHitSearch`, migrations, DTO

現状:

- entity primary key は `UUID`。
- review standard は String UUID を要求しているが、`backend-design.md` と DB migration は PostgreSQL UUID を前提にしている。

推奨対応:

- ただちに String 化しない。
- `backend-design.md` の `UUID` 方針を project standard として明示し、レビュー標準の例外として記録する。
- もし String UUID が必須と決定された場合のみ、別 migration で DB type / DTO / repository ID type をまとめて変更する。

検証:

- UUID 方針を docs に明記し、review exception として追跡する。

#### H-6. Package convention / DTO split

対象指摘: #2  
対象ファイル: backend package 全体、設計書

現状:

- entity は `com.skishop.entity`、DTO は `com.skishop.dto` flat package。
- architecture review の想定は `model` と `dto.request` / `dto.response`。

最適な修正:

- correctness 修正後に package 整理を行う。
- JPA entity は `com.skishop.model` へ移す。
- request DTO:
  - `LoginRequest`
  - `AiConsultRequest`
  - zero-hit record request
- response DTO:
  - `ProductDto`
  - `ProductListResponse`
  - `ProductSearchResponse`
  - `ZeroHitListResponse`
  - auth / AI response
- 移行後、controller / service / tests の import を一括更新する。

検証:

- package 移行後に `./mvnw test`。
- frontend DTO contract に影響がないことを API tests で確認。

#### H-7. ZeroHitRecordingService interface

対象指摘: #14  
対象ファイル: `ZeroHitRecordingService`, `ProductSearchService`

現状:

- `ProductSearchService` は concrete `ZeroHitRecordingService` に依存している。

最適な修正:

- `ZeroHitRecordingUseCase` または `ZeroHitRecorder` interface を追加する。
- `ZeroHitRecordingService implements ZeroHitRecordingUseCase`。
- consumer は interface に依存する。
- GET 副作用分離後は、新しい POST command controller がこの interface を使う。

検証:

- DI が interface 経由で解決される。
- ProductSearchService は zero-hit recorder に依存しなくなるか、移行期間のみ optional にする。

#### H-8. AuthController principal binding

対象指摘: #10  
対象ファイル: `AuthController`

現状:

- `/api/auth/me` は `Authentication` を受け取り、principal を manual cast している。

最適な修正:

- `me(@AuthenticationPrincipal AdminUserDto user)` に変更する。
- null は security chain 上は到達しないが、防御的に 401 を返せるようにする。

検証:

- valid token で me response。
- invalid token で 401。
- manual cast が消える。

#### H-9. H2 dependency scope

対象指摘: #43  
対象ファイル: `pom.xml`

現状:

- H2 が runtime scope。
- 実行 runtime は PostgreSQL であり、H2 は test resources 用。

最適な修正:

- H2 scope を `test` に変更する。
- PostgreSQL Testcontainers を追加する場合、H2 は軽量 unit / slice test、PostgreSQL は concurrency / migration / native upsert test 用に役割分担する。

検証:

- runtime dependency tree に H2 が含まれない。
- test は継続成功。

### Phase I: Domain value objects

対象指摘: #5  
対象ファイル: `Product`, `ZeroHitSearch`, domain package

現状:

- price / estimatedOpportunityLoss は raw `BigDecimal`。
- normalized keyword は raw `String`。

最適な修正:

- `Money` value object を導入する。
  - non-null
  - scale 2
  - non-negative
  - currency は MVP では JPY 固定
- `NormalizedKeyword` value object を導入する。
  - normalized string は non-blank
  - max length
  - lowercase / collapsed whitespace は `KeywordNormalizer` と整合
- JPA では `@Embeddable` または `AttributeConverter` を使う。
- 大きな schema 変更を避けるため、DB column は現状維持し、Java model 内の型安全性を上げる。

検証:

- invalid money / keyword の生成が失敗する。
- JPA persist / read で converter が通る。
- API response は従来どおり number / string を返す。

### Phase J: Test / dependency / release hygiene

#### J-1. DI-managed service direct instantiation の解消

対象指摘: #12, #13  
対象ファイル: `AiConsultationServiceTests`, `AdminAuthServiceTests`

現状:

- tests が `new AiConsultationService(...)` と `new AdminAuthService(...)` を直接呼ぶ。
- AGENTS の禁止事項に抵触する扱いになっている。

最適な修正:

- Spring-managed service のテストは `@SpringBootTest` または focused Spring context で inject する。
- pure logic を unit test したい箇所は、DI-managed service から非 Spring の collaborator に抽出する。
  - `AdminTokenManager`
  - `AiConsultationOrchestrator` など
- Service 自体を new するテストは削除する。

検証:

- service tests は Spring injection。
- pure class tests は non-DI class のみ直接 new。

#### J-2. Test naming / AAA

対象指摘: #45, #46  
対象ファイル: `ZeroHitDomainTests`, `AdminAuthServiceTests`

現状:

- test method 名が `should_ExpectedResult_when_Condition` 形式でない。
- `AdminAuthServiceTests` の一部 test は複数 Act と複数 behavior をまとめている。

最適な修正:

- method 名を統一する。
  - `should_returnNormalizedKeyword_when_keywordContainsCaseAndWhitespace`
  - `should_calculateOpportunityLoss_when_hitCountAndAveragePriceProvided`
  - `should_choosePriority_when_hitCountCrossesThresholds`
- login success / token uniqueness / token validation / missing credential / wrong credential / unconfigured credential を分ける。
- `@DisplayName` は Medium だが、可読性のため合わせて追加してよい。

検証:

- test report で behavior が読みやすい。
- single Act / single assertion focus が守られる。

#### J-3. Stable version / publication metadata

対象指摘: #42  
対象ファイル: `backend/pom.xml`

現状:

- version が `0.0.1-SNAPSHOT`。
- license / scm metadata も空だが、これは escalation / publication readiness の範囲。

最適な修正:

- OSS 公開前の backend artifact は `0.1.0` に変更する。
- root の OSS license 決定後、pom の license / scm を埋める。
- release branch 以外で SNAPSHOT を使う場合は release process を docs に書く。

検証:

- `mvn help:evaluate -Dexpression=project.version` が `0.1.0`。

## 4. 推奨実装順序

1. Phase A の設計判断を docs に反映する。
2. Phase B の validation / auth hardening を実装する。
3. Phase C の PostgreSQL atomic upsert と concurrency test を実装する。
4. Phase G の secret / profile 分離を実装し、docker compose を再検証する。
5. Phase E の AI resilience / timeout / transaction 分離を実装する。
6. Phase F の ProblemDetail / logging / correlation / headers を実装する。
7. Phase D の GET 副作用分離を backend / frontend / design docs で同時実装する。
8. Phase H の pagination / projection / null safety / entity annotation を実装する。
9. Phase I の value object 化を実装する。
10. Phase J の test / dependency / release hygiene を実装し、coverage を確認する。

## 5. 完了チェック

Critical / High 全体の完了条件:

- `check-report-1.md` の Critical / High 全指摘が、修正済み、設計判断により例外承認済み、または別 issue として明示的に追跡済みである。
- `./mvnw test` が成功する。
- `./mvnw verify` で JaCoCo report が生成され、line / branch coverage 80% 以上を目標に確認する。
- PostgreSQL Testcontainers または docker compose の PostgreSQL で zero-hit concurrency test が成功する。
- docker compose で backend / frontend / db が起動し、主要 journey が動く。
- API validation error、auth error、not found、server error が ProblemDetail 形式で安全に返る。
- logs に password、token、API key、raw search keyword が出ない。
- `application-docker.yml` と `application.yml` に secret fallback がない。
- AI key 未設定、AI provider timeout、provider error でも admin AI consultation が fallback / controlled error で継続する。
- frontend の検索、zero-hit 記録、admin dashboard、AI 相談、login / logout が主要画面で崩れていない。

## 6. 残すべき明示的な例外候補

次の項目は、修正ではなく project standard の明文化で解決する選択肢がある。

| 指摘 | 例外候補 | 推奨 |
| --- | --- | --- |
| #27 String UUID | PostgreSQL UUID を維持 | 設計書が UUID 前提のため、UUID 維持を推奨。 |
| #2 package convention | `entity` / flat DTO を維持 | OSS 品質と将来拡張を考えると、最終的には `model` / request / response へ移行推奨。 |
| #11 / #24 ApiErrorResponse | custom error contract を維持 | レビュー標準に合わせ、ProblemDetail へ移行推奨。 |
| #19 virtual threads | profile-gated only | Java 21 backend としては有効化推奨。ただし MDC / request logging 検証を必須にする。 |
| #6 / #37 GET side effect | GET 記録を維持 | 要件上は自然だが、HTTP semantics と security の観点では POST 分離推奨。 |

