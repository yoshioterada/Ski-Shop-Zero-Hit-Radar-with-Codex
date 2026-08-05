# Source Code Review Integrated Report

## Verdict
- Target: full
- Verdict: Rejected
- Review Date: 2026-08-05T13:35:14.563Z
- Project: /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend
- Agents: tech-lead, architecture, ddd-domain, api-endpoint, java-standards, async-concurrency, error-logging, data-access, config-di, security, dependency, test-quality, performance, resilience

## Findings Summary
| Agent | Thread ID | Status | Verdict | Critical | High | Medium | Low | Score |
|---|---|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019fd21c-5e0d-7bd2-bef2-a2f3411f512b | completed | fail | 2 | 0 | 3 | 0 | 13 |
| architecture | 019fd21c-5e99-75b3-929d-1e7c42ff5001 | completed | fail | 0 | 3 | 3 | 0 | 17 |
| ddd-domain | 019fd21c-5dc9-7fd1-afef-5c434e9f3640 | completed | fail | 0 | 3 | 1 | 0 | 16 |
| api-endpoint | 019fd21c-5dc9-70f1-adde-ba5eccbe9b17 | completed | fail | 0 | 2 | 1 | 0 | 19 |
| java-standards | 019fd21c-5e66-7ad2-8264-4dc01047ded3 | completed | fail | 0 | 3 | 0 | 0 | 20 |
| async-concurrency | 019fd21c-5e57-7971-80d0-f4b1aafb5935 | completed | fail | 2 | 3 | 0 | 0 | 15 |
| error-logging | 019fd21c-7083-7822-a595-ad4f606429eb | completed | fail | 0 | 6 | 0 | 0 | 52 |
| data-access | 019fd21e-efc8-72f2-bed9-a91d240e19b9 | completed | fail | 2 | 5 | 1 | 0 | 56 |
| config-di | 019fd21f-0b69-7dc1-986c-f418279e1cf2 | completed | fail | 2 | 3 | 2 | 0 | 12 |
| security | 019fd21f-0f7d-7440-a098-cd827279730c | completed | fail | 2 | 3 | 2 | 0 | 39 |
| dependency | 019fd21f-434b-73d3-b2c0-fb32887f9ac8 | completed | fail | 0 | 2 | 2 | 1 | 20 |
| test-quality | 019fd21f-8324-7880-9f60-9dea0d87cbff | completed | fail | 0 | 4 | 3 | 0 | 56 |
| performance | 019fd21f-e360-7913-ad87-854ba8e01eb0 | completed | fail | 0 | 2 | 3 | 1 | 60 |
| resilience | 019fd21f-e620-78f3-8ef6-7cd1c538be26 | completed | fail | 1 | 3 | 1 | 0 | 52 |

## Verdict Rationale
Critical findings were detected and require remediation before approval.

## Critical/High Findings List
| # | Severity | Source Agent | Category | Target File | Line | Finding | Suggested Fix |
|---:|---|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 63-66 | Production auth filter uses Optional.get() | Assign the validated principal without Optional.get(), for example: AdminUserDto adminUser = adminAuthUseCase.validateToken(token).orElse(null); then handle null before constructing the Authentication. |
| 2 | Critical | tech-lead | Prohibited Pattern / Secrets | src/main/resources/application-docker.yml | 5-5 | Docker profile has a hard-coded database password default | Remove the password default from application-docker.yml and provide a non-secret .env.example or docker-compose sample that developers must explicitly copy/configure. |
| 3 | High | architecture | Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-20 | Repository implementation is placed in the service package | Move this class to `com.skishop.repository` or a clearly defined infrastructure/persistence package, then inject it into `ZeroHitRecordingService` from that boundary. |
| 4 | High | architecture | Module Boundary Enforcement | src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3-17 | API DTO depends on a persistence-layer enum | Expose a DTO/API enum or a stable string field, and map from the entity enum in `ZeroHitMapper`. Keep entity package types inside service/repository/model boundaries. |
| 5 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | JPA entities are not in the required model package | Either move JPA classes/enums to `com.skishop.model` and update imports, or update the authoritative architecture standard if `entity` is the intended package name. |
| 6 | High | ddd-domain | Domain Logic Encapsulation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | PostgreSQL upsert mutates aggregate state and duplicates domain rules outside the aggregate | Keep concurrent safety inside a repository implementation, but load/lock the aggregate and invoke ZeroHitSearch.firstHit()/recordRepeat(), or otherwise centralize all priority/loss calculation behind one domain policy used by every persistence path. Add regression tests proving PostgreSQL and fallback paths cannot diverge. |
| 7 | High | ddd-domain | Value Object Implementation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Money concepts are modeled as raw BigDecimal fields instead of immutable value objects | Introduce a Money or OpportunityLoss value object with non-negative validation, currency/scale rules as appropriate, and @Embedded/@Embeddable or an AttributeConverter for persistence. Keep BigDecimal only at DTO/API boundaries if that is the public contract. |
| 8 | High | ddd-domain | Domain Event Design | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 22-65 | Product search directly records zero-hit demand instead of publishing a domain event | Publish a past-tense event such as ProductSearchReturnedNoResultsEvent from the search use case, then handle it in a zero-hit event handler within an appropriate transaction phase to record demand. Keep the event payload minimal: keyword, category/sort context if needed, result count, and occurredAt. |
| 9 | High | api-endpoint | REST Convention Compliance | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search performs a database write when results are empty | Separate the read and write concerns. Keep `GET /api/products/search` safe, and record zero-hit demand through a state-changing POST endpoint such as `POST /api/products/search-events` or `POST /api/zero-hit-searches`. Update frontend calls, specs, and tests together. If the current behavior is intentionally retained, document the exception and add explicit no-store/cache controls, but it remains non-RESTful. |
| 10 | High | api-endpoint | Input Validation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/dto/LoginRequest.java | 11-11 | Login request fields are not length-limited | Add explicit bounds, for example `@Size(max = 255)` on `username` and `@Size(min = 1, max = 256)` or another documented cap on `password`, then add controller tests proving overlong values return `400` with `VALIDATION_ERROR`. |
| 11 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24-29 | Spring service is injected by concrete class without a corresponding interface | Introduce an interface such as `ZeroHitRecordingUseCase` with `ZeroHitSearch record(String keyword)`, have `ZeroHitRecordingService implements ZeroHitRecordingUseCase`, and inject the interface in `ProductSearchService`. |
| 12 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20-21 | Repository/gateway component has no interface boundary | Create an interface such as `ZeroHitUpsertGateway` exposing `supportsAtomicUpsert()` and `upsert(...)`, implement it in `ZeroHitAtomicUpsertGateway`, and inject the interface into `ZeroHitRecordingService`. |
| 13 | High | java-standards | Null Safety | src/main/java/com/skishop/service/AiPromptContext.java | 8-10 | Nullable collection contract is implicit instead of annotated or normalized | Prefer a compact constructor that normalizes null components to `List.of()` and copies non-null lists, then remove nullable handling from callers. If null must remain valid, annotate the record components and helper parameters with `@Nullable`. |
| 14 | Critical | async-concurrency | Virtual Thread / Locking | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Intrinsic lock wraps JDBC metadata I/O during zero-hit upsert capability detection | Do not perform JDBC I/O inside an intrinsic monitor. Compute database support outside the lock and publish with an `AtomicReference<Boolean>`/volatile compare pattern, or initialize this once at startup in a bean lifecycle method without request-path monitor contention. |
| 15 | Critical | async-concurrency | Virtual Thread / Locking | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | Zero-hit JPA fallback serializes database reads and writes inside synchronized block | Avoid monitor-protected JPA I/O. Prefer database-native atomic upsert/MERGE for supported databases, pessimistic row locking plus unique-constraint retry, or a per-key `ReentrantLock` with clear cleanup if an application lock is unavoidable. |
| 16 | High | async-concurrency | Virtual Thread Adoption | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 1-64 | Spring Boot virtual threads are not enabled | Add `spring.threads.virtual.enabled=true` to the base application configuration after removing or replacing synchronized-over-I/O paths that would pin carrier threads. |
| 17 | High | async-concurrency | Blocking Request Path | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-35 | Admin AI consultation performs synchronous external provider call on servlet request thread | Enable virtual threads for servlet request handling and configure bounded provider timeouts. If the endpoint must remain on platform threads, return an async type or offload to a bounded executor with cancellation/timeout handling and explicit exception mapping. |
| 18 | High | async-concurrency | Thread Safety | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 125-146 | Active admin token limit is enforced with non-atomic compound operations | Guard limit enforcement and insertion with a per-admin lock or redesign storage so updates for one admin happen atomically, for example a user-keyed session collection updated via `compute`. |
| 19 | High | error-logging | Correlation ID / MDC | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | Requests do not get a correlation ID or MDC context | Add a OncePerRequestFilter that validates or generates X-Correlation-Id, calls MDC.put("correlationId", value), sets the response header, invokes the chain, and clears MDC in finally. Include correlationId in the JSON log pattern. |
| 20 | High | error-logging | Error Response Contract | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-132 | Global exception responses are not RFC 7807 ProblemDetail | Return ProblemDetail from @ExceptionHandler methods using ProblemDetail.forStatusAndDetail(...), set title/type/instance, and add validation details as properties. Update ApiErrorWriter to write ProblemDetail with application/problem+json and update frontend/tests together. |
| 21 | High | error-logging | Exception Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Catch-all handler drops the exception stack trace | Use placeholder logging with the Throwable as the final argument, e.g. LOGGER.error("Unexpected API error path={} type={}", request.getRequestURI(), exception.getClass().getName(), exception); |
| 22 | High | error-logging | Exception Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider failures are handled without logging the cause | Log a safe structured warning with the exception as the last argument, without prompt/user text: LOGGER.warn("ai_consultation providerStatus={} failureType={}", response.providerStatus(), exception.getClass().getName(), exception); |
| 23 | High | error-logging | Structured Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Production JSON Logback configuration is missing | Add net.logstash.logback:logstash-logback-encoder and src/main/resources/logback-spring.xml with JSON appenders including timestamp, level, logger, message, application name, correlationId, and trace/span IDs when available. |
| 24 | High | error-logging | Observability Integration | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 44-48 | Actuator metrics are not exposed and no business metrics are registered | Expose metrics through a protected/internal path as appropriate, and add Micrometer counters/timers for zero_hit_recorded, ai_consultation providerStatus, auth failures, request latency, and provider failures. |
| 25 | Critical | data-access | Configuration | src/main/resources/application.yml | 14-14 | Shipping config contains hardcoded JDBC URL defaults | Remove JDBC URL defaults from the base profile, use `url: ${SPRING_DATASOURCE_URL}` for deployable configs, and keep local/demo defaults only in a clearly named local profile or compose file. |
| 26 | Critical | data-access | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | Native upsert path uses java.sql.Timestamp | Bind a java.time value directly, for example `OffsetDateTime.ofInstant(searchedAt, ZoneOffset.UTC)`, and align the migration column type if TIMESTAMPTZ semantics are intended. |
| 27 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-53 | Product entity omits explicit snake_case column names | Add explicit names to every column, e.g. `@Column(name = "id", nullable = false, updatable = false)`, `@Column(name = "name", nullable = false, length = 255)`, and equivalent names for all remaining fields. |
| 28 | High | data-access | Entity Design | src/main/java/com/skishop/entity/ZeroHitSearch.java | 23-38 | ZeroHitSearch entity omits explicit snake_case column names | Declare `name` on all columns, e.g. `@Column(name = "id", ...)`, `@Column(name = "keyword", ...)`, and `@Column(name = "priority", ...)`. |
| 29 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-90 | Entity lifecycle generates UUID primary keys instead of service-layer String UUIDs | Align the entity and migrations with the project convention: `String id` with `@Column(name = "id", length = 36)`, generate IDs before construction/save in the service layer, and remove entity-side UUID defaults. |
| 30 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 50-101 | Audit timestamps use callbacks instead of Hibernate creation/update annotations | Use `@CreationTimestamp` on `createdAt` and `@UpdateTimestamp` on `updatedAt`, and remove manual audit timestamp mutation from lifecycle callbacks. |
| 31 | High | data-access | Transaction Management | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 59-73 | Public zero-hit write method lacks a service transaction boundary | Annotate the write use case with `@Transactional`, or move the full upsert/read flow behind one transactional gateway method with a clearly enforced propagation rule. |
| 32 | Critical | config-di | Application Properties / Secrets | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a literal datasource password fallback | Remove the literal fallback and require an external value, for example `password: ${SPRING_DATASOURCE_PASSWORD}`. Put non-secret setup guidance in `.env.example` or Docker documentation, not in runtime config defaults. |
| 33 | Critical | config-di | DI Registration / Singleton State | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 29-42 | Authentication singletons keep mutable in-memory state | Move token/session and login-attempt state to a dedicated persistent or distributed store with atomic operations, or at minimum isolate it behind a state-store component with synchronized/atomic issue-and-limit semantics, bounded cleanup, and concurrency tests. |
| 34 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Security headers are not explicitly configured | Add an explicit headers block, for example `headers -> headers.contentTypeOptions(...).frameOptions(frame -> frame.deny()).contentSecurityPolicy(csp -> ...).httpStrictTransportSecurity(hsts -> ...)`, with HSTS enabled for production HTTPS. |
| 35 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Filter-chain DSL order does not follow the mandated order | Reorder the DSL to the required sequence: `cors(...)`, `csrf(...)`, `sessionManagement(...)`, `authorizeHttpRequests(...)`, authentication provider/JWT filter registration, then `headers(...)`. |
| 36 | High | config-di | Profile-Based Configuration | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 1-64 | Development and production profile files are missing | Add explicit `application-dev.yml` and `application-prod.yml`. Keep common safe defaults in `application.yml`; put dev-only relaxed logging/CORS in dev and production root logging, CORS origins, secret requirements, and HTTPS/reverse-proxy assumptions in prod. |
| 37 | Critical | security | A02 Cryptographic Failures / Secret Management | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a hardcoded database password fallback | Remove the literal fallback and require `SPRING_DATASOURCE_PASSWORD` at startup, or keep only non-secret sample values in an example file. Add startup validation that rejects blank/default production credentials. |
| 38 | Critical | security | D Denial of Service / T Tampering / Business Logic Abuse | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public GET search endpoint performs unauthenticated database writes with no rate limit | Add rate limiting to public search recording, cap total zero-hit rows per source/time window, add cleanup/retention, and consider moving recording to a POST endpoint or server-side telemetry pipeline. At minimum, throttle by trusted client identity and normalized keyword and reject high-cardinality abuse. |
| 39 | High | security | S Spoofing / Rate Limiting | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting can be bypassed by spoofing X-Forwarded-For | Only honor forwarding headers when the immediate remote address is a trusted proxy, or use container/proxy-managed `ForwardedHeaderFilter` with trusted proxy configuration. Add a username-only or global limiter so IP rotation cannot reset the failure budget. |
| 40 | High | security | Security Headers / A07 XSS Defense in Depth | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-80 | CSP, Referrer-Policy, Permissions-Policy, and server header suppression are not configured | Add explicit security headers, for example `.headers(headers -> headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'; style-src 'self'"))...)`, add referrer and permissions policies, and set `server.server-header=` in configuration. |
| 41 | High | security | D Denial of Service | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 33-37 | JSON request bodies are not globally size-limited | Add a servlet filter that rejects requests over a small maximum `Content-Length` for JSON APIs and fails chunked/unknown-length bodies beyond the cap, or enforce equivalent limits at the reverse proxy/gateway and document them as required production controls. |
| 42 | High | dependency | Test dependency scope | pom.xml | 80-84 | H2 is declared as a runtime dependency instead of test-only | Change the H2 dependency scope to test unless a documented production/local runtime profile genuinely requires it. |
| 43 | High | dependency | Required dependencies | pom.xml | 45-110 | Required structured logging dependency is missing | Add net.logstash.logback:logstash-logback-encoder with an approved stable version, or document a project-level decision changing the required logging standard. |
| 44 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 18-18 | All test methods violate required should_ExpectedResult_when_Condition pattern | Rename tests to specification-style names, e.g. `should_returnNormalizedKeyword_when_keywordHasMixedCaseAndWhitespace`, `should_returnTokenAndAdminUser_when_credentialsAreValid`, and `should_returnProductsAndAiContext_when_repositoryQueriesAreCalled`. |
| 45 | High | test-quality | AAA Pattern | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 17-24 | Several tests combine multiple acts and behaviors without clear AAA separation | Split into focused tests such as `should_useDefaultLimitAndSort_when_optionsAreMissing` and parameterized sort tests like `should_returnAllowedSort_when_sortTokenIsSupported`, each with explicit Arrange / Act / Assert blocks. |
| 46 | High | test-quality | Coverage Criteria | src/main/java/com/skishop/controller/AuthController.java | 57-69 | Controller branch coverage is below the required 80% target | Add MockMvc tests that cover `X-Forwarded-For`, `X-Real-IP`, remote-address fallback, and logout credential-null behavior where reachable, or refactor source IP extraction into a public/testable collaborator with focused unit tests. |
| 47 | High | test-quality | Coverage Criteria | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 107-109 | Public 404 handler is uncovered | Add a MockMvc integration test such as `should_returnNotFoundPayload_when_pathDoesNotExist` that requests an unmapped route and asserts status 404 plus `code == NOT_FOUND`. |
| 48 | High | performance | Pagination | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductRequestOptions.java | 29-34 | Collection APIs expose only a limit and always return the first page | Add `page` and `size` request parameters with defaults and max size, return pagination metadata (`page`, `size`, `totalElements`, `totalPages`), and map from `Page<T>` to DTOs, e.g. `PageRequest.of(page, cappedSize, sort)` plus a paged response record. |
| 49 | High | performance | Duplicate query execution | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitQueryService.java | 64-67 | Zero-hit summary scans the same filtered rows three times | Replace the three repository calls with one aggregate projection query, e.g. `select new com.skishop.dto.ZeroHitSummaryDto(count(z), coalesce(sum(z.hitCount),0), coalesce(sum(z.estimatedOpportunityLoss),0)) from ZeroHitSearch z where z.lastSearchedAt >= :since`. |
| 50 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-38 | External AI provider call has no Resilience4j retry or circuit breaker | Add resilience4j-spring-boot3 (or Spring Retry), configure app.ai/provider retry with maxAttempts 3, exponential backoff, and circuit breaker thresholds, then annotate/wrap generate(), for example @Retry(name="aiProvider", fallbackMethod="fallback") and @CircuitBreaker(name="aiProvider", fallbackMethod="fallback"). |
| 51 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | Spring AI OpenAI client is created without an explicit timeout contract | Expose timeout settings under app.ai, configure the underlying Spring AI/OpenAI HTTP client with connect/read/response timeouts, and optionally add a Resilience4j TimeLimiter around the provider operation. |
| 52 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | No custom health indicator for the live AI provider dependency | Add an AI provider HealthIndicator or Availability state contributor. If live AI is optional, expose it as a named component/detail without gating core readiness; if it is critical for admin workflows, include it in readiness with a cheap bounded check. |
| 53 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-42 | Graceful shutdown is not configured | Configure server.shutdown=graceful and spring.lifecycle.timeout-per-shutdown-phase, for example 20s-30s, and align container termination grace periods with that value. |


## All Findings
| # | Severity | Source Agent | Category | Target File | Line | Finding |
|---:|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 63-66 | Production auth filter uses Optional.get() |
| 2 | Critical | tech-lead | Prohibited Pattern / Secrets | src/main/resources/application-docker.yml | 5-5 | Docker profile has a hard-coded database password default |
| 3 | Medium | tech-lead | Code Consistency | src/main/java/com/skishop/entity/ZeroHitSearch.java | 167-175 | Zero-hit priority thresholds are duplicated in three layers |
| 4 | Medium | tech-lead | Layering / Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20-21 | Repository/infrastructure gateway is placed in the service package |
| 5 | Medium | tech-lead | AGENTS Compliance | pom.xml | 118-130 | JaCoCo coverage target is not enforced |
| 6 | High | architecture | Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-20 | Repository implementation is placed in the service package |
| 7 | High | architecture | Module Boundary Enforcement | src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3-17 | API DTO depends on a persistence-layer enum |
| 8 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | JPA entities are not in the required model package |
| 9 | Medium | architecture | Project Structure | src/main/java/com/skishop/dto/AiConsultRequest.java | 1-16 | Request and response DTOs are not separated |
| 10 | Medium | architecture | Spring Boot Configuration | src/main/resources/application.yml | 14-57 | Development and production profile separation is missing |
| 11 | Medium | architecture | Separation of Concerns | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Client IP extraction is implemented inside the authentication controller |
| 12 | High | ddd-domain | Domain Logic Encapsulation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | PostgreSQL upsert mutates aggregate state and duplicates domain rules outside the aggregate |
| 13 | High | ddd-domain | Value Object Implementation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Money concepts are modeled as raw BigDecimal fields instead of immutable value objects |
| 14 | High | ddd-domain | Domain Event Design | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 22-65 | Product search directly records zero-hit demand instead of publishing a domain event |
| 15 | Medium | ddd-domain | Domain Logic Encapsulation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 167-175 | Zero-hit priority thresholds have multiple authoritative implementations |
| 16 | High | api-endpoint | REST Convention Compliance | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search performs a database write when results are empty |
| 17 | High | api-endpoint | Input Validation | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/dto/LoginRequest.java | 11-11 | Login request fields are not length-limited |
| 18 | Medium | api-endpoint | Parameter Binding | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 45-48 | Current-user endpoint binds raw Authentication instead of an explicit principal |
| 19 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24-29 | Spring service is injected by concrete class without a corresponding interface |
| 20 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20-21 | Repository/gateway component has no interface boundary |
| 21 | High | java-standards | Null Safety | src/main/java/com/skishop/service/AiPromptContext.java | 8-10 | Nullable collection contract is implicit instead of annotated or normalized |
| 22 | Critical | async-concurrency | Virtual Thread / Locking | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Intrinsic lock wraps JDBC metadata I/O during zero-hit upsert capability detection |
| 23 | Critical | async-concurrency | Virtual Thread / Locking | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | Zero-hit JPA fallback serializes database reads and writes inside synchronized block |
| 24 | High | async-concurrency | Virtual Thread Adoption | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 1-64 | Spring Boot virtual threads are not enabled |
| 25 | High | async-concurrency | Blocking Request Path | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-35 | Admin AI consultation performs synchronous external provider call on servlet request thread |
| 26 | High | async-concurrency | Thread Safety | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 125-146 | Active admin token limit is enforced with non-atomic compound operations |
| 27 | High | error-logging | Correlation ID / MDC | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | Requests do not get a correlation ID or MDC context |
| 28 | High | error-logging | Error Response Contract | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-132 | Global exception responses are not RFC 7807 ProblemDetail |
| 29 | High | error-logging | Exception Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Catch-all handler drops the exception stack trace |
| 30 | High | error-logging | Exception Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider failures are handled without logging the cause |
| 31 | High | error-logging | Structured Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Production JSON Logback configuration is missing |
| 32 | High | error-logging | Observability Integration | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 44-48 | Actuator metrics are not exposed and no business metrics are registered |
| 33 | Critical | data-access | Configuration | src/main/resources/application.yml | 14-14 | Shipping config contains hardcoded JDBC URL defaults |
| 34 | Critical | data-access | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | Native upsert path uses java.sql.Timestamp |
| 35 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-53 | Product entity omits explicit snake_case column names |
| 36 | High | data-access | Entity Design | src/main/java/com/skishop/entity/ZeroHitSearch.java | 23-38 | ZeroHitSearch entity omits explicit snake_case column names |
| 37 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-90 | Entity lifecycle generates UUID primary keys instead of service-layer String UUIDs |
| 38 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 50-101 | Audit timestamps use callbacks instead of Hibernate creation/update annotations |
| 39 | High | data-access | Transaction Management | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 59-73 | Public zero-hit write method lacks a service transaction boundary |
| 40 | Medium | data-access | Optimistic Locking | src/main/java/com/skishop/entity/ZeroHitSearch.java | 33-47 | ZeroHitSearch has concurrent update risk but no @Version column |
| 41 | Critical | config-di | Application Properties / Secrets | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a literal datasource password fallback |
| 42 | Critical | config-di | DI Registration / Singleton State | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 29-42 | Authentication singletons keep mutable in-memory state |
| 43 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Security headers are not explicitly configured |
| 44 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Filter-chain DSL order does not follow the mandated order |
| 45 | High | config-di | Profile-Based Configuration | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 1-64 | Development and production profile files are missing |
| 46 | Medium | config-di | Type-Safe Configuration | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/AdminProperties.java | 14-15 | ConfigurationProperties records lack validation |
| 47 | Medium | config-di | Security Logging | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/logback-spring.xml |  | No profile-aware Logback configuration is present |
| 48 | Critical | security | A02 Cryptographic Failures / Secret Management | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a hardcoded database password fallback |
| 49 | Critical | security | D Denial of Service / T Tampering / Business Logic Abuse | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public GET search endpoint performs unauthenticated database writes with no rate limit |
| 50 | High | security | S Spoofing / Rate Limiting | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting can be bypassed by spoofing X-Forwarded-For |
| 51 | High | security | Security Headers / A07 XSS Defense in Depth | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-80 | CSP, Referrer-Policy, Permissions-Policy, and server header suppression are not configured |
| 52 | High | security | D Denial of Service | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 33-37 | JSON request bodies are not globally size-limited |
| 53 | Medium | security | I Information Disclosure / Authentication | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 67-73 | Admin username can be inferred through timing differences |
| 54 | Medium | security | A02 Cryptographic Failures / Password Handling | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 85-91 | Production password encoder accepts `{noop}` admin passwords |
| 55 | High | dependency | Test dependency scope | pom.xml | 80-84 | H2 is declared as a runtime dependency instead of test-only |
| 56 | High | dependency | Required dependencies | pom.xml | 45-110 | Required structured logging dependency is missing |
| 57 | Medium | dependency | Build configuration | pom.xml | 29-33 | Maven encoding properties are not declared |
| 58 | Medium | dependency | Version management | pom.xml | 31-31 | Flyway version overrides Spring Boot's managed dependency set |
| 59 | Low | dependency | OSS metadata / license compliance | pom.xml | 17-19 | POM license metadata is empty |
| 60 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 18-18 | All test methods violate required should_ExpectedResult_when_Condition pattern |
| 61 | Medium | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 17-18 | No tests use @DisplayName for human-readable specifications |
| 62 | High | test-quality | AAA Pattern | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 17-24 | Several tests combine multiple acts and behaviors without clear AAA separation |
| 63 | Medium | test-quality | Parameterized Tests | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 28-31 | Repeated boundary/error matrices are not parameterized |
| 64 | High | test-quality | Coverage Criteria | src/main/java/com/skishop/controller/AuthController.java | 57-69 | Controller branch coverage is below the required 80% target |
| 65 | High | test-quality | Coverage Criteria | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 107-109 | Public 404 handler is uncovered |
| 66 | Medium | test-quality | JaCoCo Configuration | pom.xml | 114-130 | Coverage thresholds are reported but not enforced by Maven |
| 67 | High | performance | Pagination | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductRequestOptions.java | 29-34 | Collection APIs expose only a limit and always return the first page |
| 68 | High | performance | Duplicate query execution | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitQueryService.java | 64-67 | Zero-hit summary scans the same filtered rows three times |
| 69 | Medium | performance | JPA query optimization | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSpecifications.java | 39-44 | Product keyword search is non-sargable and cannot use the existing indexes effectively |
| 70 | Medium | performance | Cache strategy | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AiConsultationService.java | 45-47 | Stable product master context is queried on every AI consultation |
| 71 | Medium | performance | Memory efficiency | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 23-51 | Login attempt limiter keeps failed-attempt keys indefinitely |
| 72 | Low | performance | Allocation efficiency | /Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AiPromptBuilder.java | 84-92 | Prompt list formatting creates an intermediate list and concatenates strings in a reduce |
| 73 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-38 | External AI provider call has no Resilience4j retry or circuit breaker |
| 74 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | Spring AI OpenAI client is created without an explicit timeout contract |
| 75 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | No custom health indicator for the live AI provider dependency |
| 76 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-42 | Graceful shutdown is not configured |
| 77 | Medium | resilience | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-35 | No concurrency isolation for high-latency AI provider calls |


## Escalation Items
| # | Priority | Source Agent | Description | Recommended Decision Maker |
|---:|---|---|---|---|
| 1 | normal | tech-lead | docs/migration/DESIGN.md and PLAN.md referenced by the tech-lead agent definition were not present in the accessible repository tree. This review used AGENTS.md plus spec-design/zero-hit-radar-requirment.md and spec-design/backend-design.md instead. | Project maintainer |
| 2 | normal | architecture | Decide whether the project standard should use `model` or `entity` for JPA classes. The code consistently uses `entity`, while the architecture review checklist requires `model`. | Backend architect / repository maintainer |
| 3 | normal | ddd-domain | The backend design document explicitly describes ProductSearchService calling ZeroHitRecordingService directly, while the DDD review standard requires event-driven inter-aggregate coordination. A human decision is needed on whether to revise the design toward events or accept the MVP coupling as intentional technical debt. | Backend tech lead / domain architect |
| 4 | high | api-endpoint | Decide whether the product search contract should remain `GET /api/products/search` with zero-hit recording, as currently specified, or be split into a safe GET plus a POST recording endpoint. This affects backend spec, frontend client behavior, and integration tests. | Tech lead / product owner |
| 5 | high | async-concurrency | Decide whether non-PostgreSQL zero-hit recording is a production-supported path. If yes, replace the synchronized fallback with a database-safe atomic strategy before enabling virtual threads. If no, remove the fallback from production wiring and keep H2-only test support isolated. | Backend technical lead |
| 6 | high | error-logging | Migrating ApiErrorResponse to ProblemDetail may affect frontend contracts and existing integration tests. Coordinate the API error contract update with the frontend and test owners. | Backend tech lead / frontend owner |
| 7 | normal | error-logging | Decide the operational policy for actuator metrics exposure: internal-only endpoint, authenticated admin endpoint, or Prometheus scrape endpoint behind infrastructure controls. | Platform/operations owner |
| 8 | normal | data-access | The codebase currently uses native PostgreSQL UUID columns while the review agent standard requires String UUID IDs. A maintainer should decide whether the agent standard or the existing schema design is authoritative before changing migrations and API DTO types. | Backend maintainer |
| 9 | high | config-di | Confirm whether Docker deployments are intended to be publishable OSS demos with default database credentials, or whether runtime secrets must be mandatory before startup. | Project maintainer / security owner |
| 10 | normal | config-di | Confirm where production HTTPS is terminated. No `server.ssl.*` configuration or production profile documentation was present in the reviewed backend target. | Deployment owner |
| 11 | highest | security | Decide whether the Docker profile is intended for deployable environments. If yes, the default DB password must be removed before OSS release. | Project maintainer / security owner |
| 12 | high | security | Confirm the production proxy topology. If the app can receive direct traffic, forwarded headers must not be trusted for rate limiting. | Backend owner / deployment owner |
| 13 | high | security | Decide whether zero-hit recording should remain on a public GET endpoint or be moved behind a controlled telemetry/write path. | Product owner / backend owner |
| 14 | normal | dependency | Project owner/legal decision is needed to choose and publish the intended OSS license before filling the POM license metadata. | Project owner or legal reviewer |
| 15 | normal | test-quality | Decide whether to apply the strict `should_ExpectedResult_when_Condition` naming rule retroactively to all 77 existing tests in one cleanup PR, since this is a broad mechanical change but required by the active review standard. | Backend maintainer / QA lead |
| 16 | high | performance | Decide whether the public/admin API contract should move from limit-only slices to page/size pagination before frontend contracts are frozen. | Backend lead and frontend owner |
| 17 | normal | performance | Set expected product catalog size and search latency target, then choose between trigram, full-text, or simpler prefix search based on measured query plans. | Backend lead / product owner |
| 18 | normal | resilience | Decide whether live AI availability should gate readiness. The current product has fallback behavior, so SRE/product owners should choose between non-gating health visibility and readiness failure when AI is unavailable. | Product owner and SRE lead |


## Conflict Resolution Record
| # | Agent A | Agent B | Conflict Description | Tech-Lead Adjudication | Rationale |
|---:|---|---|---|---|---|
|  |  |  |  |  |  |

## Design Document Cross-Reference Results
1. tech-lead: spec-design/backend-design.md - The implementation broadly matches endpoint, DTO, security, Flyway, and layered architecture expectations, but ZeroHitAtomicUpsertGateway is a repository/infrastructure component located in the service package. (src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java)
2. tech-lead: spec-design/backend-design.md - The zero-hit priority rule is specified as domain/application behavior, but the implementation duplicates the thresholds in domain code, entity invariant code, and native SQL. (src/main/java/com/skishop/entity/ZeroHitSearch.java)
3. tech-lead: AGENTS.md / docs/agents/java/AGENTS.md - Coverage reporting exists, but the required 80% line and branch coverage gate is not enforced in Maven. (pom.xml)
4. architecture: Architecture review checklist - Required package convention `model/` and `dto/request` + `dto/response` is not implemented; the code uses `entity/` and flat `dto/`. (src/main/java/com/skishop)
5. api-endpoint: /Users/yoterada/Ski-Shop-Zero-Hit-Radar/spec-design/backend-design.md - The design specifies `GET /api/products/search` as both search and zero-hit recording. That matches the implementation but conflicts with the API endpoint review standard that GET must not cause state changes. (/Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java)

## Incomplete Reviews
No incomplete reviews.

## Codex SDK Execution Summary
| Agent | Thread ID | Duration | Input Tokens | Cached Input Tokens | Output Tokens | Reasoning Tokens |
|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019fd21c-5e0d-7bd2-bef2-a2f3411f512b | 231430 | 710295 | 594944 | 10020 | 3682 |
| architecture | 019fd21c-5e99-75b3-929d-1e7c42ff5001 | 189974 | 507471 | 413696 | 8286 | 3331 |
| ddd-domain | 019fd21c-5dc9-7fd1-afef-5c434e9f3640 | 176715 | 298237 | 226816 | 7809 | 2692 |
| api-endpoint | 019fd21c-5dc9-70f1-adde-ba5eccbe9b17 | 206216 | 363239 | 297984 | 9246 | 3730 |
| java-standards | 019fd21c-5e66-7ad2-8264-4dc01047ded3 | 230910 | 702133 | 633344 | 9603 | 3383 |
| async-concurrency | 019fd21c-5e57-7971-80d0-f4b1aafb5935 | 168511 | 198598 | 150016 | 7529 | 2895 |
| error-logging | 019fd21c-7083-7822-a595-ad4f606429eb | 175527 | 321592 | 246272 | 7686 | 2518 |
| data-access | 019fd21e-efc8-72f2-bed9-a91d240e19b9 | 173665 | 318687 | 266240 | 7923 | 2968 |
| config-di | 019fd21f-0b69-7dc1-986c-f418279e1cf2 | 201406 | 304102 | 247296 | 9714 | 4231 |
| security | 019fd21f-0f7d-7440-a098-cd827279730c | 201195 | 361182 | 278528 | 9474 | 3364 |
| dependency | 019fd21f-434b-73d3-b2c0-fb32887f9ac8 | 174703 | 229650 | 200192 | 8232 | 5069 |
| test-quality | 019fd21f-8324-7880-9f60-9dea0d87cbff | 201005 | 514714 | 446464 | 9050 | 3370 |
| performance | 019fd21f-e360-7913-ad87-854ba8e01eb0 | 181902 | 268168 | 225792 | 8617 | 3651 |
| resilience | 019fd21f-e620-78f3-8ef6-7cd1c538be26 | 124801 | 150013 | 125440 | 5834 | 1972 |


## Individual Agent Detail Reports
### tech-lead

- Status: completed
- Verdict: fail
- Summary: Tech-lead review found 2 Critical prohibited-pattern issues and 3 Medium cross-cutting maintainability/compliance issues. Layering and API shape are mostly aligned with the available spec-design documents, but release-readiness is blocked by the prohibited-pattern findings.

# Source Code Review Report: Tech Lead

## Summary
- **Review Target**: backend full target
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 0 / Medium: 3 / Low: 0

## Prohibited Pattern Check Results
| # | Prohibited Pattern | Detection Count | Target File | Line |
|---|---|---:|---|---:|
| 7 | Optional.get() | 2 | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 64, 66 |
| 3 | Hardcoded password/default secret | 1 | src/main/resources/application-docker.yml | 5 |

## Design Document Alignment
| Design Document | Alignment Status | Deviation Details |
|---|---|---|
| spec-design/backend-design.md | Mostly aligned | Endpoints, DTOs, auth policy, Flyway, AI fallback, and layered controller/service/repository flow are present. Repository/infrastructure gateway placement and duplicated priority rules need cleanup. |
| spec-design/zero-hit-radar-requirment.md | Mostly aligned | Backend supports product search, zero-hit recording, admin radar, authentication, AI fallback, and 100 seeded products. |
| AGENTS.md / docs/agents/java/AGENTS.md | Warning | Prohibited Optional.get(), hard-coded Docker password default, and missing enforced coverage threshold block release-readiness. |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | Critical | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 63 | Production auth filter uses `Optional.get()` despite the prohibited checklist. | Use `orElse(null)` with an explicit null branch, or `orElseThrow()` after the invalid-token branch. |
| 2 | Critical | Prohibited Pattern / Secrets | src/main/resources/application-docker.yml | 5 | Docker profile commits `skishop` as a default DB password. | Remove the default and require `SPRING_DATASOURCE_PASSWORD`, with a documented sample env file. |
| 3 | Medium | Code Consistency | src/main/java/com/skishop/entity/ZeroHitSearch.java | 167 | Zero-hit priority thresholds are duplicated in domain code, entity code, and native SQL. | Centralize the business rule and add regression tests for any unavoidable SQL copy. |
| 4 | Medium | Layering / Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20 | `@Repository` JdbcTemplate gateway lives in the service package. | Move it to repository/infrastructure ownership. |
| 5 | Medium | AGENTS Compliance | pom.xml | 118 | JaCoCo reports coverage but does not enforce the required 80% line and branch thresholds. | Add `jacoco:check` with LINE and BRANCH minimums of 0.80 or document exceptions. |

## Inter-Agent Conflict Arbitration
No inter-agent conflict data was provided.

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Prohibited Pattern Compliance | 2/5 | Optional.get and hard-coded Docker password default found. |
| Design Document Alignment | 4/5 | Main API and layered design are implemented; package placement/rule duplication remain. |
| Code Consistency | 3/5 | Error handling and DTO patterns are consistent; priority rules are split. |
| Naming Convention Compliance | 4/5 | Naming is generally consistent. |
| **Overall Score** | **13/20** | Critical findings block pass. |

## Escalation Items
- `docs/migration/DESIGN.md` and `PLAN.md` were not present in the accessible tree; review used the available `spec-design` documents named by AGENTS.md.

### architecture

- Status: completed
- Verdict: fail
- Summary: Architecture review found no critical controller→repository or reverse dependency violations, but there are package-boundary and configuration-structure deviations that should be corrected before treating the backend as architecture-compliant.

# Source Code Review Report: Architecture Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 3 / Medium: 3 / Low: 0

## Layer Dependency Direction Check
| Package | Dependency Violation | Details |
|---|---:|---|
| controller | No critical violation found | Controllers depend on service/use-case interfaces, not repositories/entities. |
| service | Warning | `ZeroHitAtomicUpsertGateway` is a repository/JDBC component inside `service/`. |
| repository | No reverse dependency found | Repository interfaces extend `JpaRepository` and do not import services/controllers. |

## Project Structure Check
| Package | Structure Compliance | Missing/Misplaced Packages |
|---|---:|---|
| controller/service/repository/config/exception | Mostly compliant | Core packages exist. |
| model | Non-compliant | JPA entities are under `entity/`, not `model/`. |
| dto/request, dto/response | Non-compliant | DTOs are flat under `dto/`. |
| config profiles | Partial | No `application-dev.yml` or `application-prod.yml`. |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---|---|---|---:|---|---|
| 1 | High | Project Structure | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 1 | `@Repository` JDBC gateway lives in `service/`. | Move to `repository/` or a persistence infrastructure package. |
| 2 | High | Module Boundary | `src/main/java/com/skishop/dto/ZeroHitItemDto.java` | 3 | API DTO imports `com.skishop.entity.Priority`. | Use a DTO enum or string and map from entity enum. |
| 3 | High | Project Structure | `src/main/java/com/skishop/entity/Product.java` | 1 | JPA entities are in `entity/`, while checklist requires `model/`. | Move to `model/` or update the standard. |
| 4 | Medium | DTO Structure | `src/main/java/com/skishop/dto/AiConsultRequest.java` | 1 | Request/response DTOs are not separated. | Use `dto.request` and `dto.response`. |
| 5 | Medium | Spring Config | `src/main/resources/application.yml` | 14 | Dev/prod profile split is missing. | Add `application-dev.yml` and `application-prod.yml`. |
| 6 | Medium | Separation of Concerns | `src/main/java/com/skishop/controller/AuthController.java` | 60 | Client IP parsing is in the controller. | Move to filter/resolver/request metadata component. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Layer Dependency Direction | 4/5 | No direct controller→repository or reverse service/repository imports found. |
| Project Structure | 2/5 | Entity/model and DTO package conventions are not met; repository gateway misplaced. |
| Module Boundary Enforcement | 3/5 | Controllers return DTOs, but `Priority` leaks from persistence package into DTO. |
| Spring Boot Configuration | 4/5 | Security config exists; profile separation is incomplete. |
| Separation of Concerns | 4/5 | Mostly clean, with request metadata parsing in `AuthController`. |
| **Total Score** | **17/25** | |

## Escalation Items (Requires Human Judgment)
Decide whether `entity/` is an intentional local convention or architecture drift from the required `model/` package.

### ddd-domain

- Status: completed
- Verdict: fail
- Summary: DDD domain review found no child-entity repository violations, but the zero-hit aggregate rules are partly bypassed by infrastructure SQL, monetary concepts are not modeled as value objects, and inter-aggregate coordination is direct rather than event-driven.

# Source Code Review Report: DDD Domain Review

## Summary
- **Review Target**: full backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 3 / Medium: 1 / Low: 0

## Aggregate Root Boundary Check
| Service | Aggregate Root | Boundary Compliance | Violation Details |
|---------|---------------|--------------------|--------------------|
| ZeroHitRecordingService | ZeroHitSearch | ⚠️ Partial | JPA fallback uses aggregate methods, but PostgreSQL upsert mutates aggregate fields directly in SQL. |
| ProductSearchService | Product / ZeroHitSearch | ⚠️ Partial | Direct service-to-service coordination; no domain event. |
| ProductQueryService | Product | ✅ OK | Read-only query use case. |

## Value Object Check
| Target | Immutability | Record Usage | Validation | @Embeddable |
|--------|-------------|-------------|------------|-------------|
| Product.price | ⚠️ Raw BigDecimal | ❌ No Money record | DB constraint only plus null check | ❌ No |
| ZeroHitSearch.estimatedOpportunityLoss | ⚠️ Raw BigDecimal | ❌ No Money/OpportunityLoss record | Non-negative check in entity | ❌ No |
| ZeroHitDemandSignals | ✅ Immutable | ✅ record | ✅ Constructor validates | N/A |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|----------|----------|-------------|------|---------|-------------|
| 1 | High | Domain Logic Encapsulation | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25 | SQL directly mutates hit_count, priority, and estimated_opportunity_loss, bypassing aggregate methods. | Use locked aggregate mutation or one repository method that delegates all business rules to the domain model/policy. |
| 2 | High | Value Object Implementation | src/main/java/com/skishop/entity/Product.java | 40 | Monetary concepts are raw BigDecimal fields, not immutable value objects. | Add Money/OpportunityLoss value object with validation and persistence mapping. |
| 3 | High | Domain Event Design | src/main/java/com/skishop/service/ProductSearchService.java | 24 | Product search directly calls ZeroHitRecordingService; no domain events are present. | Publish ProductSearchReturnedNoResultsEvent and handle it in a zero-hit listener. |
| 4 | Medium | Domain Logic Encapsulation | src/main/java/com/skishop/entity/ZeroHitSearch.java | 167 | Priority thresholds exist in aggregate, decider, and SQL. | Keep one authoritative priority policy and remove duplicates. |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|----------------|-------------|-------|
| Aggregate Root Boundary | 3/5 | Aggregate methods exist, but SQL write path bypasses them. |
| Value Object Implementation | 2/5 | DTO records are good; monetary domain values are primitive. |
| Domain Event Design | 1/5 | No domain event implementation found. |
| Repository Pattern | 3/5 | Spring Data repositories are one aggregate each, but upsert gateway contains business rules. |
| Domain Logic Encapsulation | 3/5 | ZeroHitSearch has behavior; SQL/service/policy duplication remains. |
| Ubiquitous Language | 4/5 | Names are domain-specific and mostly aligned with Zero Hit Radar terminology. |
| **Total Score** | **16/30** | |

## Escalation Items (Requires Human Judgment)
- Decide whether to revise the MVP design away from direct ProductSearchService -> ZeroHitRecordingService coupling, since current design conflicts with the DDD event-driven review standard.

Verification note: Review was static only. Tests were not run because the active filesystem sandbox is read-only and Maven test execution would write build artifacts.

### api-endpoint

- Status: completed
- Verdict: fail
- Summary: API endpoint review found no legacy `.do` mappings and the implemented endpoints align with the repository REST API spec, but there are high-severity REST/input-validation concerns: a GET search endpoint performs writes, and login credentials are not length-limited at the HTTP boundary.

# Source Code Review Report: API Endpoint Review

## Summary
- **Review Target**: backend full endpoint layer
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 2 / Medium: 1 / Low: 0
- **Note**: The supplied persona describes Thymeleaf MVC, but repository specs define REST JSON APIs. I reviewed the actual REST controller implementation against REST endpoint rules.

## Endpoint List and Compliance
| Endpoint | HTTP Method | Separation | Validation | Authorization | @AuthenticationPrincipal |
|----------|------------|-----------|-----------|--------------|-------------------------|
| `/api/products` | GET | `@RestController`, thin | Query params bounded | Public | N/A |
| `/api/products/search` | GET | `@RestController`, thin | Query params bounded | Public | N/A |
| `/api/auth/login` | POST | `@RestController`, thin | `@Valid`, but missing size caps | Public | N/A |
| `/api/auth/me` | GET | `@RestController`, thin | No request body | Authenticated | Uses `Authentication`, not explicit principal |
| `/api/auth/logout` | POST | `@RestController`, thin | No request body | Authenticated | Uses `Authentication` for token credentials |
| `/api/admin/zero-hits` | GET | `@RestController`, thin | Query params bounded | `ROLE_ADMIN` | Not user-specific |
| `/api/admin/ai-consult` | POST | `@RestController`, thin | `@Valid` request DTO | `ROLE_ADMIN` | Not user-specific |
| `/actuator/health` | GET | Actuator | N/A | Public | N/A |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | High | REST Convention Compliance | `src/main/java/com/skishop/controller/ProductController.java` | 51 | `GET /api/products/search` delegates to a transactional service that records zero-hit demand on empty results. GET is not safe/idempotent in practice. | Split into safe `GET /api/products/search` plus state-changing `POST /api/products/search-events` or similar. |
| 2 | High | Input Validation | `src/main/java/com/skishop/dto/LoginRequest.java` | 11 | Login credential fields have `@NotBlank` but no maximum size. | Add `@Size` limits and tests for overlong username/password. |
| 3 | Medium | Parameter Binding | `src/main/java/com/skishop/controller/AuthController.java` | 45 | `/api/auth/me` binds raw `Authentication` and casts principal. | Use `@AuthenticationPrincipal AdminUserDto user` for current-user response binding. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Spring MVC Controller Pattern | 4/5 | REST controllers are consistent with repository design; no `.do` mappings found. |
| REST Convention Compliance | 3/5 | Main gap is GET search causing zero-hit writes. |
| Input Validation | 4/5 | Query params and AI request are bounded; login DTO lacks size caps. |
| Error Response | 4/5 | Central JSON error handler, safe messages, stack traces disabled; custom response is allowed by backend design. |
| Parameter Binding | 4/5 | Mostly clear; current-user endpoint should use explicit principal binding. |
| **Total Score** | **19/25** | |

## Escalation Items (Requires Human Judgment)
- The current spec intentionally combines product search and zero-hit recording in `GET /api/products/search`. Changing this to REST-safe semantics requires coordinated spec, frontend, backend, and test updates.

### java-standards

- Status: completed
- Verdict: fail
- Summary: Java 21 coding standards review failed: no Critical prohibited production patterns were found, but mandatory DI interface and null-safety standards have High-severity violations.

# Source Code Review Report: Java 21 Coding Standards Review

## Summary
- **Review Target**: full backend Java/Spring Boot source
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 3 / Medium: 0 / Low: 0

## Prohibited Pattern Detection Results
| # | Pattern | Count | Target File | Line # |
|---|---------|-------|-------------|--------|
| 1 | System.out/System.err/printStackTrace | 0 | - | - |
| 2 | Empty catch(Exception) | 0 | - | - |
| 3 | Direct new RestTemplate | 0 | - | - |
| 4 | CompletableFuture.get/join | 0 | - | - |
| 5 | Thread.sleep | 0 | - | - |
| 6 | @Autowired field injection in production | 0 | - | - |
| 7 | Direct new XxxService in production | 0 | - | - |
| 8 | TODO/FIXME/HACK/XXX placeholders | 0 | - | - |
| 9 | Mock/Stub/Fake/Dummy contamination in production | 0 | - | - |
| 10 | UnsupportedOperationException / not implemented exception | 0 | - | - |
| 11 | new Date / Calendar.getInstance | 0 | - | - |
| 12 | return null for collection types | 0 | - | - |
| 13 | Raw production collection types | 0 | - | - |

## Incomplete / Shortcut Implementation Detection Results
| # | Type | Detection | Target File | Line # | Details |
|---|------|-----------|-------------|--------|---------|
| - | - | None found | - | - | Static keyword scan found no TODO/FIXME/placeholders in production Java. |

## Naming Convention Check Results
| File | Violation Location | Current Name | Recommended Name |
|------|-------------------|-------------|-----------------|
| - | - | - | - |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|----------|----------|-------------|--------|-------------------|-------------|
| 1 | High | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24 | `ZeroHitRecordingService` is injected as a concrete Spring service and has no corresponding interface. | Add `ZeroHitRecordingUseCase`, implement it in the service, inject the interface. |
| 2 | High | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20 | `@Repository` gateway has no interface boundary. | Add `ZeroHitUpsertGateway` interface and inject that from `ZeroHitRecordingService`. |
| 3 | High | Null Safety | src/main/java/com/skishop/service/AiPromptContext.java | 8 | Collection components have ambiguous nullability while callers/helpers support null lists. | Normalize null lists to `List.of()` in a compact constructor, or explicitly annotate nullable components. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Naming Conventions | 5/5 | Packages, classes, methods, constants, enums, and boolean names are compliant. |
| Java 21 Feature Adoption | 4/5 | DTOs use records, text blocks and switch expressions are used where clearly appropriate. |
| Prohibited Pattern Compliance | 5/5 | No Critical prohibited production patterns detected. |
| DI Pattern Quality | 3/5 | Constructor injection/final fields are good, but service/repository interface rule is not fully met. |
| Null Safety | 3/5 | Optional usage is mostly safe, but nullable collection contracts are implicit. |
| **Total Score** | **20/25** | Fail due High mandatory standards violations. |

## Escalation Items (Requires Human Judgment)
None.

## Verification Notes
Review was static/read-only. Build and tests were not run because the task explicitly requested source review only and the filesystem sandbox is read-only.

### async-concurrency

- Status: completed
- Verdict: fail
- Summary: Async/concurrency review failed: the codebase does not enable Java 21 virtual threads, and two hot zero-hit recording paths use intrinsic synchronization around JDBC/JPA I/O. I also found a synchronous external AI call on a servlet request path and a non-atomic active-session limit invariant.

# Source Code Review Report: Async Processing & Concurrency Control Review

## Summary
- **Review Target**: full backend source under `/Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend`
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 3 / Medium: 0 / Low: 0
- **Verification**: Static source/configuration review only; tests were not run.

## Virtual Thread Compatibility Matrix
| Class / Method | synchronized over I/O | ThreadLocal risk | ReentrantLock used | Verdict |
|---|---:|---:|---:|---|
| `ZeroHitAtomicUpsertGateway.supportsAtomicUpsert()` | Yes, JDBC metadata lookup under `synchronized` | None found | No | ❌ Critical |
| `ZeroHitRecordingService.recordWithJpaFallback()` | Yes, JPA lookup/save under `synchronized` | None found | No | ❌ Critical |
| Application configuration | N/A | None found | N/A | ❌ `spring.threads.virtual.enabled=true` missing |

## Blocking Call Detection Results
| # | Pattern | File | Line # | Context |
|---|---|---|---:|---|
| 1 | Spring AI synchronous `.call()` | `src/main/java/com/skishop/service/SpringAiProviderClient.java` | 35 | Called from synchronous admin controller path; no virtual threads or explicit timeout visible. |
| 2 | `CompletableFuture.get()` / `.join()` | Main source | N/A | None found. |
| 3 | `Thread.sleep()` | Main source | N/A | None found. |
| 4 | `Future.get()` without timeout | Main source | N/A | None found. |

## @Scheduled / Background Task Quality Check
| Task Name | Exception Handling | Graceful Shutdown | Thread Pool Config | Backoff | Verdict |
|---|---|---|---|---|---|
| N/A | No `@Scheduled` tasks found | No custom production executors found | No `ThreadPoolTaskExecutor` / `ThreadPoolTaskScheduler` found | N/A | ✅ Not applicable |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|---|---|---|---:|---|---|
| 1 | Critical | Virtual Thread / Locking | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 81 | `synchronized (this)` wraps JDBC metadata I/O through `databaseProductName()`, which opens a connection at line 106. This can pin virtual-thread carriers and serialize first-use requests. | Compute DB support outside the monitor and publish with `AtomicReference`/volatile, or initialize once at startup. |
| 2 | Critical | Virtual Thread / Locking | `src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 86 | Non-PostgreSQL fallback performs repository find and save inside an intrinsic lock from the product-search request path. | Replace with atomic DB upsert/MERGE, pessimistic locking plus retry, or a bounded per-key `ReentrantLock` if an app lock is unavoidable. |
| 3 | High | Virtual Thread Adoption | `src/main/resources/application.yml` | 1 | Main, Docker, and test configs omit `spring.threads.virtual.enabled=true`. | Enable virtual threads after resolving synchronized-over-I/O pinning risks. |
| 4 | High | Blocking Request Path | `src/main/java/com/skishop/service/SpringAiProviderClient.java` | 35 | AI provider call is synchronous on the servlet request path; fallback only happens after provider failure. | Enable virtual threads and set timeouts, or use bounded async execution with timeout/cancellation. |
| 5 | High | Thread Safety | `src/main/java/com/skishop/service/AdminAuthService.java` | 125 | Active token limit count/remove/put is not atomic under concurrent logins. | Use per-admin locking or atomically update user-keyed session state with `compute`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Virtual Thread Adoption | 1/5 | Java 21 is used, but virtual threads are not enabled and current locks would be unsafe to enable as-is. |
| Blocking Call Absence | 2/5 | No `CompletableFuture.get()`, `.join()`, `Thread.sleep()`, or indefinite `Future.get()` in main code; synchronous AI provider call remains a request-thread risk. |
| CompletableFuture / @Async Correctness | 5/5 | No `@Async` or production `CompletableFuture` usage found. |
| @Scheduled / Background Task Quality | 5/5 | No scheduled tasks or custom production executors found. |
| Thread Safety | 2/5 | Concurrent maps are used, but zero-hit fallback locks over I/O and admin session limit enforcement is non-atomic. |
| **Total Score** | **15/25** | |

## Escalation Items (Requires Human Judgment)
Decide whether the non-PostgreSQL zero-hit fallback is production-supported. If it is, it needs a database-safe atomic implementation before virtual threads are enabled. If it is test/demo-only, isolate it from production wiring so it cannot become a request-path carrier-pinning bottleneck.

### error-logging

- Status: completed
- Verdict: fail
- Summary: Static exception-handling and logging review of the full backend found no PII logging, no log concatenation, no System.out logging, and stacktrace disclosure is disabled. Release blockers remain around correlation IDs/MDC, RFC 7807 ProblemDetail responses, missing exception stack traces in server logs, JSON log configuration, and metrics exposure.

# Source Code Review Report: Exception Handling & Logging Review

## Summary
- **Review Target**: backend full source, static review only
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 6 / Medium: 0 / Low: 0

## Exception Handling Check Results
| File | Swallowing | throw e; | Logging in catch | Verdict |
|------|-----------|----------|------------------|---------|
| GlobalExceptionHandler.java | None found | None found | Catch-all omits Throwable stack trace | ❌ Fail |
| AiConsultationService.java | Handled fallback | None found | Catch block omits Throwable stack trace | ❌ Fail |
| SpringAiProviderClient.java | None found | None found | Wraps and propagates | ✅ Pass |

## PII Logging Detection Results
| # | File | Line Number | Detected PII Item | Suggested Fix |
|---|------|-------------|-------------------|---------------|
| - | - | - | No PII logging found in production log statements | - |

## Structured Logging Quality Check
| File | Placeholder Format | String Concatenation | System.out.println | Verdict |
|------|--------------------|---------------------|--------------------|---------|
| src/main/java/com/skishop | Used consistently | None found | None found | ⚠️ Missing JSON Logback |

## Correlation ID (MDC) Implementation Status
| Module | Filter/Interceptor | Response Header | MDC Logging | MDC Cleanup |
|--------|-------------------|-----------------|-------------|-------------|
| backend | Missing | Missing | Missing | Missing |

## Findings
| # | Severity | Category | Target File | Line Number | Finding | Suggested Fix Code |
|---|----------|----------|-------------|-------------|---------|-------------------|
| 1 | High | Correlation ID / MDC | RequestLoggingFilter.java | 25 | No X-Correlation-Id handling or MDC context exists | Add OncePerRequestFilter with MDC.put and MDC.clear in finally |
| 2 | High | Error Response Contract | GlobalExceptionHandler.java | 37 | Uses ApiErrorResponse instead of ProblemDetail | Return ProblemDetail and application/problem+json |
| 3 | High | Exception Logging | GlobalExceptionHandler.java | 121 | Catch-all handler logs no Throwable | `LOGGER.error("Unexpected API error path={} type={}", path, type, exception);` |
| 4 | High | Exception Logging | AiConsultationService.java | 57 | AI provider catch block logs no Throwable | Log providerStatus/failureType with exception as final SLF4J argument |
| 5 | High | Structured Logging | pom.xml | 45 | Missing logstash-logback-encoder and logback-spring.xml | Add dependency and JSON logback config including MDC |
| 6 | High | Observability Integration | application.yml | 44 | Actuator exposes only health and no business metrics exist | Expose secured metrics and register Micrometer counters/timers |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Exception Handling | 3/5 | Central handler exists and stacktrace disclosure disabled, but not ProblemDetail and server logs lose stack traces |
| Structured Logging Quality | 3/5 | SLF4J placeholders are used; JSON Logback config is missing |
| PII Logging Compliance | 5/5 | No production PII logging found; keyword logging uses hash/length |
| Correlation ID (MDC) | 0/5 | No implementation found |
| Observability Integration | 2/5 | Actuator dependency and health endpoint exist; metrics/tracing not exposed or instrumented |
| **Overall Score** | **13/25** | Release-blocking observability gaps remain |

## Escalation Items (Requires Human Judgment)
- Coordinate ProblemDetail migration with frontend contract/tests.
- Decide secured metrics exposure model before enabling actuator metrics in production.

### data-access

- Status: completed
- Verdict: fail
- Summary: Data access review found critical policy violations around JDBC configuration defaults and legacy timestamp binding, plus high-severity JPA mapping and transaction-boundary issues. No N+1 risk was found because the current entities have no associations.

# Source Code Review Report: Data Access Layer Review

## Summary
- **Review Target**: full backend data access layer
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 5 / Medium: 1 / Low: 0

## Entity Design Check
| Entity | @Table | @Column Coverage | java.time Usage | Collection Init | @Version | Verdict |
|---|---|---|---|---|---|---|
| Product | OK | Missing explicit `name` on several fields | OK (`Instant`) | N/A | N/A/read-mostly | ❌ |
| ZeroHitSearch | OK | Missing explicit `name` on several fields | OK (`Instant`) | N/A | Missing for mutable counter aggregate | ❌ |

## Query Quality Check
| File | Method | readOnly TX | N+1 Risk | DTO Projection | Pagination | Verdict |
|---|---|---|---|---|---|---|
| ProductQueryService | listProducts | OK | Low; no associations | Entity-to-DTO mapping, all fields used | OK | ✅ |
| ProductSearchService | search | Write TX used due possible zero-hit recording | Low; no associations | Entity-to-DTO mapping, all fields used | OK | ✅ |
| ZeroHitQueryService | listZeroHits | OK | Low; no associations | Entity-to-DTO mapping, all fields used | OK | ✅ |
| AiConsultationService | consult | OK | Low | Scalar category/manufacturer queries | N/A | ✅ |

## Transaction Management Check
| File | Method | @Transactional | Rollback Rule | Event Publishing | Verdict |
|---|---|---|---|---|---|
| ProductQueryService | listProducts | readOnly | N/A | N/A | ✅ |
| ProductSearchService | search | write transaction | Default runtime rollback | N/A | ✅ |
| ZeroHitQueryService | listZeroHits | readOnly | N/A | N/A | ✅ |
| ZeroHitRecordingService | record | Missing on public write method | N/A | N/A | ❌ |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|---|---|---|---|---|---|
| 1 | Critical | Configuration | src/main/resources/application.yml | 14 | Hardcoded JDBC URL fallback in deployable config | Use env-only base config and local profile defaults |
| 2 | Critical | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7,100 | Uses `java.sql.Timestamp` | Bind `OffsetDateTime`/`Instant` via java.time-compatible SQL parameter |
| 3 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-53 | Missing explicit `@Column(name=...)` values | Add explicit snake_case names to all fields |
| 4 | High | Entity Design | src/main/java/com/skishop/entity/ZeroHitSearch.java | 23-38 | Missing explicit `@Column(name=...)` values | Add explicit snake_case names to all fields |
| 5 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-90 | UUID generated in entity callback, not service layer String UUID | Generate String UUID before persistence |
| 6 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 50-101 | Audit timestamps use manual callbacks | Use `@CreationTimestamp` / `@UpdateTimestamp` |
| 7 | High | Transaction Management | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 59 | Public write method lacks `@Transactional` | Add service transaction boundary |
| 8 | Medium | Optimistic Locking | src/main/java/com/skishop/entity/ZeroHitSearch.java | 33-47 | Mutable aggregate has no `@Version` | Add version column and conflict handling |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|---|---:|---|
| Entity Design | 2/5 | Tables exist, but column naming, ID lifecycle, audit annotations, and versioning do not meet standard |
| Query Quality | 4/5 | No N+1 exposure; pagination and parameter binding are generally sound |
| Transaction Management | 3/5 | Read-only services are good; public zero-hit write boundary is incomplete |
| Optimistic Locking | 2/5 | Atomic PostgreSQL path helps, but JPA mutable aggregate has no `@Version` |
| Flyway Migration | 4/5 | Migrations exist and naming is valid; would need updates for ID/version/timestamp fixes |
| **Total Score** | **15/25** | Critical findings make the release verdict fail |

## Escalation Items (Requires Human Judgment)
- Decide whether to enforce the agent's String UUID convention or keep the existing PostgreSQL UUID schema as an accepted project deviation.

### config-di

- Status: completed
- Verdict: fail
- Summary: DI is mostly constructor-based and repositories/config properties are registered, but the review fails due to a hardcoded Docker password fallback, mutable authentication state held in singleton services, and incomplete SecurityFilterChain/server security configuration.

# Source Code Review Report: DI / Configuration / Security Filter Chain Review

## Summary
- **Review Target**: full backend
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 3 / Medium: 2 / Low: 0

## Spring Security Filter Chain Check
| # | Expected Configuration | Actual Configuration | Verdict |
|---|----------------------|---------------------|---------|
| 1 | `@ControllerAdvice` global exception handler | `GlobalExceptionHandler` uses `@RestControllerAdvice` | Pass |
| 2 | CORS before authentication | CORS exists, but is called after CSRF in the DSL | Warning |
| 3 | CSRF configuration | Disabled for stateless JSON API | Pass with justification |
| 4 | Session management | Stateless session policy configured | Pass |
| 5 | Request authorization | Public product/login/health and protected admin rules configured | Pass |
| 6 | Authentication provider / JWT filter | Bearer filter registered with `addFilterBefore` | Pass with ordering note |
| 7 | Security headers | No explicit `headers(...)` block | Fail |

## DI Registration Check
| Bean | Stereotype | Scope | Injection Method | Issue | Verdict |
|------|-----------|-------|-----------------|-------|---------|
| `SecurityConfig` | `@Configuration` | Singleton | Constructor | Missing headers/order issues | Warning |
| `BearerTokenAuthenticationFilter` | `@Component` | Singleton | Constructor | None found | Pass |
| `AdminAuthService` | `@Service` | Singleton | Constructor | Mutable in-memory auth session state | Fail |
| `InMemoryLoginAttemptLimiter` | `@Service` | Singleton | Constructor | Mutable in-memory attempt state | Warning |
| Repositories | Spring Data interfaces | Singleton proxies | Auto-detected | Extend `JpaRepository` | Pass |

## application*.properties Secret Detection
| File | Detected Secret | Type | Remediation |
|------|----------------|------|-------------|
| `src/main/resources/application-docker.yml:5` | `${SPRING_DATASOURCE_PASSWORD:skishop}` | Literal password fallback | Require env var; document sample values outside runtime config |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | Critical | Secrets | `src/main/resources/application-docker.yml` | 5 | Docker profile has known DB password fallback | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 2 | Critical | Singleton state | `src/main/java/com/skishop/service/AdminAuthService.java` | 29-42 | Singleton service owns mutable auth session state | Move to persistent/distributed state store or atomic bounded component |
| 3 | High | Security headers | `src/main/java/com/skishop/config/SecurityConfig.java` | 55-81 | No explicit `headers(...)` configuration | Add CSP, frame, content-type, and HSTS policy |
| 4 | High | Filter chain order | `src/main/java/com/skishop/config/SecurityConfig.java` | 55-81 | DSL order does not match mandated sequence | Reorder CORS, CSRF, session, authorization, auth filter, headers |
| 5 | High | Profiles | `src/main/resources/application.yml` | 1-64 | No dev/prod profile separation | Add `application-dev.yml` and `application-prod.yml` |
| 6 | Medium | Type-safe config | `src/main/java/com/skishop/config/AdminProperties.java` | 14-15 | Config records lack validation | Add `@Validated` and constraints |
| 7 | Medium | Logging | `src/main/resources/logback-spring.xml` | n/a | Missing profile-aware Logback configuration | Add structured/profile-specific logging config |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| DI Registration Quality | 3/5 | Constructor injection is good; mutable singleton auth state is not acceptable |
| Security Filter Chain | 2/5 | Authorization and bearer auth exist, but headers and mandated order are incomplete |
| Application Properties Quality | 2/5 | Stacktrace and OSIV are configured; Docker secret fallback and missing profiles fail the standard |
| Type-Safe Configuration | 3/5 | `@ConfigurationPropertiesScan` is present; validation is missing |
| Security Settings | 2/5 | CORS is explicit, but headers/logging/HTTPS production posture are incomplete |
| **Total Score** | **12/25** | Fail |

## Escalation Items (Requires Human Judgment)
- Confirm whether Docker default DB credentials are allowed for the OSS demo or must be mandatory environment secrets.
- Confirm production HTTPS termination location and document or configure it in the backend production profile.

### security

- Status: completed
- Verdict: fail
- Summary: Security review found release-blocking issues: hardcoded Docker DB credentials, an unauthenticated state-changing search endpoint that can be abused for DB growth/analytics tampering, and bypassable login throttling via client-supplied forwarding headers.

# Source Code Review Report: Security Review

## Summary
- **Review Target**: `/Users/yoterada/Ski-Shop-Zero-Hit-Radar/backend` full backend target
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 3 / Medium: 2 / Low: 0

## Phase A: Implementation Compliance Check

### OWASP Top 10 Check Results
| # | Category | Findings | Count | Verdict |
|---|---|---:|---:|---|
| A01 | Broken Access Control | Admin routes are protected by `/api/admin/**`. No IDOR-sensitive user resource found in this target. | 0 | ✅ |
| A02 | Cryptographic Failures | Hardcoded Docker DB password fallback; `{noop}` admin password accepted outside tests. | 2 | ❌ |
| A03 | Injection | JPQL/Criteria/NamedParameterJdbcTemplate are parameterized. No command execution or unsafe native SQL concatenation found. | 0 | ✅ |
| A07 | XSS | Backend API only, but security headers lack CSP/referrer/permissions hardening. | 1 | ❌ |
| A08 | Mass Assignment | Controllers bind DTO records, not JPA entities. | 0 | ✅ |
| A10 | SSRF | No direct user-controlled URL fetch found; Spring AI target is configured by server-side properties. | 0 | ✅ |

### Authentication/Authorization Check
| Endpoint | Auth Required | Role Restriction | IDOR Prevention | Verdict |
|---|---|---|---|---|
| `GET /actuator/health` | No | None | N/A | ✅ limited details |
| `GET /api/products` | No | None | N/A | ✅ read-only |
| `GET /api/products/search` | No | None | N/A | ❌ performs DB writes |
| `POST /api/auth/login` | No | None | N/A | ❌ limiter bypass via spoofed forwarding headers |
| `GET /api/auth/me` | Yes | Authenticated | N/A | ✅ |
| `POST /api/auth/logout` | Yes | Authenticated | N/A | ✅ |
| `/api/admin/**` | Yes | `ROLE_ADMIN` | N/A | ✅ |

### Hardcoded Secret Check
| File | Location | Secret Type | Remediation |
|---|---|---|---|
| `src/main/resources/application-docker.yml` | line 5 | DB password fallback `skishop` | Require env var and reject default deploy credentials |

### Security Header Check
| Header | Expected | Actual | Verdict |
|---|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Spring Security default likely applies | ✅ |
| `X-Frame-Options` | `DENY` | Spring Security default likely applies | ✅ |
| `Content-Security-Policy` | `default-src 'self'` | Not configured | ❌ |
| `Strict-Transport-Security` | enabled | Not explicitly configured; default HTTPS-only behavior uncertain from source | ⚠️ |
| `Server` | suppressed | `server.server-header` absent | ❌ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Not configured | ❌ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Not configured | ❌ |

### Struts Legacy Pattern Check
No Struts imports, `ActionForm`, JSP expression output, `request.getParameter`, production field injection, `System.out`, or `printStackTrace` patterns were found.

## Phase B: Attacker's Perspective Attack Resistance Analysis

### STRIDE Attack Resistance Summary
| STRIDE Category | Scenarios Verified | Sufficient | Insufficient | Unmitigated | Highest Risk |
|---|---:|---:|---:|---:|---|
| S: Spoofing | 3 | 1 | 2 | 0 | High |
| T: Tampering | 3 | 2 | 1 | 0 | Critical |
| R: Repudiation | 2 | 1 | 1 | 0 | Medium |
| I: Information Disclosure | 5 | 3 | 2 | 0 | High |
| D: Denial of Service | 4 | 1 | 3 | 0 | Critical |
| E: Elevation of Privilege | 3 | 3 | 0 | 0 | Low |

### Business Logic Attack Resistance
| # | Attack Scenario | Target Component | Defense Exists | Risk | Verdict |
|---|---|---|---|---|---|
| BL-analytics-1 | Flood distinct zero-hit keywords to pollute demand radar | Public product search | No rate limit/cardinality cap | Critical | ❌ |
| BL-concurrency-1 | Concurrent zero-hit increments lose counts | Zero-hit recording | PostgreSQL `ON CONFLICT` upsert | Low | ✅ |
| BL-ai-1 | Missing AI key/provider failure breaks demo | AI consultation | Fallback responses exist | Low | ✅ |

### Session Management Security
The backend uses stateless opaque bearer tokens, not servlet sessions. Session fixation cookie checks are therefore mostly N/A. Relevant token findings: tokens are random and time-limited, but login throttling is bypassable through spoofed forwarding headers and active concurrent token count permits three tokens per admin.

### Consolidated Findings
| # | Severity | Phase | Category | Target File | Line # | Finding |
|---|---|---|---|---|---:|---|
| 1 | Critical | A | A02 | `application-docker.yml` | 5 | Hardcoded Docker DB password fallback |
| 2 | Critical | B | DoS/Tampering | `ProductSearchService.java` | 63 | Public search writes unbounded zero-hit rows |
| 3 | High | B | Spoofing/Rate limiting | `AuthController.java` | 60 | Login limiter trusts spoofable forwarding headers |
| 4 | High | A | Security headers | `SecurityConfig.java` | 55 | Missing CSP/referrer/permissions/server header hardening |
| 5 | High | B | DoS | `application.yml` | 33 | No generic JSON request body size cap |
| 6 | Medium | B | Information disclosure | `AdminAuthService.java` | 67 | Username timing enumeration |
| 7 | Medium | A | Password handling | `SecurityConfig.java` | 85 | `{noop}` admin password accepted in production bean |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Injection Prevention | 5/5 | Parameterized/criteria-based data access |
| Authentication/Authorization | 3/5 | Admin protection good; limiter bypass issue |
| Secret Management | 2/5 | Docker DB password fallback |
| Security Headers | 2/5 | Important headers missing |
| CSRF Protection | 3/5 | Stateless bearer reduces CSRF exposure; public GET has write side effect |
| Rate Limiting / DoS Defense | 1/5 | Login limiter bypassable; public endpoints unthrottled |
| Spoofing Attack Resistance (S) | 3/5 | Bearer token random; source IP trust weak |
| Tampering Attack Resistance (T) | 3/5 | Analytics tampering via search flood |
| Information Disclosure Resistance (I) | 3/5 | Error responses safe; timing/server header gaps |
| Privilege Escalation Resistance (E) | 4/5 | Admin routes protected by role |
| Business Logic Attack Resistance | 2/5 | Zero-hit recording abuse path |
| Session Management Security | 3/5 | Stateless token model; no cookie session exposure |
| Struts Legacy Pattern Safety | 5/5 | No legacy Struts patterns found |
| **Total Score** | **39/65** | |

## Escalation Items
- Confirm whether Docker profile defaults are local-only or deployable.
- Confirm trusted proxy/header handling for production rate limiting.
- Decide whether zero-hit recording belongs on unauthenticated `GET /api/products/search`.

### dependency

- Status: completed
- Verdict: fail
- Summary: Dependency-management review failed due to high-severity scope/required-dependency issues. No prohibited dependencies or dependency/plugin SNAPSHOT versions were detected in pom.xml.

# Source Code Review Report: Dependency Management Review

## Summary
- **Review Target**: backend / pom.xml
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 2 / Medium: 2 / Low: 1

## Prohibited Dependency Detection Results
| # | Dependency (groupId:artifactId) | Detected pom.xml | Replacement | Severity |
|---|-------------------------------|-------------------|-------------|----------|
| - | None detected | - | - | - |

## SNAPSHOT Version Detection Results
| # | Dependency | Version | Detected pom.xml |
|---|-----------|---------|------------------|
| - | No dependency or plugin SNAPSHOT versions detected | - | - |

Note: the project artifact version is `0.0.1-SNAPSHOT` at `pom.xml:13`, but this review did not count it as a dependency/plugin SNAPSHOT finding.

## Build Configuration Check
| pom.xml | Parent POM | Java Version | Encoding | Verdict |
|---------|-----------|--------------|----------|---------|
| pom.xml | spring-boot-starter-parent 3.2.12 | 21 | Missing source/reporting encoding properties | ⚠️ Warning |

## Required Dependency Verification
| pom.xml | starter-web | starter-data-jpa | starter-security | flyway-core | actuator | Verdict |
|---------|-------------|------------------|------------------|-------------|----------|---------|
| pom.xml | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Missing required logstash-logback-encoder |

## Findings
| # | Severity | Category | Target pom.xml | Finding | Suggested Fix |
|---|----------|----------|----------------|---------|---------------|
| 1 | High | Test dependency scope | pom.xml:80 | H2 is declared with runtime scope although detected usage is test configuration only. | Change H2 to test scope unless a documented runtime profile requires it. |
| 2 | High | Required dependencies | pom.xml:45 | `net.logstash.logback:logstash-logback-encoder` is absent from the dependencies block. | Add the required encoder or document an approved logging-standard exception. |
| 3 | Medium | Build configuration | pom.xml:29 | UTF-8 Maven source/reporting encoding properties are missing. | Add `project.build.sourceEncoding` and `project.reporting.outputEncoding` as UTF-8. |
| 4 | Medium | Version management | pom.xml:31 | `flyway.version` overrides the Spring Boot managed version set. | Prefer Boot-managed Flyway versions or document/align the override. |
| 5 | Low | OSS metadata / license compliance | pom.xml:17 | POM license metadata is empty. | Populate license name and URL after project owner/legal decision. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Prohibited Dependency Compliance | 5/5 | No prohibited direct dependencies detected in pom.xml. |
| SNAPSHOT Exclusion | 5/5 | No dependency/plugin SNAPSHOT versions detected. |
| Build Configuration | 4/5 | Parent and Java version are correct; encoding properties are missing. |
| Required Dependencies | 3/5 | Core Spring/Flyway/PostgreSQL dependencies are present; required logstash encoder is missing and H2 scope is too broad. |
| Version Consistency | 3/5 | Single module avoids cross-module drift, but Flyway version management overrides the Boot dependency set. |
| **Overall Score** | **20/25** | |

## Escalation Items (Requires Human Judgment)
- Choose the OSS license to publish in Maven metadata.

### test-quality

- Status: completed
- Verdict: fail
- Summary: Test suite has strong breadth and current overall JaCoCo coverage is above 80%, but it fails the strict test-quality contract because naming is systematically non-compliant, AAA/act singularity is inconsistent, controller branch coverage is below target, and coverage thresholds are not enforced in Maven.

# Source Code Review Report: Test Quality Review

## Summary
- **Review Target**: backend full test suite
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 4 / Medium: 3 / Low: 0

## Test Naming Check
| File | Violating Method | Current Name | Recommended Name |
|---|---|---|---|
| `src/test/java/com/skishop/domain/ZeroHitDomainTests.java:18` | yes | `keywordNormalizerTrimsLowercasesAndCollapsesWhitespace` | `should_returnNormalizedKeyword_when_keywordHasMixedCaseAndWhitespace` |
| `src/test/java/com/skishop/controller/AuthApiIntegrationTests.java:67` | yes | `validLoginReturnsTokenAndAdminUser` | `should_returnTokenAndAdminUser_when_credentialsAreValid` |

All 77 detected `@Test` methods violate the required `should_ExpectedResult_when_Condition` pattern. No `@DisplayName` annotations were found.

## AAA Pattern Check
| File | Method | Arrange Clear | Act Single | Assert Clear | Verdict |
|---|---|---:|---:|---:|---|
| `ProductRequestOptionsTests.java:17` | `toPageableUsesDefaultsAndAllowedSorts` | No | No | Partial | Fail |
| `ZeroHitDomainTests.java:42` | `demandPolicyReturnsPriorityAndLossFromSameHitCount` | Partial | No | Partial | Fail |

## Test Type Coverage
| Test Type | Exists | Framework | Target Layer | Verdict |
|---|---:|---|---|---|
| Unit Test | Yes | JUnit 5 / Mockito | domain, service utilities | Pass |
| Integration Test API | Yes | `@SpringBootTest` + `MockMvc` | controllers | Pass |
| DB Slice Test | Yes | `@DataJpaTest`, H2 PostgreSQL mode | repositories/schema | Pass |
| Security Test | Yes | Spring Security test dependency plus bearer-token integration tests | auth/admin APIs | Pass |
| PostgreSQL Fidelity | Partial | Testcontainers PostgreSQL for concurrency path | zero-hit upsert | Warning |

## Coverage Verification
| Layer | Target | Actual / Evidence | Untested Method Count | Verdict |
|---|---:|---|---:|---|
| Service | 80% branch | service package 80.92% branch | 0 public methods identified as fully missed | Pass |
| Controller | 80% branch | controller package 50% branch; `AuthController` 5 missed / 5 covered | 0 public methods fully missed | Fail |
| Repository | 70% branch | repository interfaces not branch-counted; DB slice tests exist | n/a | Pass |
| Overall | 80% line and branch | line 95.88%, branch 80.82% | 5 JaCoCo missed methods, including 1 public handler | Pass with risk |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | High | Test Naming | `ZeroHitDomainTests.java` | 18 | Tests do not follow `should_X_when_Y`. | `void should_returnNormalizedKeyword_when_keywordHasMixedCaseAndWhitespace()` |
| 2 | Medium | DisplayName | `src/test/java` | n/a | No `@DisplayName` annotations in the test suite. | `@DisplayName("Returns normalized keyword when input has mixed case and whitespace")` |
| 3 | High | AAA | `ProductRequestOptionsTests.java` | 17 | Multiple acts and behaviors in one test. | Split defaults and each sort case, or parameterize supported sorts. |
| 4 | Medium | Parameterized Tests | `ProductRequestOptionsTests.java` | 28 | Repeated boundary/error assertions are not parameterized. | Use `@ParameterizedTest` with `@ValueSource` / `@CsvSource`. |
| 5 | High | Coverage | `AuthController.java` | 57 | Controller branch coverage is 50%, below 80%. | Add tests for source-IP branch paths and logout null credential path. |
| 6 | High | Coverage | `GlobalExceptionHandler.java` | 107 | Public 404 handler is uncovered. | Add unknown-route MockMvc test asserting 404 JSON payload. |
| 7 | Medium | JaCoCo | `pom.xml` | 114 | Coverage reports are generated but thresholds are not enforced. | Add `jacoco:check` with 0.80 line and branch minimums. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Test Naming Convention | 1/5 | Systematic naming violation; no display names. |
| AAA Pattern | 2/5 | Many integration tests are readable, but several unit tests mix acts/cases. |
| Test Type Coverage | 4/5 | Good spread across unit/API/DB/security; Testcontainers exists for key PostgreSQL path. |
| Coverage Criteria | 3/5 | Overall coverage passes, controller branch coverage fails, thresholds not enforced. |
| Mock Quality | 4/5 | Mockito use is limited and mostly appropriate. |
| **Overall Score** | **14/25** | Fail under the strict test-quality standard. |

## Escalation Items
- Whether to mass-rename all 77 tests now or phase the naming cleanup across touched files requires maintainer judgment.

### performance

- Status: completed
- Verdict: fail
- Summary: Performance review found no N+1 query or query-inside-loop defects, but collection APIs lack true pagination and the zero-hit summary repeats aggregate scans. Additional risks exist around search indexing, caching, and unbounded in-memory state.

# Source Code Review Report: Performance Review

## Summary
- **Review Target**: backend full source review
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 2 / Medium: 3 / Low: 1

## N+1 Query Detection Results
| # | File | Method | Line | Pattern | Fix Suggestion |
|---|------|--------|------|---------|----------------|
| - | - | - | - | No JPA associations or repository calls inside application loops found in reviewed production code. | No action. |

## Pagination Check
| Endpoint | Pagination Present | Default Size | Max Size | Verdict |
|----------|-------------------|-------------|----------|---------|
| `GET /api/products` | Partial: `limit` only, page fixed to 0 | 20 | 100 | ❌ Fail |
| `GET /api/products/search` | Partial: `limit` only, page fixed to 0 | 20 | 100 | ❌ Fail |
| `GET /api/admin/zero-hits` | Partial: `limit` only, page fixed to 0 | 20 | 100 | ❌ Fail |

## JPA Query Optimization Check
| File | Method | readOnly Txn | DTO Projection | exists vs count | Verdict |
|------|--------|-------------|----------------|-----------------|---------|
| `ProductQueryService.java` | `listProducts` | Yes | Entity fetch then mapper | N/A | ⚠️ Warning: pagination contract incomplete |
| `ProductSearchService.java` | `search` | No, mixed read/write | Entity fetch then mapper | N/A | ⚠️ Warning: search query needs indexing review |
| `ZeroHitQueryService.java` | `listZeroHits` | Yes | Entity fetch then mapper | N/A | ❌ Fail: duplicate aggregate scans |
| `AiConsultationService.java` | `consult` | Yes | Scalar queries | N/A | ⚠️ Warning: stable master data is uncached |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | Pagination | `src/main/java/com/skishop/service/ProductRequestOptions.java` | 29 | Collection APIs expose only `limit`; `PageRequest` is fixed to page 0. | Add `page`/`size`, cap size, return pagination metadata. |
| 2 | High | Duplicate query execution | `src/main/java/com/skishop/service/ZeroHitQueryService.java` | 64 | Summary metrics run three separate aggregate queries with the same cutoff. | Add one aggregate projection query returning `ZeroHitSummaryDto`. |
| 3 | Medium | JPA query optimization | `src/main/java/com/skishop/service/ProductSpecifications.java` | 39 | Lowercase leading-wildcard search cannot use existing btree indexes effectively. | Measure with `EXPLAIN ANALYZE`; use trigram GIN, full-text search, or prefix search. |
| 4 | Medium | Cache strategy | `src/main/java/com/skishop/service/AiConsultationService.java` | 45 | Distinct categories/manufacturers are queried for every AI consultation. | Cache stable product master lookups and evict on product changes. |
| 5 | Medium | Memory efficiency | `src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java` | 23 | Failed-attempt keys can remain in memory indefinitely. | Use a bounded expiring cache or scheduled cleanup. |
| 6 | Low | Allocation efficiency | `src/main/java/com/skishop/service/AiPromptBuilder.java` | 84 | Formatting pipeline allocates an intermediate list and concatenates in reduce. | Use `Collectors.joining(System.lineSeparator())`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| N+1 Query Prevention | 5/5 | No entity associations or loop-triggered repository calls found. |
| JPA Query Optimization | 3/5 | Query predicates are DB-side, but search is non-sargable and summary aggregation repeats scans. |
| Pagination | 2/5 | Limits are bounded, but true page navigation and response metadata are missing. |
| Memory Efficiency | 3/5 | Mostly acceptable; in-memory limiter needs eviction and prompt formatting can be leaner. |
| Cache Strategy | 2/5 | Stable product master reads are uncached. |
| **Overall Score** | **15/25** | High-priority pagination and aggregate-query fixes should precede OSS release. |

## Escalation Items (Requires Human Judgment)
- Confirm the API contract change from limit-only slices to page/size pagination with the frontend owner.
- Define expected catalog size and search latency target before choosing trigram vs full-text vs prefix search.


### resilience

- Status: completed
- Verdict: fail
- Summary: Resilience review failed because the live Spring AI provider call has no retry, circuit breaker, explicit timeout, or bulkhead protection. Actuator health probes are enabled and AI fallback responses exist, but graceful shutdown and provider health visibility are incomplete.

# Source Code Review Report: Resilience Review

## Summary
- **Review Target**: full backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 3 / Medium: 1 / Low: 0

## HTTP Client Management Check
| Component | Bean-Managed | Timeout Configured | URL Externalized | Verdict |
|-----------|-------------|-------------------|-----------------|---------|
| SpringAiConfig / SpringAiProviderClient | Yes, ChatClient bean | No explicit timeout found | No hardcoded app URL found; OpenAI default is library-managed | ❌ Fail |

## Resilience4j Configuration Check
| Client | @Retry | @CircuitBreaker | @TimeLimiter | Backoff | Verdict |
|--------|--------|-----------------|-------------|---------|---------|
| SpringAiProviderClient | No | No | No | No | ❌ Fail |

## Health Check Implementation Status
| Component | /actuator/health | readiness | DataSource | Custom Indicators | Verdict |
|-----------|-----------------|-----------|------------|------------------|---------|
| Spring Boot Actuator | Enabled | Enabled through probes | Auto-configured by datasource/actuator | No AI provider indicator found | ⚠️ Warning |

## Fallback Strategy
| Component | External Dependency | Fallback on Failure | Defined | Verdict |
|-----------|-------------------|--------------------|---------|---------|
| AiConsultationService | Spring AI / OpenAI-compatible provider | Missing key returns FALLBACK; provider exception returns ERROR answer | Yes | ✅ Pass |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|-----------------|
| 1 | Critical | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35 | External AI provider call has no retry/circuit breaker and no Resilience4j/Spring Retry dependency or config was found. | Add Resilience4j and wrap `generate()` with `@Retry(name="aiProvider")` and `@CircuitBreaker(name="aiProvider")`, configured for 3 attempts and exponential backoff. |
| 2 | High | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28 | Manual OpenAiApi/ChatClient creation has no explicit timeout settings. | Externalize timeout properties and configure the underlying client, plus optional `@TimeLimiter`. |
| 3 | High | Health Checks | src/main/resources/application.yml | 44 | Health probes exist, but no custom health indicator for the AI provider was found. | Add an AI provider `HealthIndicator` or non-gating availability component. |
| 4 | High | Graceful Shutdown | src/main/resources/application.yml | 33 | `server.shutdown=graceful` and shutdown phase timeout are absent. | Add `server.shutdown: graceful` and `spring.lifecycle.timeout-per-shutdown-phase: 30s`. |
| 5 | Medium | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35 | Synchronous AI calls have no concurrency isolation. | Add `@Bulkhead(name="aiProvider", type=SEMAPHORE)` with bounded concurrency. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| HTTP Client Management | 3/5 | No direct `new RestTemplate()` found and ChatClient is bean-managed, but timeout is missing. |
| Retry / CB | 1/5 | No retry, circuit breaker, backoff, or dependency/config found for the external AI call. |
| Health Checks | 4/5 | Actuator health and probes are enabled; provider-specific health is missing. |
| Timeout Management | 1/5 | No explicit external provider timeout contract found. |
| Fallback | 4/5 | Fallback/error answers exist, but they are not integrated with resilience annotations. |
| **Overall Score** | **13/25** | Critical resilience controls are absent for the live external dependency. |

## Escalation Items (Requires Human Judgment)
- Decide whether the AI provider should gate readiness or be reported as a non-gating degraded component, since the application has a fallback mode when live AI is unavailable.

