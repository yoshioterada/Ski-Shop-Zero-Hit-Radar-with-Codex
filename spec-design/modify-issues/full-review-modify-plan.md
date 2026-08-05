# Full Review Modify Plan

Created: 2026-06-04
Scope: `backend`
Reference review: `review-reports/manual-backend-full/backend/check-report-1.md`
Target severities: Critical / High

## 1. Policy

Many Critical / High findings in `check-report-1.md` describe the same root cause from the perspectives of different agents. Therefore, this plan groups remediation work by implementation responsibility instead of addressing each finding number sequentially and independently.

Use the following priority order.

1. Security, input validation, secrets, and authentication protection
2. Data integrity and concurrency safety for zero-hit recording
3. Resilience, timeout handling, and transaction separation at the AI provider boundary
4. Errors, logging, correlation IDs, and security headers
5. API contracts, REST semantics, pagination, and data-access optimization
6. Domain model, package conventions, dependencies, and test quality

## 2. Critical / High Finding Remediation Map

| Remediation theme | Findings |
| --- | --- |
| Input validation and size limits | #7, #8, #9, #15, #39 |
| Zero-hit upsert / concurrency / aggregate invariants | #1, #3, #4, #18, #29 |
| Separation of GET search side effects | #6, #37 |
| Brute-force protection and token lifecycle for administrator authentication | #36, #40 |
| Configuration profiles / secrets / TLS / virtual threads | #19, #26, #31, #33, #34, #35 |
| AI provider resilience / timeout / transaction boundaries | #20, #64, #76, #77 |
| Error responses / logging / correlation / security headers / PII logging | #11, #21, #22, #23, #24, #25, #32, #38, #41, #44 |
| Data access / entities / null safety / pagination / projections | #2, #5, #10, #14, #16, #17, #27, #28, #30, #43, #68, #69, #70, #71 |
| Test / dependency / release hygiene | #12, #13, #42, #45, #46 |

## 3. Implementation Phases

### Phase A: Design Decisions Required Before Implementation

Decide the following items as project standards before implementation begins. Recommended decisions are included.

| Decision item | Recommended decision | Rationale |
| --- | --- | --- |
| Whether `GET /api/products/search` may record a zero hit | Make GET read-only and separate zero-hit recording into `POST /api/zero-hit-searches` or `POST /api/products/search-events` | This avoids violating HTTP safe-method principles and prevents cache, bot, or CSRF-like data pollution risks. The current `backend-design.md` states that GET performs recording, so update the design document and frontend API calls at the same time. |
| Whether to retain `ApiErrorResponse` for error responses | Migrate to the Spring `ProblemDetail` / RFC 9457 shape | Align with the review standard. Make the frontend accept `message` / `detail` / `title` to minimize breaking changes. |
| Whether to retain the `entity` package or move it to `model` | As an OSS-quality convention, migrate to `com.skishop.model` and split DTOs into `dto.request` / `dto.response`. Perform this change in the final structural cleanup phase | Combining functional fixes with a package rename makes the diff difficult to review, so correct behavior first. |
| Whether to retain PostgreSQL `UUID` primary keys or use String UUIDs | Prioritize PostgreSQL / Hibernate type safety and retain `UUID`. Create a separate migration only if the review standard requires String UUIDs | `backend-design.md` and the migrations assume UUIDs. Converting to String would create broad API / DB changes with greater breakage risk than quality benefit. |
| Whether AI retries are permitted | Add a low retry count and a circuit breaker at the provider boundary. Restrict retries to network / transient errors to control token cost | Prevent a live provider outage from blocking the request path. Retain the fallback. |
| TLS | Standardize on reverse-proxy / load-balancer termination rather than direct Spring Boot SSL, and define `server.forward-headers-strategy=framework` and HSTS conditions | This cleanly separates the Docker Compose demo from production assumptions. |

### Phase B: Immediate Security and Validation Remediation

#### B-1. Controller Query Parameter Validation

Findings: #7, #8, #39
Files: `ProductController`, `AdminZeroHitController`, `GlobalExceptionHandler`, `application.yml`

Current state:

- `ProductController` and `AdminZeroHitController` do not have `@Validated`, and query parameters depend on service-layer `IllegalArgumentException` handling.
- `limit`, `days`, `sort`, `q`, and `category` have no Bean Validation boundaries.
- Request-body and free-text size limits are insufficient in both application configuration and DTOs.

Optimal remediation:

- Add `@Validated` to the controllers.
- Add Bean Validation to query parameters.
  - `limit`: `@Min(1) @Max(100)`
  - `days`: `@Min(1) @Max(365)`
  - `q`: `@Size(max = 100)`
  - `category`: `@Size(max = 80)`
  - product sort: `createdAt,desc|price,asc|price,desc`
  - zero-hit sort: `hitCount,desc|lastSearchedAt,desc`
- Handle `HandlerMethodValidationException` and `ConstraintViolationException` as 400 responses.
- Configure Tomcat request limits.
  - `server.tomcat.max-http-form-post-size`
  - `server.tomcat.max-swallow-size`
  - `server.max-http-request-header-size`
- Retain service-layer validation as defense in depth.

Validation:

- `GET /api/products?limit=0` returns 400.
- `GET /api/products?limit=101` returns 400.
- `GET /api/products/search?q=<101 or more characters>` returns 400.
- `GET /api/admin/zero-hits?days=0` returns 400.
- `GET /api/admin/zero-hits?sort=bad` returns 400.

#### B-2. AI Consultation Request Validation / Null Contract

Findings: #9, #15, #39
Files: `AiConsultRequest`, `AiConsultController`, `AiPromptBuilder`

Current state:

- `AiConsultRequest.question` has only `@NotBlank`.
- The optional / nullable contracts for `keyword`, `hitCount`, and `lastSearchedAt` are not explicit.
- Free text included in the prompt has no length limit.

Optimal remediation:

- Add explicit constraints to `AiConsultRequest`.
  - `keyword`: `@Nullable @Size(max = 200)`
  - `question`: `@NotBlank @Size(max = 1000)`
  - `hitCount`: `@Nullable @Min(0) @Max(1_000_000)`
  - `lastSearchedAt`: `@Nullable @PastOrPresent`
- In `AiPromptBuilder`, use trimmed values and convert null / blank values to safe values.
- Enforce through tests the policy that prompts must never include tokens / API keys / Authorization headers.

Validation:

- A blank question or a question with 1001 characters returns 400.
- A negative hitCount returns 400.
- A future timestamp returns 400.
- Fallback / provider-error responses do not expose secrets or exception messages.

#### B-3. Admin Login Rate Limiting / Lockout

Finding: #36
Files: `AdminAuthService`, `AuthController`, `SecurityConfig`

Current state:

- `AdminAuthService.login()` does not retain authentication-failure counts and cannot prevent brute-force attempts.
- No limits are applied across both username and source IP.

Optimal remediation:

- Introduce `LoginAttemptLimiter`.
  - key: `normalizedUsername + sourceIp`
  - threshold: 5 failures / 10 minutes
  - lock duration: 15 minutes
  - Use an in-memory implementation for the demo, behind an interface that can later be replaced by Redis or another store.
- Have `AuthController.login()` pass the source IP from `HttpServletRequest`, or protect `/api/auth/login` with a dedicated filter.
- Clear the failure counter for the relevant key after successful authentication.
- Do not log raw username / password values. Hash the username as well if it must be logged.
- Always use safe, fixed response messages with `401 AUTHENTICATION_FAILED` or `429 RATE_LIMITED`.

Validation:

- Consecutive failures result in 429 or a lockout-specific 401.
- During lockout, even the correct password is rejected.
- The failure counter is reset after a successful login.
- Passwords do not appear in logs.

#### B-4. Token Revocation / Active Token Cap

Finding: #40
Files: `AdminAuthService`, `AdminAuthUseCase`, `AuthController`, `SecurityConfig`

Current state:

- Opaque bearer tokens have only an expiry; logout / revocation is not supported.
- Every login adds another token without limit.

Optimal remediation:

- Add `POST /api/auth/logout` to revoke the current token.
- Add `revokeToken(String token)` and `purgeExpiredSessions()` to `AdminAuthUseCase`.
- Limit active tokens per administrator to approximately 3. For the MVP, the simplest approach is to invalidate the oldest token on each new login.
- Ensure `BearerTokenAuthenticationFilter` can authenticate the token for the logout endpoint.
- Make the frontend logout action call the logout API in addition to deleting the token.

Validation:

- `/api/auth/me` returns 401 after logout.
- After 4 logins, the oldest token is invalidated.
- Expired tokens are removed during validation or purge.

### Phase C: Zero-Hit Recording Integrity Remediation

#### C-1. Migrate to a PostgreSQL Atomic Upsert

Findings: #1, #18, #29
Files: `ZeroHitRecordingService`, `ZeroHitSearchRepository`, `ZeroHitSearch`, migration

Current state:

- `ZeroHitRecordingService.record()` performs a `findByNormalizedKeyword()` -> entity update -> save read-modify-write sequence.
- Concurrent requests can cause lost updates to the hit count.
- Duplicate-key recovery for the first insert catches `DataIntegrityViolationException` from `saveAndFlush()` and then attempts recovery in the same transaction. This is unsafe because PostgreSQL can leave the transaction in an aborted state.

Optimal remediation:

- Add a PostgreSQL native upsert at the repository boundary.
- Recommended SQL:
  - `INSERT INTO zero_hit_searches (...) VALUES (...)`
  - `ON CONFLICT (normalized_keyword) DO UPDATE SET`
  - `keyword = EXCLUDED.keyword`
  - `hit_count = zero_hit_searches.hit_count + 1`
  - `last_searched_at = EXCLUDED.last_searched_at`
  - `estimated_opportunity_loss = :calculatedLossForNextCount`
  - `priority = :priorityForNextCount`
  - `RETURNING *`
- Because `estimated_opportunity_loss` and `priority` depend on the next count, the most robust approach is to calculate them in SQL from `hit_count + 1`, using CASE / calculation, or to keep them consistent in the same statement or a stored expression after `UPDATE ... RETURNING hit_count`.
- If a JPA entity must be returned, use native-query returning mapping. If that is difficult, perform a read-only `findByNormalizedKeyword()` after the upsert. The increment itself must be completed by the upsert statement.
- Remove the duplicate-insert retry.

Alternative:

- `@Version` plus optimistic retry can also prevent lost updates, but the failed-transaction problem during duplicate-insert recovery still requires separate handling. Because this project can assume PostgreSQL, an atomic upsert is optimal.

Validation:

- Run 20 concurrent `record("Powder Finder XL")` calls against Testcontainers PostgreSQL and confirm 1 row / `hit_count=20`.
- Different display keywords with the same normalized keyword update the same single row.
- Priority and estimated opportunity loss for first / repeat records match the hit count.

#### C-2. Strengthen Aggregate Invariants and Domain Policy

Findings: #3, #4
Files: `ZeroHitSearch`, `OpportunityLossCalculator`, `ZeroHitPriorityDecider`, `ZeroHitRecordingService`

Current state:

- The public all-arguments constructor of `ZeroHitSearch` can create invalid states such as a blank keyword, hitCount 0, reversed timestamps, or a negative monetary amount.
- `updateDemandSignals()` allows opportunity loss / priority to be overwritten arbitrarily from outside the aggregate.
- `recordRepeat()` also depends on external calculations to maintain priority / loss consistency.

Optimal remediation:

- Make `ZeroHitSearch.firstHit(...)` and `recordRepeat(...)` the only business mutations.
- Make the all-arguments constructor package-private or move test construction to a test-fixture factory.
- Invariants:
  - keyword / normalizedKeyword are non-blank
  - hitCount >= 1
  - estimatedOpportunityLoss is non-null or non-negative
  - firstSearchedAt <= lastSearchedAt
  - priority matches the hitCount rule
- Create a pure domain service such as `ZeroHitDemandPolicy` that returns `Priority` and `Money` together from hitCount / averagePrice.
- Remove `updateDemandSignals()` or make it private/package-private.

Validation:

- Invalid constructor / factory input throws an exception.
- After a repeat, hitCount, priority, lastSearchedAt, and loss remain consistent.
- Mutation methods do not accept arbitrary priority values.

#### C-3. Remove User-Controlled Keyword Logging

Finding: #41
Files: `ZeroHitRecordingService`, logging config

Current state:

- `zero_hit_recorded normalizedKeyword={...}` writes a normalized keyword derived from user input to raw logs.

Optimal remediation:

- Do not log raw keyword / normalizedKeyword values.
- Log the following instead.
  - event name
  - stable hash prefix: first 12 characters of the SHA-256 normalized keyword
  - keyword length
  - hitCount
  - priority
- If a hash salt is used, source it from the environment. For the demo, prioritize never emitting the raw value even when no salt is configured.

Validation:

- Logging tests confirm that the search term itself is not included.
- The hash / length / priority are included.

### Phase D: Separate GET Search Side Effects

Findings: #6, #37
Files: `ProductController`, `ProductSearchService`, `ZeroHitRecordingService`, frontend API client, `backend-design.md`

Current state:

- `backend-design.md` and the requirements state that when a search returns zero results, the backend records it as a Zero Hit.
- The implementation records the zero hit inside the service for `GET /api/products/search`.
- The review rates this as High because of HTTP safe-method semantics and analytics-pollution risk.

Optimal remediation:

- Make GET retrieve search results only.
- Rename `ProductSearchResponse.zeroHitRecorded` to `zeroHitCandidate` or `zeroHitDetected`, or retain it temporarily with a false value for compatibility.
- Add a new command endpoint.
  - `POST /api/zero-hit-searches`
  - request: `{ "keyword": "..." }`
  - response: `{ "recorded": true, "keywordHash": "...", "hitCount": ... }`
- The frontend sends the POST only when a submitted search returns zero results and the keyword is non-blank.
- To prevent API abuse, apply validation, rate limiting, CORS, and CSRF-equivalent protection where necessary to the POST endpoint.
- Update the API contracts in `backend-design.md` and `front-design.md` at the same time.

Compatibility option:

- To avoid breaking the existing frontend in the short term, GET-side recording may remain behind a feature flag during the migration period. For OSS publication quality, the final state must converge on a read-only GET.

Validation:

- Repeated GET searches do not increase `zero_hit_searches`.
- A POST after a zero-result search records 1 row.
- An empty keyword / excessively long keyword returns POST 400.
- The standard frontend search journey records zero hits without omissions.

### Phase E: AI Provider Resilience and Transaction Separation

#### E-1. Separate Transaction Scope

Finding: #20
Files: `AiConsultationService`, `ProductRepository`

Current state:

- The entire `AiConsultationService.consult()` method is annotated with `@Transactional(readOnly = true)`.
- After product context is retrieved, the transaction remains open during the live AI provider call.

Optimal remediation:

- Create `AiConsultationContextService` or equivalent, and apply `@Transactional(readOnly = true)` only to DB context retrieval.
- Remove `@Transactional` from `AiConsultationService.consult()` and execute the AI call outside a transaction.
- Represent context as an immutable record and do not pass entities across the provider boundary.

Validation:

- Unit / integration tests confirm that `consult()` does not invoke the provider while a transaction is active.
- A slow or failed provider does not retain a DB connection.

#### E-2. Retry / Circuit Breaker / Timeout

Findings: #64, #76, #77
Files: `SpringAiProviderClient`, `SpringAiConfig`, `AiProperties`, `application.yml`, `pom.xml`

Current state:

- `SpringAiProviderClient.generate()` invokes the provider directly and has no retry / circuit breaker.
- The OpenAI client has no explicit timeout.
- Branch coverage is insufficient.

Optimal remediation:

- Add Resilience4j Spring Boot 3.
  - `resilience4j-spring-boot3`
  - `resilience4j-retry`
  - `resilience4j-circuitbreaker`
- Add `@Retry(name = "aiProvider")` and `@CircuitBreaker(name = "aiProvider")` at the live-call boundary of `SpringAiProviderClient.generate()`.
- Use a low retry count.
  - max attempts: 2 or 3
  - wait duration: exponential backoff starting at 250ms
  - retry targets: transient network / timeout / 5xx-equivalent failures only
- Add `app.ai.response-timeout` and apply it to Spring AI / the underlying HTTP client.
- If applying the timeout through the Spring AI builder is difficult, extract the provider adapter to an OpenAI-compatible endpoint through `RestClient` / `WebClient`. Retain the preference for Spring AI and minimize the diff.
- Wrap provider failures in `AiProviderException` and continue returning the fallback response.

Validation:

- API key not configured -> `Optional.empty()`.
- `ChatClient` not registered -> `Optional.empty()`.
- Blank answer -> `Optional.empty()`.
- Provider success -> answer.
- Provider RuntimeException -> `AiProviderException`.
- Retry-target exceptions are retried.
- An open circuit results in a fallback / error response.
- The timeout configuration is bound through properties.

### Phase F: Errors / Logging / Observability / Security Headers

#### F-1. ProblemDetail Migration

Findings: #11, #24
Files: `GlobalExceptionHandler`, `ApiErrorWriter`, frontend error normalization tests

Current state:

- `GlobalExceptionHandler` returns a custom `ApiErrorResponse`.
- Security handlers write the same custom payload through `ApiErrorWriter`.

Optimal remediation:

- Migrate to Spring `ProblemDetail`.
- Stable extension properties:
  - `code`
  - `path`
  - `errors`
  - `correlationId`
- Use `application/problem+json` as the default response content type.
- Ensure the frontend can display any of `message`, `detail`, or `title`.
- As part of the migration, remove `ApiErrorResponse` or retain it only as a deprecated internal adapter.

Validation:

- Validation errors include `code=VALIDATION_ERROR` and `errors`.
- Authentication failures include `code=AUTHENTICATION_REQUIRED` / `AUTHENTICATION_FAILED`.
- Unexpected errors do not expose stack traces / SQL / tokens in the response.

#### F-2. Throwable Logging and AI Fallback Logging

Findings: #22, #23
Files: `GlobalExceptionHandler`, `AiConsultationService`

Current state:

- The catch-all 500 log records only the exception class name and omits the stack trace.
- The AI provider fallback warning log drops exception details.

Optimal remediation:

- `LOGGER.error("Unexpected API error at {}", request.getRequestURI(), exception);`
- `LOGGER.warn("ai_consultation providerStatus={}", response.providerStatus(), exception);`
- Do not include prompts, API keys, Authorization values, passwords, or raw keywords in logs.

Validation:

- Log capture confirms that the Throwable is passed to the logger.
- Exception messages do not appear in responses.

#### F-3. X-Correlation-Id / MDC

Finding: #21
Files: `RequestLoggingFilter`, `SecurityConfig`, logback

Current state:

- Request logging includes only path / status / duration.
- `X-Correlation-Id` is not read, generated, or returned in the response header.
- MDC cleanup is missing.

Optimal remediation:

- Implement the following in `RequestLoggingFilter`.
  - Use request header `X-Correlation-Id` when valid
  - Generate a UUID when the header is absent
  - `MDC.put("correlationId", id)`
  - Return `X-Correlation-Id` in the response header
  - Call `MDC.remove("correlationId")` in finally
- Add `X-Correlation-Id` to the CORS exposed headers.

Validation:

- Header provided -> the same ID is returned in the response.
- Header absent -> a UUID is returned in the response.
- MDC state does not leak across consecutive requests.

#### F-4. Structured JSON Logging

Findings: #25, #44
Files: `pom.xml`, `logback-spring.xml`, `application-dev.yml`, `application-prod.yml`

Current state:

- `logstash-logback-encoder` is not present.
- `logback-spring.xml` is not present.

Optimal remediation:

- Add `net.logstash.logback:logstash-logback-encoder`.
- Add `logback-spring.xml`.
  - dev: readable pattern log
  - prod/docker: JSON log
  - fields: application name, profile, correlationId, trace/span if present, method/path/status/duration
- Do not include passwords / tokens / raw keywords in fields.

Validation:

- The Docker profile emits JSON logs.
- Logs include correlationId.

#### F-5. Security Headers

Findings: #32, #38
File: `SecurityConfig`

Current state:

- SecurityFilterChain has no explicit `.headers(...)` configuration.

Optimal remediation:

- Explicitly configure Spring Security headers, assuming the API and frontend use different origins.
  - `frameOptions().deny()`
  - `contentTypeOptions`
  - `referrerPolicy(STRICT_ORIGIN_WHEN_CROSS_ORIGIN)`
  - `permissionsPolicy("geolocation=(), microphone=(), camera=()")`
  - CSP: Minimize for a JSON API. Coordinate with the frontend CSP if necessary.
  - HSTS: Enable only in profiles where TLS termination is established.

Validation:

- Responses from `/api/products` and `/api/admin/zero-hits` include the expected headers.
- CORS and the Authorization header continue to work.

### Phase G: Configuration / Secrets / Profiles / Runtime

Findings: #19, #26, #31, #33, #34, #35
Files: `application.yml`, `application-dev.yml`, `application-docker.yml`, `application-prod.yml`, `.env.example`, `docker-compose.yml`

Current state:

- The default `application.yml` contains a localhost fallback for `SPRING_DATASOURCE_URL`.
- `application-docker.yml` contains a `skishop` password fallback.
- Dev / prod profiles are not separated.
- Virtual threads are not enabled.
- TLS / reverse-proxy termination is neither configured nor documented.

Optimal remediation:

- Keep only shared configuration in `application.yml`, and require environment variables for secrets / datasource settings.
  - `url: ${SPRING_DATASOURCE_URL}`
  - `username: ${SPRING_DATASOURCE_USERNAME}`
  - `password: ${SPRING_DATASOURCE_PASSWORD}`
- Move the localhost fallback to `application-dev.yml`.
- Pass environment variables from Compose to `application-docker.yml`. Do not place a literal password fallback in the profile.
- Add `application-prod.yml`.
  - root log level WARN
  - SQL display disabled
  - stacktrace disabled
  - env required
  - `server.forward-headers-strategy=framework`
  - Align HSTS with the TLS termination policy.
- Put only non-secret sample names in `.env.example`. Do not include a real password, or clearly mark any value as local-demo-only.
- Enable Java 21 / Spring Boot virtual threads.
  - `spring.threads.virtual.enabled: true`
  - Verify request logging / security filters / MDC behavior.

Validation:

- The prod profile fails fast when DB environment variables are missing.
- Docker Compose starts with `.env` or Compose environment variables.
- `application-docker.yml` contains no literal password fallback.
- Backend tests / smoke tests pass with virtual threads enabled.

### Phase H: Data Access / API Performance / Null Safety

#### H-1. Correct Pagination and Duplicate Counts

Findings: #68, #69, #70
Files: `ProductRequestOptions`, `ProductQueryService`, `ProductSearchService`, DTO, frontend

Current state:

- The page is always fixed at 0, with only `limit` available.
- `findAll(spec, pageable)` can issue a count query, but the code additionally calls `count(spec)`.
- Search also executes duplicate count queries.

Optimal remediation:

- Extend the API with `page` / `size`. Permit the existing `limit` as an alias for `size` only during the migration period.
- Use `Page<Product> page = repository.findAll(spec, pageable)` and use `page.getTotalElements()` in the response.
- Include `page`, `size`, `totalPages`, and `totalCount` in `ProductListResponse` / `ProductSearchResponse`.
- If the frontend does not yet have pagination UI, default the API to page=0 initially to preserve the existing UX.

Validation:

- `page=1&size=20` returns the second page.
- Repository mocks / SQL logs confirm that the count query is not called twice.
- The initial display in the existing frontend remains functional.

#### H-2. DTO Projection

Finding: #71
Files: `ProductRepository`, `ProductDto`, `ProductMapper`, query service

Current state:

- Public list/search operations materialize managed `Product` entities and map them to DTOs in the service.

Optimal remediation:

- Use DTO projections / interface projections for read-only public APIs.
- Define `ProductReadProjection` and retrieve only required columns in repository queries.
- Update `ProductMapper` to support projection -> DTO mapping.
- Keep this separate from admin / domain mutation paths that require entities.

Validation:

- List/search responses match the existing DTOs.
- SQL selects only required columns.

#### H-3. Null Safety

Findings: #16, #17
Files: `ProductDto`, `Product`, `ProductRepository`

Current state:

- `imageUrl` is nullable, but DTO / getter / constructor parameters do not declare the nullable contract.
- A repository query is designed to accept null for `category`, but does not have `@Nullable`.

Optimal remediation:

- Add `org.springframework.lang.Nullable` to the following.
  - `Product.imageUrl`
  - `Product.getImageUrl()`
  - `ProductDto.imageUrl`
  - repository `@Param("category")`
- A non-null fallback image URL is another option, but because the DB schema permits null, explicitly declaring nullability is the smallest correct change.

Validation:

- A product with a null image URL is handled safely in the response.
- Static-analysis / IDE warnings for the repository method are eliminated.

#### H-4. Entity Columns / Audit Timestamps

Findings: #28, #30
Files: `Product`, `ZeroHitSearch`

Current state:

- Some `@Column` annotations omit `name`.
- `Product` manually updates audit timestamps with `@PrePersist` / `@PreUpdate`.

Optimal remediation:

- Add an explicit `@Column(name = "...")` to every persisted field.
- Add `@CreationTimestamp` to `Product.createdAt` and `@UpdateTimestamp` to `updatedAt`.
- Times in `ZeroHitSearch` are business-event times and may remain controlled by domain methods rather than automatic auditing. However, explicitly name the id / keyword / priority columns.

Validation:

- Hibernate `ddl-auto=validate` passes.
- Timestamps are set when Product is persisted / updated.

#### H-5. Primary Key Type

Finding: #27
Files: `Product`, `ZeroHitSearch`, migrations, DTO

Current state:

- Entity primary keys use `UUID`.
- The review standard requires String UUIDs, but `backend-design.md` and the DB migrations assume PostgreSQL UUIDs.

Recommended response:

- Do not convert to String immediately.
- Explicitly document the `UUID` policy in `backend-design.md` as a project standard and record it as an exception to the review standard.
- Only if String UUIDs are determined to be mandatory, change the DB type / DTO / repository ID type together in a separate migration.

Validation:

- Document the UUID policy and track it as a review exception.

#### H-6. Package Convention / DTO Split

Finding: #2
Files: entire backend package, design documents

Current state:

- Entities are in `com.skishop.entity`, and DTOs are in a flat `com.skishop.dto` package.
- The architecture review expects `model` and `dto.request` / `dto.response`.

Optimal remediation:

- Reorganize packages after correctness fixes are complete.
- Move JPA entities to `com.skishop.model`.
- Request DTOs:
  - `LoginRequest`
  - `AiConsultRequest`
  - zero-hit record request
- Response DTOs:
  - `ProductDto`
  - `ProductListResponse`
  - `ProductSearchResponse`
  - `ZeroHitListResponse`
  - auth / AI response
- After migration, update controller / service / test imports in one operation.

Validation:

- Run `./mvnw test` after package migration.
- API tests confirm that frontend DTO contracts are unaffected.

#### H-7. ZeroHitRecordingService Interface

Finding: #14
Files: `ZeroHitRecordingService`, `ProductSearchService`

Current state:

- `ProductSearchService` depends on the concrete `ZeroHitRecordingService`.

Optimal remediation:

- Add a `ZeroHitRecordingUseCase` or `ZeroHitRecorder` interface.
- `ZeroHitRecordingService implements ZeroHitRecordingUseCase`.
- Consumers depend on the interface.
- After separating GET side effects, the new POST command controller uses this interface.

Validation:

- DI resolves through the interface.
- `ProductSearchService` no longer depends on the zero-hit recorder, or depends on it only optionally during the migration period.

#### H-8. AuthController Principal Binding

Finding: #10
File: `AuthController`

Current state:

- `/api/auth/me` receives `Authentication` and manually casts the principal.

Optimal remediation:

- Change it to `me(@AuthenticationPrincipal AdminUserDto user)`.
- Null should be unreachable through the security chain, but defensively permit a 401 response.

Validation:

- A valid token returns the me response.
- An invalid token returns 401.
- The manual cast is removed.

#### H-9. H2 Dependency Scope

Finding: #43
File: `pom.xml`

Current state:

- H2 has runtime scope.
- The application runtime uses PostgreSQL, while H2 is used by test resources.

Optimal remediation:

- Change the H2 scope to `test`.
- If PostgreSQL Testcontainers is added, use H2 for lightweight unit / slice tests and PostgreSQL for concurrency / migration / native-upsert tests.

Validation:

- The runtime dependency tree does not include H2.
- Tests continue to pass.

### Phase I: Domain Value Objects

Finding: #5
Files: `Product`, `ZeroHitSearch`, domain package

Current state:

- price / estimatedOpportunityLoss use raw `BigDecimal` values.
- normalized keyword uses a raw `String`.

Optimal remediation:

- Introduce a `Money` value object.
  - non-null
  - scale 2
  - non-negative
  - currency fixed to JPY for the MVP
- Introduce a `NormalizedKeyword` value object.
  - normalized string is non-blank
  - max length
  - lowercase / collapsed whitespace remains consistent with `KeywordNormalizer`
- Use `@Embeddable` or `AttributeConverter` with JPA.
- Keep the existing DB columns to avoid a large schema change, while improving type safety in the Java model.

Validation:

- Creating invalid money / keyword values fails.
- The converter works for JPA persistence / reads.
- API responses continue to return number / string values as before.

### Phase J: Test / Dependency / Release Hygiene

#### J-1. Eliminate Direct Instantiation of DI-Managed Services

Findings: #12, #13
Files: `AiConsultationServiceTests`, `AdminAuthServiceTests`

Current state:

- Tests directly call `new AiConsultationService(...)` and `new AdminAuthService(...)`.
- This is treated as violating the AGENTS prohibition.

Optimal remediation:

- Test Spring-managed services by injecting them through `@SpringBootTest` or a focused Spring context.
- To unit-test pure logic, extract non-Spring collaborators from DI-managed services.
  - `AdminTokenManager`
  - `AiConsultationOrchestrator`, etc.
- Remove tests that instantiate services with `new`.

Validation:

- Service tests use Spring injection.
- Only non-DI classes are directly instantiated in pure-class tests.

#### J-2. Test Naming / AAA

Findings: #45, #46
Files: `ZeroHitDomainTests`, `AdminAuthServiceTests`

Current state:

- Test method names do not follow the `should_ExpectedResult_when_Condition` format.
- Some tests in `AdminAuthServiceTests` combine multiple Acts and multiple behaviors.

Optimal remediation:

- Standardize method names.
  - `should_returnNormalizedKeyword_when_keywordContainsCaseAndWhitespace`
  - `should_calculateOpportunityLoss_when_hitCountAndAveragePriceProvided`
  - `should_choosePriority_when_hitCountCrossesThresholds`
- Separate login success / token uniqueness / token validation / missing credential / wrong credential / unconfigured credential.
- `@DisplayName` is Medium severity, but may also be added for readability.

Validation:

- Behaviors are easy to understand in test reports.
- Single-Act / single-assertion focus is maintained.

#### J-3. Stable Version / Publication Metadata

Finding: #42
File: `backend/pom.xml`

Current state:

- The version is `0.0.1-SNAPSHOT`.
- License / SCM metadata is also empty, but that falls within escalation / publication readiness.

Optimal remediation:

- Change the backend artifact version to `0.1.0` before OSS publication.
- After the root OSS license is finalized, populate license / SCM metadata in the POM.
- If SNAPSHOT versions are used outside release branches, document the release process.

Validation:

- `mvn help:evaluate -Dexpression=project.version` returns `0.1.0`.

## 4. Recommended Implementation Order

1. Reflect the Phase A design decisions in the documentation.
2. Implement Phase B validation / authentication hardening.
3. Implement the Phase C PostgreSQL atomic upsert and concurrency test.
4. Implement the Phase G secret / profile separation and revalidate Docker Compose.
5. Implement the Phase E AI resilience / timeout / transaction separation.
6. Implement the Phase F ProblemDetail / logging / correlation / headers work.
7. Implement the Phase D GET side-effect separation across backend / frontend / design documents at the same time.
8. Implement the Phase H pagination / projection / null safety / entity annotations.
9. Implement the Phase I value objects.
10. Implement the Phase J test / dependency / release hygiene and verify coverage.

## 5. Completion Checklist

Completion criteria for all Critical / High findings:

- Every Critical / High finding in `check-report-1.md` is fixed, approved as an exception through a design decision, or explicitly tracked as a separate issue.
- `./mvnw test` succeeds.
- `./mvnw verify` generates a JaCoCo report, and line / branch coverage is checked against the target of at least 80%.
- The zero-hit concurrency test succeeds against PostgreSQL Testcontainers or the Docker Compose PostgreSQL instance.
- Backend / frontend / db start through Docker Compose, and the primary journeys work.
- API validation errors, authentication errors, not-found errors, and server errors are returned safely in ProblemDetail format.
- Logs do not contain passwords, tokens, API keys, or raw search keywords.
- `application-docker.yml` and `application.yml` contain no secret fallbacks.
- Admin AI consultation continues with a fallback / controlled error when the AI key is missing, the AI provider times out, or the provider returns an error.
- Frontend search, zero-hit recording, admin dashboard, AI consultation, and login / logout remain visually and functionally intact on the primary screens.

## 6. Explicit Exception Candidates to Retain

The following items may be resolved by documenting the project standard rather than modifying the implementation.

| Finding | Exception candidate | Recommendation |
| --- | --- | --- |
| #27 String UUID | Retain PostgreSQL UUID | Because the design documents assume UUIDs, retaining UUID is recommended. |
| #2 package convention | Retain `entity` / flat DTO | Considering OSS quality and future extensibility, eventual migration to `model` / request / response is recommended. |
| #11 / #24 ApiErrorResponse | Retain custom error contract | Migration to ProblemDetail is recommended to align with the review standard. |
| #19 virtual threads | profile-gated only | Enabling virtual threads is recommended for the Java 21 backend. However, validation of MDC / request logging is mandatory. |
| #6 / #37 GET side effect | Retain GET recording | This is natural from the requirements perspective, but POST separation is recommended for HTTP semantics and security. |
