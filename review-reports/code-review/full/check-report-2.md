# Source Code Review Integrated Report

## Verdict
- Target: full
- Verdict: Rejected
- Review Date: 2026-06-04T18:54:02.960Z
- Project: /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend
- Agents: tech-lead, architecture, ddd-domain, api-endpoint, java-standards, async-concurrency, error-logging, data-access, config-di, security, dependency, test-quality, performance, resilience

## Findings Summary
| Agent | Thread ID | Status | Verdict | Critical | High | Medium | Low | Score |
|---|---|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e93f6-ae09-75d3-99bb-33871f41f478 | completed | fail | 1 | 0 | 3 | 0 | 70 |
| architecture | 019e93f6-adf9-7c73-ab96-a5b747e03874 | completed | fail | 0 | 2 | 3 | 0 | 18 |
| ddd-domain | 019e93f6-ae2b-7262-af03-216f7f50c80c | completed | fail | 0 | 4 | 0 | 0 | 57 |
| api-endpoint | 019e93f6-ae22-7bf3-9e2a-de1590f33828 | completed | fail | 0 | 3 | 2 | 0 | 68 |
| java-standards | 019e93f6-ae37-78e1-b940-e13cbfe49761 | completed | fail | 0 | 5 | 1 | 0 | 17 |
| async-concurrency | 019e93f6-ae22-7af0-bf10-a5dec4787e49 | completed | fail | 2 | 4 | 0 | 0 | 10 |
| error-logging | 019e93f6-ae37-7223-a5ae-f6d79758d3c9 | completed | fail | 0 | 5 | 1 | 0 | 60 |
| data-access | 019e93f8-a2db-7f53-9db7-944601e9e7ec | completed | fail | 2 | 3 | 2 | 0 | 16 |
| config-di | 019e93f8-c6b1-7251-8bd8-9f49351deab0 | completed | fail | 2 | 3 | 1 | 1 | 52 |
| security | 019e93f8-e242-71d2-8426-2bf3dfd578b3 | completed | fail | 2 | 3 | 1 | 0 | 69 |
| dependency | 019e93f9-3b72-7071-bb36-260b4e8f3c71 | completed | fail | 0 | 2 | 2 | 0 | 76 |
| test-quality | 019e93f9-56c3-71d2-ab99-a36ee33b5685 | completed | fail | 0 | 4 | 3 | 0 | 13 |
| performance | 019e93f9-9acf-7932-8aaf-7021113e0c00 | completed | fail | 0 | 3 | 3 | 1 | 64 |
| resilience | 019e93fa-89df-76e2-b918-b679e79c66fb | completed | fail | 1 | 3 | 1 | 0 | 52 |

## Verdict Rationale
Critical findings were detected and require remediation before approval.

## Critical/High Findings List
| # | Severity | Source Agent | Category | Target File | Line | Finding | Suggested Fix |
|---:|---|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 64-66 | Optional.get() remains in production authentication filter | Assign the value once with an explicit safe extraction after validation, for example: AdminUserDto adminUser = user.orElseThrow(); then use adminUser and adminUser.role(), or restructure validateToken(token).map(...).orElseGet(...) without get(). |
| 2 | High | architecture | Project Structure / Layer Boundary | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-21 | Repository infrastructure is implemented inside the service package | Move this class to `com.skishop.repository` or a clearly named infrastructure package. If the service needs an abstraction, define a service-facing gateway interface and keep the JDBC implementation outside `service/`. |
| 3 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | Required package layout is not implemented for model and DTO subpackages | Either move entities to `com.skishop.model` and split DTOs into `com.skishop.dto.request` / `com.skishop.dto.response`, or explicitly update the architecture standard if `entity/` and flat `dto/` are intentional. |
| 4 | High | ddd-domain | Domain Event Design | src/main/java/com/skishop/service/ProductSearchService.java | 24-64 | Product search coordinates ZeroHitSearch directly instead of publishing a domain event | Introduce an immutable past-tense event such as ProductSearchReturnedZeroResultsEvent(String keyword, Instant searchedAt). ProductSearchService should publish it via ApplicationEventPublisher after determining zero results; a ZeroHit event handler should call ZeroHitRecordingService, using @TransactionalEventListener where post-commit behavior is required. |
| 5 | High | ddd-domain | Domain Logic Encapsulation | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | PostgreSQL atomic upsert bypasses aggregate methods and duplicates domain rules in SQL | Keep concurrency handling in persistence infrastructure but route business state transitions through the aggregate. Prefer a custom repository using row-level/advisory locking or unique-constraint retry that loads/creates ZeroHitSearch and calls firstHit/recordRepeat. If native SQL remains, centralize and test the invariant mapping explicitly against the domain policy for every threshold. |
| 6 | High | ddd-domain | Value Object Implementation | src/main/java/com/skishop/entity/Product.java | 40-41 | Money-like concepts are persisted as raw BigDecimal instead of immutable value objects | Introduce a Money value object, for example an @Embeddable record Money(BigDecimal amount, String currency) with non-negative, scale, and currency validation. Embed it in Product and ZeroHitSearch with AttributeOverrides and have OpportunityLossCalculator return Money rather than BigDecimal. |
| 7 | High | ddd-domain | Domain Invariants | src/main/java/com/skishop/entity/Product.java | 73-79 | Product aggregate constructor does not enforce product invariants | Add Product factory/constructor validation for non-blank manufacturer/name/category/description, non-negative price or Money, valid stockStatus, and timestamp ordering. Keep database constraints as a backstop, not the first line of domain protection. |
| 8 | High | api-endpoint | HTTP method / REST convention | src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search records zero-hit data as a side effect | Split read and write behavior: keep GET /api/products/search read-only, and record search events through a POST endpoint such as /api/search-events or /api/zero-hit-searches after an explicit frontend search. If the design intentionally keeps analytics recording on GET, add a documented exception and cache-control protections, but the REST risk remains. |
| 9 | High | api-endpoint | Input validation / authentication boundary | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting trusts spoofable X-Forwarded-For and X-Real-IP headers | Use request.getRemoteAddr() by default. Only honor forwarded headers when Spring is configured for trusted proxies, validate the extracted address as a single IP, cap its length, and ignore arbitrary client-supplied chains. |
| 10 | High | api-endpoint | Error response design | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-132 | Global API errors do not use Spring Boot 3.2 ProblemDetail / RFC 9457 format | Migrate the advice to return ProblemDetail, setting type/title/status/detail/instance and adding extension properties such as code and errors. If the frontend contract must retain the current payload, document that as a deliberate deviation from RFC 9457. |
| 11 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 22-23 | Service class has no corresponding interface | Introduce an interface such as ZeroHitRecordingUseCase with record(String keyword), implement it in ZeroHitRecordingService, and inject the interface in ProductSearchService. |
| 12 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20-21 | Custom repository bean lacks an interface | Introduce an interface such as ZeroHitUpsertGateway, implement it in ZeroHitAtomicUpsertGateway, and inject the interface into ZeroHitRecordingService. |
| 13 | High | java-standards | Null Safety | src/main/java/com/skishop/repository/ProductRepository.java | 29-29 | Nullable repository parameter is not annotated | Annotate nullable category parameters with @Nullable, for example @Param("category") @Nullable String category, and apply the same change to searchProducts category. |
| 14 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19-21 | Public method accepts null without @Nullable | Add org.springframework.lang.Nullable and declare public String normalize(@Nullable String keyword). |
| 15 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/OpportunityLossCalculator.java | 21-23 | Nullable money input is not annotated | Declare the parameter as @Nullable BigDecimal averageProductPrice, or reject null with Objects.requireNonNull if null is not intended to be valid. |
| 16 | Critical | async-concurrency | Virtual Thread / Monitor Pinning | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | JPA database I/O is executed inside a synchronized block | Remove the monitor-based read-modify-write fallback. Prefer an atomic database operation per supported database, or handle the unique constraint with a retry in a fresh transaction. If a local lock remains unavoidable, use ReentrantLock and keep DB I/O outside the locked section as much as possible. |
| 17 | Critical | async-concurrency | Virtual Thread / Monitor Pinning | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Database metadata I/O is performed while holding a synchronized monitor | Initialize database support eagerly at startup, or use a ReentrantLock/future-style initializer that does not hold a JVM monitor across JDBC I/O. Keep connection acquisition outside synchronized blocks. |
| 18 | High | async-concurrency | Virtual Thread Adoption | src/main/resources/application.yml | 1-64 | Java 21 virtual threads are not enabled in runtime configuration | After removing synchronized-over-I/O pinning hazards, add `spring.threads.virtual.enabled: true` to the default and Docker runtime configuration. Validate request concurrency with the zero-hit and AI endpoints. |
| 19 | High | async-concurrency | Transaction / Blocking I/O | src/main/java/com/skishop/service/AiConsultationService.java | 42-51 | External AI provider call runs inside a read-only transaction | Limit the transaction to the DB context lookup only, then perform the AI call outside any transaction. For example, move category/manufacturer lookup into a small read-only method and return detached immutable context before invoking aiProviderClient.generate(...). |
| 20 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 125-146 | Active admin token limit is not enforced atomically under concurrent logins | Guard the whole enforce-and-put sequence with a ReentrantLock, or store sessions per admin and update the per-admin token set via a single compute/lock-protected operation. Add a concurrent login test that asserts the cap never exceeds 3. |
| 21 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 31-46 | Login attempt rate-limit check and failure recording are split across non-atomic operations | Expose a single atomic operation such as `recordFailureIfAllowed(username, sourceIp)` implemented with ConcurrentHashMap.compute(), returning whether the attempt should proceed or be rate-limited. Alternatively serialize per-key limiter updates with a keyed lock. |
| 22 | High | error-logging | Correlation ID (MDC) | src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | No correlation ID filter or MDC propagation is implemented | Add a OncePerRequestFilter that reads X-Correlation-Id, generates a UUID when missing, validates/bounds the value, puts it in MDC under correlationId, sets the response header, and clears MDC in finally. Include correlationId in the Logback pattern or JSON fields. |
| 23 | High | error-logging | Error Response Contract | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-45 | Global exception responses do not use ProblemDetail/RFC7807 | Return ProblemDetail from @ExceptionHandler methods, set title/detail/status and stable properties such as code, path, and errors via pd.setProperty(...). Align ApiErrorWriter/security responses with the same ProblemDetail shape. |
| 24 | High | error-logging | Exception Logging | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Unexpected exception handler drops the stack trace | Use placeholder logging with the Throwable as the last argument, for example: LOGGER.error("Unexpected API error path={} type={}", request.getRequestURI(), exception.getClass().getName(), exception); |
| 25 | High | error-logging | Exception Logging | src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | Handled AI provider failures are converted to responses without logging the exception | Log a sanitized failure event with the Throwable as the final argument, for example: LOGGER.warn("ai_consultation providerStatus={} errorType={}", response.providerStatus(), exception.getClass().getName(), exception); Avoid logging prompt text, API keys, or user-entered keyword values. |
| 26 | High | error-logging | Structured Logging Configuration | pom.xml | 45-110 | No production JSON Logback/logstash configuration is present | Add logstash-logback-encoder and src/main/resources/logback-spring.xml with JSON output for non-local profiles, including application name, level, logger, message, exception, correlationId, traceId, and spanId fields. |
| 27 | Critical | data-access | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | java.sql.Timestamp is used in the PostgreSQL upsert gateway | Bind a java.time value directly if supported by the driver/JdbcTemplate, or use a typed SqlParameterSource with Instant/OffsetDateTime. Align the database column type accordingly, preferably TIMESTAMPTZ for Instant semantics. |
| 28 | Critical | data-access | JPA Configuration | src/main/resources/application.yml | 14-16 | Datasource URLs and docker credentials have hardcoded defaults | Remove production/runtime JDBC fallbacks and require SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, and SPRING_DATASOURCE_PASSWORD. Keep local demo defaults only in a clearly named local/dev profile or documented compose-only environment. |
| 29 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-90 | Entity primary keys use UUID and entity lifecycle generation instead of String UUID generated before persistence | Change IDs to String with @Column(name = "id", length = 36, nullable = false, updatable = false), generate UUID.randomUUID().toString() in the service/application layer before constructing entities, and update repository ID types plus tests. |
| 30 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 25-40 | Several @Column annotations omit explicit snake_case column names | Add explicit names to all @Column annotations, for example @Column(name = "manufacturer", nullable = false, length = 100) and @Column(name = "keyword", nullable = false, length = 255). |
| 31 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps are managed manually instead of @CreationTimestamp/@UpdateTimestamp | Use @CreationTimestamp on createdAt and @UpdateTimestamp on updatedAt, keep explicit @Column names, and remove manual audit timestamp lifecycle code unless there is a documented clock-injection requirement. |
| 32 | Critical | config-di | Application Properties Secret Detection | src/main/resources/application-docker.yml | 5-5 | Docker profile ships a default datasource password | Remove the fallback and require an external value, e.g. `password: ${SPRING_DATASOURCE_PASSWORD}`. Put non-secret sample values only in `.env.example` or Docker Compose documentation. |
| 33 | Critical | config-di | DI Registration / Singleton Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 41-42 | Singleton auth service keeps mutable session state with a non-atomic token limit | Serialize token issuance per admin identity, or replace in-memory session state with an external/session repository that enforces the active-token limit atomically. At minimum, make the limit check and insert one synchronized/locked critical section per username. |
| 34 | High | config-di | Spring Security Filter Chain | src/main/java/com/skishop/config/SecurityConfig.java | 56-81 | Required security headers are not explicitly configured | Add an explicit `headers(headers -> ...)` block configuring frame options, content type options, HSTS for HTTPS, and a CSP appropriate for the API/frontend deployment. |
| 35 | High | config-di | Spring Security Filter Chain | src/main/java/com/skishop/config/SecurityConfig.java | 56-59 | CORS and CSRF DSL order does not match the mandated sequence | Reorder the DSL to call `.cors(Customizer.withDefaults())` before `.csrf(...)`, then session management, authorization, authentication filter, and headers. |
| 36 | High | config-di | Application Properties Quality | src/main/resources |  | Development and production profile configuration are missing | Add `application-dev.yml` and `application-prod.yml`. Keep common safe defaults in `application.yml`; require production secrets from environment variables; set production root logging to WARN or stricter. |
| 37 | Critical | security | A02: Cryptographic Failures / Secret Management | src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded default database password | Remove the default secret and require `SPRING_DATASOURCE_PASSWORD` to be set, e.g. `password: ${SPRING_DATASOURCE_PASSWORD}`. Provide only non-secret placeholders in `.env.example` and fail startup when the value is absent. |
| 38 | Critical | security | A01: Broken Access Control / Rate Limiting / Spoofing | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting can be bypassed by spoofing X-Forwarded-For | Centralize client IP resolution and only honor forwarding headers when `request.getRemoteAddr()` is a trusted reverse proxy. Add a username-only or global throttle in addition to IP-based throttling, and add tests proving spoofed XFF values do not bypass lockout. |
| 39 | High | security | A09: Security Logging and Monitoring / DoS | src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 24-59 | Login limiter stores unbounded attacker-controlled keys | Use a bounded cache with TTL and maximum size, or periodically purge expired entries. Prefer a distributed/bounded rate limiter for production and avoid unlimited per-identity map growth. |
| 40 | High | security | A10/A04: DoS / Business Logic Abuse | src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public zero-hit search writes are not rate-limited | Add public search rate limiting and a distinct zero-hit write quota per source/window. Consider suppressing low-quality/random keywords and monitoring abnormal distinct-keyword volume. |
| 41 | High | security | Security Headers / A07: XSS Defense in Depth | src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Expected browser hardening headers are not explicitly configured | Add `.headers(headers -> headers.contentSecurityPolicy(...).referrerPolicy(...).permissionsPolicy(...))` and explicitly blank/suppress server-identifying headers in configuration. Keep default nosniff/frame/HSTS behavior enabled. |
| 42 | High | dependency | Required Dependency Verification | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Required structured logging dependency is missing | Add `net.logstash.logback:logstash-logback-encoder` with a stable release version, since it is not managed by Spring Boot's BOM, and wire it through the Logback configuration if structured logging is required. |
| 43 | High | dependency | Test Dependency Scope | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 80-84 | H2 is packaged as a runtime dependency instead of being test-scoped | Change H2 to `<scope>test</scope>` if it is only used by tests. If local non-test H2 execution is intentionally supported, isolate it behind a dedicated Maven profile rather than the default runtime classpath. |
| 44 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 18-18 | All reviewed test method names violate the required should_X_when_Y pattern | Rename tests to the required form, e.g. `void should_normalizeKeyword_when_keywordContainsWhitespaceAndUppercase()` and `void should_returnTokenAndAdminUser_when_credentialsAreValid()`. |
| 45 | High | test-quality | AAA Pattern | src/test/java/com/skishop/service/AdminAuthServiceTests.java | 29-43 | Representative tests mix multiple Act calls and assertions instead of one clear Act block | Split distinct behaviors into separate tests and use explicit blocks: Arrange service, Act with one call, Assert the result. Move validation behavior into a dedicated `should_validateAdminUser_when_tokenIsIssued` test. |
| 46 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 40-41 | Controller branch coverage is far below the 80% target | Add controller integration tests for `X-Forwarded-For` with comma-separated values, blank/missing forwarded headers, `X-Real-IP`, remote-address fallback, and logout credential edge cases where reachable. |
| 47 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 8-25 | Several service classes miss the 80% branch coverage bar | Add focused unit tests for missing provider/client branches, blank AI outputs, exception paths, category/keyword specification null-empty combinations, limiter window/lock expiry boundaries, and `ZeroHitQueryService` sort/days/limit boundary values. |
| 48 | High | performance | JPA Query Optimization | src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing can execute a duplicate count query | Store the returned `Page<Product>` and use `page.getTotalElements()`: `Page<Product> page = productRepository.findAll(specification, pageable); return new ProductListResponse(page.getContent().stream().map(productMapper::toDto).toList(), page.getTotalElements());` |
| 49 | High | performance | JPA Query Optimization | src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search can execute a duplicate count query | Use a single `Page<Product>` result and read `getTotalElements()` from it. If total count is not required for a future endpoint, use `Slice`/limit-only querying to avoid count entirely. |
| 50 | High | performance | DTO Projection | src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Product read APIs materialize managed entities for DTO-only responses | Introduce a DTO projection query or custom repository projection for product list/search, for example JPQL constructor projection into `ProductDto` or an interface projection compatible with the dynamic filters. |
| 51 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25-38 | Live AI provider call has no retry or circuit breaker protection | Add Resilience4j Spring Boot support, configure an aiProvider instance with maxAttempts 3, exponential backoff, and circuit breaker thresholds, then wrap generate() with @Retry(name = "aiProvider", fallbackMethod = "generateFallback") and @CircuitBreaker(name = "aiProvider", fallbackMethod = "generateFallback"). The fallback should return Optional.empty() or a controlled provider-error path based on the desired API providerStatus. |
| 52 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 27-37 | External AI call has no explicit timeout contract | Expose app.ai.connect-timeout/read-timeout or Spring AI client timeout properties and wire them into the OpenAiApi underlying HTTP client where supported. Also consider @TimeLimiter(name = "aiProvider") for an overall operation deadline, with a fallback that preserves the existing degraded response behavior. |
| 53 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-43 | Graceful shutdown is not enabled | Add server.shutdown: graceful and spring.lifecycle.timeout-per-shutdown-phase: 30s (or an SLO-appropriate value). Ensure the container orchestrator termination grace period is longer than the application shutdown timeout. |
| 54 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | Readiness does not cover the configured live AI dependency | Add an AiProviderHealthIndicator with a short bounded check or a cached/provider-status based indicator. Decide whether AI should affect readiness; if the feature is optional, expose the indicator as a separate component and keep readiness UP while surfacing degraded status through health details/metrics. |


## All Findings
| # | Severity | Source Agent | Category | Target File | Line | Finding |
|---:|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 64-66 | Optional.get() remains in production authentication filter |
| 2 | Medium | tech-lead | Code Consistency | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 50-56 | Zero-hit demand rules are duplicated across domain, entity, and native SQL |
| 3 | Medium | tech-lead | Layering | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-20 | Repository adapter is packaged under service layer |
| 4 | Medium | tech-lead | Quality Gate | pom.xml | 114-131 | Coverage target is reported but not enforced by Maven |
| 5 | High | architecture | Project Structure / Layer Boundary | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-21 | Repository infrastructure is implemented inside the service package |
| 6 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | Required package layout is not implemented for model and DTO subpackages |
| 7 | Medium | architecture | DTO Boundary Enforcement | src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3-17 | Response DTO is coupled to an entity-package enum |
| 8 | Medium | architecture | Spring Boot Configuration | src/main/resources/application.yml | 13-23 | Environment profile separation is incomplete |
| 9 | Medium | architecture | Separation of Concerns | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Auth request metadata parsing is embedded in the controller |
| 10 | High | ddd-domain | Domain Event Design | src/main/java/com/skishop/service/ProductSearchService.java | 24-64 | Product search coordinates ZeroHitSearch directly instead of publishing a domain event |
| 11 | High | ddd-domain | Domain Logic Encapsulation | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | PostgreSQL atomic upsert bypasses aggregate methods and duplicates domain rules in SQL |
| 12 | High | ddd-domain | Value Object Implementation | src/main/java/com/skishop/entity/Product.java | 40-41 | Money-like concepts are persisted as raw BigDecimal instead of immutable value objects |
| 13 | High | ddd-domain | Domain Invariants | src/main/java/com/skishop/entity/Product.java | 73-79 | Product aggregate constructor does not enforce product invariants |
| 14 | High | api-endpoint | HTTP method / REST convention | src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search records zero-hit data as a side effect |
| 15 | High | api-endpoint | Input validation / authentication boundary | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting trusts spoofable X-Forwarded-For and X-Real-IP headers |
| 16 | Medium | api-endpoint | Input validation | src/main/java/com/skishop/dto/LoginRequest.java | 11-11 | LoginRequest lacks length constraints for externally supplied credentials |
| 17 | High | api-endpoint | Error response design | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-132 | Global API errors do not use Spring Boot 3.2 ProblemDetail / RFC 9457 format |
| 18 | Medium | api-endpoint | Controller mapping convention | src/main/java/com/skishop/controller/AdminZeroHitController.java | 19-37 | Admin controllers lack class-level base @RequestMapping |
| 19 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 22-23 | Service class has no corresponding interface |
| 20 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20-21 | Custom repository bean lacks an interface |
| 21 | High | java-standards | Null Safety | src/main/java/com/skishop/repository/ProductRepository.java | 29-29 | Nullable repository parameter is not annotated |
| 22 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19-21 | Public method accepts null without @Nullable |
| 23 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/OpportunityLossCalculator.java | 21-23 | Nullable money input is not annotated |
| 24 | Medium | java-standards | Null Safety | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 56-66 | Optional.get is used despite an easier value extraction pattern |
| 25 | Critical | async-concurrency | Virtual Thread / Monitor Pinning | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | JPA database I/O is executed inside a synchronized block |
| 26 | Critical | async-concurrency | Virtual Thread / Monitor Pinning | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Database metadata I/O is performed while holding a synchronized monitor |
| 27 | High | async-concurrency | Virtual Thread Adoption | src/main/resources/application.yml | 1-64 | Java 21 virtual threads are not enabled in runtime configuration |
| 28 | High | async-concurrency | Transaction / Blocking I/O | src/main/java/com/skishop/service/AiConsultationService.java | 42-51 | External AI provider call runs inside a read-only transaction |
| 29 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 125-146 | Active admin token limit is not enforced atomically under concurrent logins |
| 30 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 31-46 | Login attempt rate-limit check and failure recording are split across non-atomic operations |
| 31 | High | error-logging | Correlation ID (MDC) | src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | No correlation ID filter or MDC propagation is implemented |
| 32 | High | error-logging | Error Response Contract | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-45 | Global exception responses do not use ProblemDetail/RFC7807 |
| 33 | High | error-logging | Exception Logging | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Unexpected exception handler drops the stack trace |
| 34 | High | error-logging | Exception Logging | src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | Handled AI provider failures are converted to responses without logging the exception |
| 35 | High | error-logging | Structured Logging Configuration | pom.xml | 45-110 | No production JSON Logback/logstash configuration is present |
| 36 | Medium | error-logging | Observability Integration | src/main/resources/application.yml | 44-49 | Actuator exposure is limited to health only; metrics endpoint is not enabled |
| 37 | Critical | data-access | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | java.sql.Timestamp is used in the PostgreSQL upsert gateway |
| 38 | Critical | data-access | JPA Configuration | src/main/resources/application.yml | 14-16 | Datasource URLs and docker credentials have hardcoded defaults |
| 39 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 24-90 | Entity primary keys use UUID and entity lifecycle generation instead of String UUID generated before persistence |
| 40 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 25-40 | Several @Column annotations omit explicit snake_case column names |
| 41 | High | data-access | Entity Design | src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps are managed manually instead of @CreationTimestamp/@UpdateTimestamp |
| 42 | Medium | data-access | Optimistic Locking | src/main/java/com/skishop/entity/ZeroHitSearch.java | 33-150 | Mutable ZeroHitSearch aggregate has no @Version field |
| 43 | Medium | data-access | Query Quality | src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Read-list queries load entities instead of DTO projections |
| 44 | Critical | config-di | Application Properties Secret Detection | src/main/resources/application-docker.yml | 5-5 | Docker profile ships a default datasource password |
| 45 | Critical | config-di | DI Registration / Singleton Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 41-42 | Singleton auth service keeps mutable session state with a non-atomic token limit |
| 46 | High | config-di | Spring Security Filter Chain | src/main/java/com/skishop/config/SecurityConfig.java | 56-81 | Required security headers are not explicitly configured |
| 47 | High | config-di | Spring Security Filter Chain | src/main/java/com/skishop/config/SecurityConfig.java | 56-59 | CORS and CSRF DSL order does not match the mandated sequence |
| 48 | High | config-di | Application Properties Quality | src/main/resources |  | Development and production profile configuration are missing |
| 49 | Medium | config-di | Security Settings / Logging | src/main/resources |  | No logback-spring.xml for profile-specific structured logging |
| 50 | Low | config-di | Type-Safe Configuration | src/main/java/com/skishop/config/AdminProperties.java | 14-15 | ConfigurationProperties records are not validated |
| 51 | Critical | security | A02: Cryptographic Failures / Secret Management | src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded default database password |
| 52 | Critical | security | A01: Broken Access Control / Rate Limiting / Spoofing | src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login rate limiting can be bypassed by spoofing X-Forwarded-For |
| 53 | High | security | A09: Security Logging and Monitoring / DoS | src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 24-59 | Login limiter stores unbounded attacker-controlled keys |
| 54 | High | security | A10/A04: DoS / Business Logic Abuse | src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public zero-hit search writes are not rate-limited |
| 55 | High | security | Security Headers / A07: XSS Defense in Depth | src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Expected browser hardening headers are not explicitly configured |
| 56 | Medium | security | Denial of Service / External Provider Hardening | src/main/java/com/skishop/service/SpringAiProviderClient.java | 34-38 | Live AI provider call has no explicit timeout or bulkhead in application code |
| 57 | High | dependency | Required Dependency Verification | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Required structured logging dependency is missing |
| 58 | High | dependency | Test Dependency Scope | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 80-84 | H2 is packaged as a runtime dependency instead of being test-scoped |
| 59 | Medium | dependency | Build Configuration | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 29-33 | Source and reporting encodings are not declared |
| 60 | Medium | dependency | Version Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 31-73 | Flyway version is overridden instead of cleanly inheriting Spring Boot dependency management |
| 61 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 18-18 | All reviewed test method names violate the required should_X_when_Y pattern |
| 62 | High | test-quality | AAA Pattern | src/test/java/com/skishop/service/AdminAuthServiceTests.java | 29-43 | Representative tests mix multiple Act calls and assertions instead of one clear Act block |
| 63 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 40-41 | Controller branch coverage is far below the 80% target |
| 64 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 8-25 | Several service classes miss the 80% branch coverage bar |
| 65 | Medium | test-quality | Coverage Enforcement | pom.xml | 118-131 | JaCoCo reports coverage but does not enforce the required thresholds |
| 66 | Medium | test-quality | Test Documentation | src/test/java/com/skishop/controller/AuthApiIntegrationTests.java | 54-67 | Tests do not use @DisplayName for human-readable specifications |
| 67 | Medium | test-quality | Parameterized Tests | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 27-42 | Boundary and matrix-style tests are written as repeated assertions instead of parameterized tests |
| 68 | High | performance | JPA Query Optimization | src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing can execute a duplicate count query |
| 69 | High | performance | JPA Query Optimization | src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search can execute a duplicate count query |
| 70 | High | performance | DTO Projection | src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Product read APIs materialize managed entities for DTO-only responses |
| 71 | Medium | performance | Query Selectivity | src/main/java/com/skishop/service/ProductSpecifications.java | 39-44 | Keyword search uses leading-wildcard lower LIKE predicates |
| 72 | Medium | performance | Cache Strategy | src/main/java/com/skishop/service/AiConsultationService.java | 45-47 | AI consultation reloads stable product master context on every request |
| 73 | Medium | performance | Database Round Trips | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 96-102 | PostgreSQL zero-hit upsert performs an extra select after update |
| 74 | Low | performance | Memory Allocation | src/main/java/com/skishop/service/AiPromptBuilder.java | 84-93 | Prompt list formatting performs unnecessary list materialization and string concatenation reduction |
| 75 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25-38 | Live AI provider call has no retry or circuit breaker protection |
| 76 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 27-37 | External AI call has no explicit timeout contract |
| 77 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-43 | Graceful shutdown is not enabled |
| 78 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | Readiness does not cover the configured live AI dependency |
| 79 | Medium | resilience | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 34-38 | No concurrency isolation around slow external AI calls |


## Escalation Items
| # | Priority | Source Agent | Description | Recommended Decision Maker |
|---:|---|---|---|---|
| 1 | normal | tech-lead | Decide whether the PostgreSQL-native upsert should remain despite duplicated business rules. It provides concurrency value, but the project needs an explicit policy for keeping SQL and Java demand calculations aligned. | Backend tech lead / repository owner |
| 2 | high | architecture | Decide whether the canonical package convention is the agent-defined `model/` + `dto/request\|response/` structure or the current `entity/` + flat `dto/` structure. If the current structure is intentional, update the architecture standard to prevent false-positive reviews. | Lead architect / backend tech lead |
| 3 | normal | architecture | Choose the intended home for native SQL gateway implementations (`repository/` vs a dedicated infrastructure package) so future database-specific code does not accumulate inside `service/`. | Backend tech lead |
| 4 | normal | ddd-domain | The backend sandbox only exposed backend/AGENTS.md; referenced parent design docs and Java AGENTS instructions were outside the readable workspace. This review therefore relies on the supplied instructions and source evidence only. | Repository maintainer |
| 5 | high | api-endpoint | The backend design explicitly says GET /api/products/search records zero-hit searches, but REST endpoint review treats GET side effects as a high-risk convention violation. A product/API owner should decide whether to revise the API contract or document this as an intentional analytics exception. | Backend/API owner with frontend owner |
| 6 | normal | api-endpoint | Decide whether the frontend contract should keep the custom ApiErrorResponse shape or migrate to RFC 9457 ProblemDetail with extension fields. | Backend/API owner and frontend owner |
| 7 | high | async-concurrency | Decide whether the non-PostgreSQL zero-hit fallback is production-supported. If it is only for tests, remove it from runtime code or isolate it behind test configuration to eliminate monitor-based database I/O. | Backend tech lead |
| 8 | normal | async-concurrency | Confirm the release posture for Java 21 virtual threads. Enabling them is recommended, but should be sequenced after removing synchronized-over-I/O pinning hazards. | Backend tech lead |
| 9 | high | error-logging | Decide whether the public API contract must remain the existing custom ApiErrorResponse shape for frontend compatibility or should migrate to ProblemDetail as required by the review standard. If it remains custom, document this as an intentional standard deviation and add equivalent RFC7807 fields. | Backend owner and frontend/API contract owner |
| 10 | normal | error-logging | Decide the production log shipping target before selecting JSON Logback fields and any Micrometer registry, especially whether metrics should be exposed as /actuator/metrics or /actuator/prometheus and how those endpoints are protected. | Platform/operations owner |
| 11 | high | data-access | Decide whether the project-wide UUID convention in the agent definition is mandatory for this repository, because changing UUID entity IDs to String IDs affects repositories, migrations, seeds, tests, and API DTO mapping. | Backend maintainer / architecture owner |
| 12 | normal | data-access | Decide whether local/docker datasource defaults are acceptable only for development profiles. If yes, split them from runtime defaults so production cannot silently start with demo database settings. | Backend maintainer / DevOps owner |
| 13 | highest | config-di | Decide whether the Docker profile is allowed to ship with known default database credentials. Reviewer recommendation: remove the password fallback before OSS publication. | Backend owner / security owner |
| 14 | high | config-di | Decide the intended production deployment model for TLS termination and production logging, then encode it in `application-prod.yml` and deployment docs. | Backend owner / platform owner |
| 15 | high | security | Decide whether `application-docker.yml` is intended only for local smoke demos or production-like deployment. If production-like, the default database password must be removed before release. | Backend owner / release owner |
| 16 | normal | security | Confirm the intended deployment topology for forwarded headers. If a reverse proxy is used, define the trusted proxy list and source-IP extraction contract. | Platform/operations owner |
| 17 | normal | dependency | The project artifact and Dockerfile still use `0.0.1-SNAPSHOT` (`pom.xml` line 13, `Dockerfile` line 13). This is not a dependency/plugin/repository SNAPSHOT finding, but a release owner should decide whether the current branch is intended to produce production/OSS release artifacts. | Release owner |
| 18 | normal | performance | Decide whether the product catalog is expected to grow beyond demo scale. If yes, prioritize full-text/trigram search and projection work before public OSS release benchmarks. | Backend technical lead |
| 19 | normal | resilience | Decide whether the AI provider is operationally critical enough to fail readiness. The current product behavior has fallback/error responses, so readiness could either remain UP with a degraded component indicator or turn DOWN when live AI is required by deployment policy. | Product owner and SRE/operations lead |


## Conflict Resolution Record
| # | Agent A | Agent B | Conflict Description | Tech-Lead Adjudication | Rationale |
|---:|---|---|---|---|---|
|  |  |  |  |  |  |

## Design Document Cross-Reference Results
1. tech-lead: ../docs/agents/java/AGENTS.md and ../spec-design/backend-design.md - A data-access class annotated @Repository is located in the service package, weakening the Controller -> Service -> Repository layer separation. (src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java)
2. api-endpoint: spec-design/backend-design.md §5.2 Authentication API - The implementation exposes POST /api/auth/logout and SecurityConfig protects it, but the backend endpoint table lists only POST /api/auth/login and GET /api/auth/me. This may be intentional, but the public API contract should include it if it remains supported. (src/main/java/com/skishop/controller/AuthController.java)
3. config-di: AGENTS.md / DI-Configuration-Security review standard - Required common/dev/prod profile separation is not represented in backend resources. (src/main/resources)
4. config-di: AGENTS.md / SecurityFilterChain order - SecurityFilterChain DSL order places CSRF before CORS and omits the required explicit headers block. (src/main/java/com/skishop/config/SecurityConfig.java)

## Incomplete Reviews
No incomplete reviews.

## Codex SDK Execution Summary
| Agent | Thread ID | Duration | Input Tokens | Cached Input Tokens | Output Tokens | Reasoning Tokens |
|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e93f6-ae09-75d3-99bb-33871f41f478 | 192040 | 805069 | 720384 | 9932 | 4573 |
| architecture | 019e93f6-adf9-7c73-ab96-a5b747e03874 | 167627 | 377501 | 316928 | 9071 | 4527 |
| ddd-domain | 019e93f6-ae2b-7262-af03-216f7f50c80c | 128572 | 284108 | 193536 | 6725 | 2414 |
| api-endpoint | 019e93f6-ae22-7bf3-9e2a-de1590f33828 | 174621 | 276608 | 210432 | 7990 | 3400 |
| java-standards | 019e93f6-ae37-78e1-b940-e13cbfe49761 | 279049 | 1281712 | 1192448 | 14342 | 6249 |
| async-concurrency | 019e93f6-ae22-7af0-bf10-a5dec4787e49 | 137745 | 295647 | 241152 | 7696 | 2696 |
| error-logging | 019e93f6-ae37-7223-a5ae-f6d79758d3c9 | 144787 | 271074 | 216576 | 7566 | 2472 |
| data-access | 019e93f8-a2db-7f53-9db7-944601e9e7ec | 124659 | 263654 | 206336 | 7302 | 2402 |
| config-di | 019e93f8-c6b1-7251-8bd8-9f49351deab0 | 151882 | 317920 | 265216 | 9130 | 3693 |
| security | 019e93f8-e242-71d2-8426-2bf3dfd578b3 | 178010 | 426253 | 368128 | 11021 | 3641 |
| dependency | 019e93f9-3b72-7071-bb36-260b4e8f3c71 | 106735 | 67710 | 57344 | 5793 | 3337 |
| test-quality | 019e93f9-56c3-71d2-ab99-a36ee33b5685 | 135942 | 469939 | 335872 | 7676 | 2222 |
| performance | 019e93f9-9acf-7932-8aaf-7021113e0c00 | 173619 | 323008 | 236032 | 9715 | 4081 |
| resilience | 019e93fa-89df-76e2-b918-b679e79c66fb | 110379 | 189874 | 168960 | 6586 | 2343 |


## Individual Agent Detail Reports
### tech-lead

- Status: completed
- Verdict: fail
- Summary: Tech-lead review found one zero-tolerance prohibited-pattern violation and three maintainability/consistency risks. API layering is broadly sound, but the Optional.get usage must be removed before this passes the agent’s prohibited-pattern checklist.

# Source Code Review Report: Tech Lead

## Summary
- **Review Target**: backend full target
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 0 / Medium: 3 / Low: 0
- **Verification**: Static/read-only review only. Tests were not run because this task was a review-only pass in a read-only sandbox.

## Prohibited Pattern Check Results
| # | Prohibited Pattern | Detection Count | Target File | Line |
|---|---|---:|---|---|
| 1 | System.out/System.err print | 0 | - | - |
| 2 | Empty catch swallowing Exception | 0 | - | - |
| 3 | Hardcoded Java secret string literal | 0 | - | - |
| 4 | String-concatenated SQL | 0 | - | - |
| 5 | Direct new Service/Repository in production code | 0 | - | - |
| 6 | @Autowired field injection | 0 | - | - |
| 7 | Optional.get() | 2 | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 64, 66 |
| 8 | PII in logs | 0 observed | - | - |
| 9 | java.util.Date usage | 0 | - | - |
| 10 | Controller -> Repository direct reference | 0 | - | - |
| 11 | @Transactional on Controller | 0 | - | - |

## Design Document Alignment
| Design Document | Alignment Status | Deviation Details |
|---|---|---|
| AGENTS.md / Java AGENTS.md | ⚠️ Warning | Optional.get() violates the prohibited-pattern checklist; repository adapter is packaged under service. |
| spec-design/backend-design.md | ⚠️ Warning | Endpoints, DTOs, security policy, Flyway schema, and Controller -> Service -> Repository flow mostly align. Persistence gateway packaging and duplicated zero-hit policy rules need cleanup. |
| spec-design/front-design.md | ✅ Pass | Backend DTOs expose frontend-friendly camelCase contracts and protected admin APIs. |
| docs/migration/DESIGN.md / PLAN.md | Not available | These files were not present in the reviewed accessible paths; no claims made against them. |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | Critical | Prohibited Pattern | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 64 | Optional.get() is used twice in production auth code. | Use `AdminUserDto adminUser = user.orElseThrow();` once after validation, then use `adminUser`. |
| 2 | Medium | Code Consistency | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 50 | Zero-hit priority/loss rules are duplicated in SQL, domain, and entity code. | Centralize Java rules and add a SQL-vs-Java contract test if native upsert remains. |
| 3 | Medium | Layering | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1 | A @Repository JDBC adapter lives in the service package. | Move to repository/infrastructure.persistence and inject as a persistence gateway. |
| 4 | Medium | Quality Gate | pom.xml | 114 | JaCoCo reports coverage but does not enforce the 80% line/branch target. | Add `jacoco:check` with LINE and BRANCH minimums of 0.80. |

## Inter-Agent Conflict Arbitration
No inter-agent conflict inputs were provided.

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Prohibited Pattern Compliance | 2/5 | One Critical Optional.get() production violation. |
| Design Document Alignment | 4/5 | API/security/schema align; one layer packaging deviation. |
| Code Consistency | 3/5 | Zero-hit rules are duplicated across layers. |
| Naming Convention Compliance | 5/5 | Class, method, constant, DTO naming is consistent. |
| **Overall Score** | **14/20** | Fails until Critical item is fixed. |

## Escalation Items
- Decide whether to keep the PostgreSQL-native upsert. It improves concurrency but must be paired with an explicit SQL/Java rule-alignment strategy.

### architecture

- Status: completed
- Verdict: fail
- Summary: No Critical controller/service/repository dependency reversal was found, but the backend does not pass architecture review because repository infrastructure is placed inside the service package and required package boundaries are drifting.

# Source Code Review Report: Architecture Review

## Summary
- **Review Target**: full backend module
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 2 / Medium: 3 / Low: 0

## Layer Dependency Direction Check
| Package | Dependency Violation | Details |
|---|---|---|
| controller | None critical found | Controllers depend on service/use-case interfaces, not repositories. |
| service | Warning | Normal services depend on repositories as expected, but `ZeroHitAtomicUpsertGateway` is a `@Repository` class placed under `service/`. |
| repository | None found | Repository interfaces extend Spring Data JPA and do not import service/controller packages. |
| dto | Boundary warning | `ZeroHitItemDto` exposes `com.skishop.entity.Priority`. |

## Project Structure Check
| Package | Structure Compliance | Missing/Misplaced Packages |
|---|---|---|
| controller/service/repository/config/exception | Mostly compliant | Required packages exist. |
| model/entity | Non-compliant against agent checklist | JPA entities are under `entity/`; expected `model/`. |
| dto | Partially compliant | DTOs are flat under `dto/`; expected `dto/request/` and `dto/response/`. |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---|---|---|---:|---|---|
| 1 | High | Project Structure / Layer Boundary | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 1 | Repository/JDBC infrastructure is implemented inside `service/`. | Move implementation to `repository/` or infrastructure package. |
| 2 | High | Project Structure | `src/main/java/com/skishop/entity/Product.java` | 1 | JPA entities use `entity/` and DTOs are flat despite expected package split. | Move to `model/`, `dto/request/`, `dto/response/` or update the standard. |
| 3 | Medium | DTO Boundary | `src/main/java/com/skishop/dto/ZeroHitItemDto.java` | 3 | Response DTO imports entity-package enum. | Map to DTO-owned enum/string or move enum to a neutral domain package. |
| 4 | Medium | Spring Boot Configuration | `src/main/resources/application.yml` | 13 | Dev/prod profile separation is incomplete. | Add explicit `application-dev.yml` and `application-prod.yml`. |
| 5 | Medium | Separation of Concerns | `src/main/java/com/skishop/controller/AuthController.java` | 60 | Source-IP parsing for auth/rate-limit context is embedded in controller. | Centralize in filter/resolver/request-context component. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Layer Dependency Direction | 4/5 | No critical reverse imports, but repository infrastructure is misplaced. |
| Project Structure | 2/5 | Required `model/` and DTO subpackage split are absent. |
| Module Boundary Enforcement | 3/5 | DTO/entity enum coupling remains. |
| Spring Boot Configuration | 4/5 | Security config exists; profile separation needs tightening. |
| Separation of Concerns | 4/5 | Mostly clean; auth metadata extraction should move out of controller. |
| **Total Score** | **18/25** | Static architecture review only; no tests were run. |

## Escalation Items (Requires Human Judgment)
- Confirm whether the canonical package convention is `model/` + `dto/request|response/` or the current `entity/` + flat `dto/` layout.
- Decide where database-specific gateway implementations belong so native SQL does not accumulate in `service/`.

### ddd-domain

- Status: completed
- Verdict: fail
- Summary: DDD domain review failed due to high-severity domain modeling issues: inter-aggregate coordination is implemented as direct service calls instead of domain events, PostgreSQL upsert bypasses the ZeroHitSearch aggregate and duplicates business rules in SQL, monetary concepts are primitive BigDecimal fields rather than value objects, and Product invariants are not enforced in the entity constructor.

# Source Code Review Report: DDD Domain Review

## Summary
- **Review Target**: full backend source
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 4 / Medium: 0 / Low: 0

## Aggregate Root Boundary Check
| Service | Aggregate Root | Boundary Compliance | Violation Details |
|---|---|---|---|
| ProductSearchService | Product, ZeroHitSearch | ⚠️ Partial | Direct service-to-service coordination records ZeroHitSearch from Product search without a domain event. |
| ZeroHitRecordingService | ZeroHitSearch | ⚠️ Partial | JPA fallback uses aggregate methods, but PostgreSQL path bypasses them. |
| ProductQueryService | Product | ✅ Read-only | Query-only usage; no mutation observed. |
| ZeroHitQueryService | ZeroHitSearch | ✅ Read-only | Query-only usage; no mutation observed. |

## Value Object Check
| Target | Immutability | Record Usage | Validation | @Embeddable |
|---|---|---|---|---|
| ZeroHitDemandSignals | ✅ | ✅ | ✅ | N/A, not persisted |
| Product.price | ⚠️ BigDecimal primitive | ❌ | ⚠️ DB/entity partial | ❌ |
| ZeroHitSearch.estimatedOpportunityLoss | ⚠️ BigDecimal primitive | ❌ | ⚠️ DB/entity partial | ❌ |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|---|---|---|---|---|---|
| 1 | High | Domain Event Design | src/main/java/com/skishop/service/ProductSearchService.java | 24 | ProductSearchService injects ZeroHitRecordingService and calls it directly at lines 63-64; no ApplicationEventPublisher/EventListener exists. | Publish ProductSearchReturnedZeroResultsEvent and handle ZeroHit recording in an event listener. |
| 2 | High | Domain Logic Encapsulation | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25 | UPSERT_SQL directly mutates hit_count, priority, and opportunity loss, bypassing ZeroHitSearch.firstHit/recordRepeat and duplicating domain thresholds. | Use locking/retry around aggregate methods, or centralize and prove SQL/domain invariant equivalence. |
| 3 | High | Value Object Implementation | src/main/java/com/skishop/entity/Product.java | 40 | Money-like concepts are raw BigDecimal fields instead of immutable value objects. | Add Money value object and embed it in Product and ZeroHitSearch. |
| 4 | High | Domain Invariants | src/main/java/com/skishop/entity/Product.java | 73 | Product constructor only checks nulls, allowing blank text and negative prices into the aggregate. | Validate non-blank fields and non-negative price in the Product aggregate/factory. |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|---|---:|---|
| Aggregate Root Boundary | 3/5 | No child repositories or JPA aggregate references found, but one use case directly coordinates another aggregate workflow. |
| Value Object Implementation | 2/5 | Records are used for DTO-like signals, but persisted monetary values are primitive BigDecimal fields. |
| Domain Event Design | 1/5 | No domain event infrastructure found for inter-aggregate coordination. |
| Repository Pattern | 3/5 | Spring Data repositories are aggregate-specific, but a JDBC @Repository contains business rule SQL. |
| Domain Logic Encapsulation | 3/5 | ZeroHitSearch has behavior and invariants; PostgreSQL upsert and Product creation weaken encapsulation. |
| Ubiquitous Language | 4/5 | Names mostly match Zero Hit Radar/Product terms. |
| **Total Score** | **16/30** | |

## Escalation Items (Requires Human Judgment)
- Parent design references were not readable from the backend-only sandbox; confirm whether product catalog is intentionally anemic/read-only for MVP admin scope.


### api-endpoint

- Status: completed
- Verdict: fail
- Summary: API endpoint review found no legacy .do mappings and the implemented /api endpoints mostly match the REST design, but there are high-impact issues around GET side effects, trusted forwarded IP handling on login, and non-RFC9457 error payloads.

# Source Code Review Report: API Endpoint Review

## Summary
- **Review Target**: full backend endpoint surface
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 3 / Medium: 2 / Low: 0
- **Note**: The project design references define a Spring Boot REST API under `/api`, so `@RestController` usage is treated as compliant for this repository despite the generic Thymeleaf note in the agent definition.

## Endpoint List and Compliance
| Endpoint | HTTP Method | Separation | Validation | Authorization | @AuthenticationPrincipal |
|----------|-------------|------------|------------|---------------|--------------------------|
| `/api/products` | GET | `@RestController`, thin | Query params bounded | Public | N/A |
| `/api/products/search` | GET | `@RestController`, thin | Query params bounded | Public | N/A |
| `/api/auth/login` | POST | `@RestController`, thin | `@Valid @RequestBody`, missing size bounds | Public | N/A |
| `/api/auth/me` | GET | `@RestController`, thin | No request input | Authenticated | Uses `Authentication` |
| `/api/auth/logout` | POST | `@RestController`, thin | No request body | Authenticated | Uses `Authentication` |
| `/api/admin/zero-hits` | GET | `@RestController`, thin | Query params bounded | `ROLE_ADMIN` | Not needed for current single-admin data |
| `/api/admin/ai-consult` | POST | `@RestController`, thin | `@Valid @RequestBody` | `ROLE_ADMIN` | Not needed for current single-admin data |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|----------|----------|-------------|------|-------------------|-------------|
| 1 | High | HTTP method / REST convention | `src/main/java/com/skishop/controller/ProductController.java` | 51 | GET search records zero-hit rows through the service, so safe GET requests mutate analytics state. | Keep GET read-only and add a POST event-recording endpoint. |
| 2 | High | Input validation / auth boundary | `src/main/java/com/skishop/controller/AuthController.java` | 60 | Login rate limiting trusts spoofable forwarded IP headers. | Honor forwarded headers only behind trusted proxy config, otherwise use `getRemoteAddr()`. |
| 3 | Medium | Input validation | `src/main/java/com/skishop/dto/LoginRequest.java` | 11 | Login credentials are `@NotBlank` only and lack max length. | Add `@Size` bounds, and `@Email` if username is email. |
| 4 | High | Error response design | `src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 37 | Error responses use custom `ApiErrorResponse`, not RFC 9457 `ProblemDetail`. | Return `ProblemDetail` with extension properties for `code` and `errors`. |
| 5 | Medium | Controller mapping convention | `src/main/java/com/skishop/controller/AdminZeroHitController.java` | 19 | Admin controllers use full method paths instead of class-level `/api/admin` base mappings. | Add class-level `@RequestMapping("/api/admin")`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Spring MVC Controller Pattern | 4/5 | REST controllers match backend design; admin base mappings need cleanup. |
| REST Convention Compliance | 3/5 | No `.do`; endpoint table mostly matches, but GET search has side effects. |
| Input Validation | 3/5 | Most params are bounded; login DTO and forwarded IP handling need tightening. |
| Error Response | 3/5 | Sanitized and consistent, but not ProblemDetail/RFC 9457. |
| Parameter Binding | 4/5 | Mostly explicit Spring binding; current admin endpoints do not require ownership parameters. |
| **Total Score** | **17/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether to revise the search/zero-hit API contract because the design currently requires a GET side effect.
- Decide whether to preserve custom frontend error JSON or migrate to RFC 9457 `ProblemDetail`.

### java-standards

- Status: completed
- Verdict: fail
- Summary: Static Java 21/Spring Boot coding-standards review completed for the full backend target. No Critical prohibited patterns were confirmed, but mandatory High-severity DI and null-safety standard violations remain.

# Source Code Review Report: Java 21 Coding Standards Review

## Summary
- **Review Target**: full backend source target
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 5 / Medium: 1 / Low: 0

## Prohibited Pattern Detection Results
| # | Pattern | Count | Target File | Line # |
|---|---------|-------|-------------|--------|
| - | Confirmed prohibited patterns | 0 | - | - |

Constructor-level `@Autowired` annotations were observed in tests, but no field injection was confirmed.

## Incomplete / Shortcut Implementation Detection Results
| # | Type | Detection | Target File | Line # | Details |
|---|------|-----------|-------------|--------|---------|
| - | TODO/FIXME/UnsupportedOperationException/Mock-Fake-Stub-Dummy leakage | 0 | - | - | No confirmed incomplete implementation pattern in target Java production code. |

## Naming Convention Check Results
| File | Violation Location | Current Name | Recommended Name |
|------|-------------------|--------------|------------------|
| - | - | - | No confirmed naming convention violations. |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|----------|----------|-------------|--------|-------------------|-------------|
| 1 | High | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 22 | Spring service has no corresponding interface. | Add `ZeroHitRecordingUseCase` and inject it. |
| 2 | High | DI Pattern Quality | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 20 | Custom `@Repository` bean has no corresponding interface. | Add `ZeroHitUpsertGateway` and inject it. |
| 3 | High | Null Safety | src/main/java/com/skishop/repository/ProductRepository.java | 29 | Query parameter supports null but is not annotated `@Nullable`. | Add `@Nullable` to nullable `category` params. |
| 4 | High | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19 | Public method accepts null but parameter is unannotated. | Use `normalize(@Nullable String keyword)`. |
| 5 | High | Null Safety | src/main/java/com/skishop/domain/OpportunityLossCalculator.java | 21 | Null `averageProductPrice` is accepted but unannotated. | Add `@Nullable` or reject null explicitly. |
| 6 | Medium | Null Safety | src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | 56 | `Optional.get()` is used twice after an emptiness check. | Extract with `orElseThrow()` once. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Naming Conventions | 5/5 | No confirmed class, method, package, enum, or constant naming violations. |
| Java 21 Feature Adoption | 4/5 | DTOs use records, switch expressions and text blocks are present. |
| Prohibited Pattern Compliance | 5/5 | No confirmed Critical prohibited pattern. |
| DI Pattern Quality | 3/5 | Service/repository interface segregation violations remain. |
| Null Safety | 2/5 | Several accepted-null contracts are not type-visible. |
| **Total Score** | **17/25** | |

## Escalation Items (Requires Human Judgment)
None.

### async-concurrency

- Status: completed
- Verdict: fail
- Summary: Async/concurrency review found blocking and shared-state risks: synchronized database I/O, missing Java 21 virtual-thread enablement, transaction scope held across external AI I/O, and non-atomic in-memory auth invariants.

# Source Code Review Report: Async Processing & Concurrency Control Review

## Summary
- **Review Target**: full backend source
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 4 / Medium: 0 / Low: 0

## Virtual Thread Compatibility Matrix
| Class / Method | synchronized over I/O | ThreadLocal risk | ReentrantLock used | Verdict |
|---|---:|---:|---:|---|
| `ZeroHitRecordingService.recordWithJpaFallback` | Yes, JPA repository calls inside monitor | None found | No | ❌ Fail |
| `ZeroHitAtomicUpsertGateway.supportsAtomicUpsert` | Yes, JDBC metadata lookup inside monitor | None found | No | ❌ Fail |
| Application runtime config | N/A | None found | N/A | ⚠️ `spring.threads.virtual.enabled=true` missing |

## Blocking Call Detection Results
| # | Pattern | File | Line # | Context |
|---|---|---|---:|---|
| 1 | Blocking DB I/O inside `synchronized` | `src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 86 | Repository find/save happens while holding `fallbackUpsertLock`. |
| 2 | Blocking JDBC metadata I/O inside `synchronized` | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 81 | `databaseProductName()` opens a connection under monitor. |
| 3 | Blocking external provider call inside transaction | `src/main/java/com/skishop/service/AiConsultationService.java` | 42 | `@Transactional(readOnly = true)` spans DB reads and `aiProviderClient.generate(...)`. |

No production `CompletableFuture.get()`, `.join()`, `Future.get()`, `Thread.sleep()`, `@Async`, or `@Scheduled` usages were found in `src/main/java`.

## @Scheduled / Background Task Quality Check
| Task Name | Exception Handling | Graceful Shutdown | Thread Pool Config | Backoff | Verdict |
|---|---|---|---|---|---|
| N/A | No `@Scheduled` tasks found | N/A | N/A | N/A | ✅ Pass |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---:|---|---|---|---:|---|---|
| 1 | Critical | Virtual Thread / Monitor Pinning | `src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 86 | JPA read/update/insert executes inside `synchronized (fallbackUpsertLock)`. | Replace monitor fallback with DB atomic upsert or unique-constraint retry; do not hold a JVM monitor across JDBC/JPA I/O. |
| 2 | Critical | Virtual Thread / Monitor Pinning | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 81 | JDBC connection/metadata lookup occurs under `synchronized (this)`. | Eagerly initialize at startup or use `ReentrantLock` without blocking JDBC inside a monitor. |
| 3 | High | Virtual Thread Adoption | `src/main/resources/application.yml` | 1 | `spring.threads.virtual.enabled=true` is absent from runtime config. | Add virtual-thread config after pinning risks are removed. |
| 4 | High | Transaction / Blocking I/O | `src/main/java/com/skishop/service/AiConsultationService.java` | 42 | External AI call is made before read-only transaction exits. | Fetch prompt context in a small read-only transaction, then call AI outside the transaction. |
| 5 | High | Thread Safety | `src/main/java/com/skishop/service/AdminAuthService.java` | 125 | Max active token invariant uses non-atomic count/remove/put sequence. | Lock or compute the whole enforce-and-insert operation atomically. |
| 6 | High | Thread Safety | `src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java` | 31 | Rate-limit allow check and failure recording are split, allowing concurrent burst bypass. | Combine allow decision and state mutation in one `compute()` operation. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Virtual Thread Adoption | 1/5 | Java 21 is configured, but virtual threads are not enabled and monitor pinning hazards exist. |
| Blocking Call Absence | 2/5 | No future blocking or sleeps in main code, but DB/provider blocking occurs in unsafe scopes. |
| CompletableFuture / @Async Correctness | 5/5 | No production `@Async`/`CompletableFuture` patterns found. |
| @Scheduled / Background Task Quality | 5/5 | No scheduled/background tasks found. |
| Thread Safety | 2/5 | ConcurrentHashMap is used, but compound auth/limiter invariants are not atomic. |
| **Total Score** | **15/25** | Fails because of Critical monitor-over-I/O findings. |

## Escalation Items (Requires Human Judgment)
- Decide whether the non-PostgreSQL zero-hit fallback is production-supported. If it is test-only, remove it from runtime code or isolate it behind test configuration.
- Confirm the rollout sequence for Java 21 virtual threads. Enablement should follow removal of synchronized-over-I/O pinning hazards.


### error-logging

- Status: completed
- Verdict: fail
- Summary: Exception handling avoids empty catches and client stack-trace disclosure, and log statements generally use SLF4J placeholders without obvious PII. The review fails because key production observability controls are missing: no correlation ID/MDC propagation, no RFC7807 ProblemDetail error contract, missing throwable logging for handled failures, and no JSON Logback/logstash configuration.

# Source Code Review Report: Exception Handling & Logging Review

## Summary
- **Review Target**: backend full source review
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 5 / Medium: 1 / Low: 0

## Exception Handling Check Results
| File | Swallowing | throw e; | Logging in catch | Verdict |
|------|-----------|----------|------------------|---------|
| src/main/java/com/skishop/service/SpringAiProviderClient.java | No | No | Propagates with cause | Pass |
| src/main/java/com/skishop/service/AiConsultationService.java | No | No | Missing throwable in catch log | Fail |
| src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | No | No | Propagates with cause | Pass |
| src/main/java/com/skishop/service/ZeroHitKeywordLogFields.java | No | No | Propagates with cause | Pass |
| src/main/java/com/skishop/exception/GlobalExceptionHandler.java | No | No | Unexpected handler omits Throwable | Fail |

## PII Logging Detection Results
| # | File | Line Number | Detected PII Item | Suggested Fix |
|---|------|-------------|-------------------|---------------|
| - | - | - | No direct PII logging found in reviewed log statements | Keep excluding passwords, bearer tokens, prompts, and raw user keywords from logs |

## Structured Logging Quality Check
| File | Placeholder Format | String Concatenation | System.out.println | Verdict |
|------|--------------------|---------------------|--------------------|---------|
| src/main/java/com/skishop/config/RequestLoggingFilter.java | Yes | No | No | Warning: no correlationId |
| src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | Yes | No | No | Pass |
| src/main/java/com/skishop/config/SecurityConfig.java | Yes | No | No | Pass |
| src/main/java/com/skishop/service/AiConsultationService.java | Yes | No | No | Fail: caught exception not logged |
| src/main/java/com/skishop/service/ZeroHitRecordingService.java | Yes | No | No | Pass |
| src/main/java/com/skishop/exception/GlobalExceptionHandler.java | Yes | No | No | Fail: Throwable omitted |

## Correlation ID (MDC) Implementation Status
| Module | Filter/Interceptor | Response Header | MDC Logging | MDC Cleanup |
|--------|-------------------|-----------------|-------------|-------------|
| backend | Missing | Missing | Missing | Missing |

## Findings
| # | Severity | Category | Target File | Line Number | Finding | Suggested Fix Code |
|---|----------|----------|-------------|-------------|---------|-------------------|
| 1 | High | Correlation ID (MDC) | src/main/java/com/skishop/config/RequestLoggingFilter.java | 25 | No X-Correlation-Id/MDC flow exists | Add OncePerRequestFilter with MDC.put("correlationId", id), response.setHeader("X-Correlation-Id", id), and MDC.clear() in finally |
| 2 | High | Error Response Contract | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37 | Error responses use custom ApiErrorResponse, not ProblemDetail | Return ProblemDetail and set code/path/errors as properties |
| 3 | High | Exception Logging | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 121 | Catch-all handler logs exception class but not stack trace | LOGGER.error("Unexpected API error path={} type={}", path, type, exception); |
| 4 | High | Exception Logging | src/main/java/com/skishop/service/AiConsultationService.java | 57 | AI provider exception is handled without logging throwable | LOGGER.warn("ai_consultation providerStatus={} errorType={}", status, exception.getClass().getName(), exception); |
| 5 | High | Structured Logging Configuration | pom.xml | 45 | No logstash-logback-encoder dependency or logback-spring.xml | Add JSON Logback config including correlationId/trace/span fields |
| 6 | Medium | Observability Integration | src/main/resources/application.yml | 48 | Actuator exposes health only; metrics endpoint is not enabled | Expose metrics/prometheus behind appropriate controls |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Exception Handling | 3/5 | No empty catches; global handler exists; stack traces are lost for key handled paths; not ProblemDetail |
| Structured Logging Quality | 3/5 | Placeholder logging is good; no println; production JSON logging missing |
| PII Logging Compliance | 5/5 | No direct password/token/email/raw keyword logging found; zero-hit keyword is hashed |
| Correlation ID (MDC) | 1/5 | No implementation found |
| Observability Integration | 3/5 | Actuator dependency and health exist; metrics/log JSON/tracing are incomplete |
| **Overall Score** | **15/25** | |

## Escalation Items (Requires Human Judgment)
- API contract owner should decide whether to migrate the frontend-facing error schema to ProblemDetail or formally document a deviation.
- Platform/operations owner should decide the metrics endpoint and log shipping format before production release.

### data-access

- Status: completed
- Verdict: fail
- Summary: Data access review found several policy violations in entity mapping and persistence configuration. There are no N+1 risks because the model has no associations, and Flyway naming/schema coverage is mostly sound, but JDBC timestamp usage, hardcoded datasource fallbacks, implicit column mappings, and missing optimistic locking need correction for the stated standards.

# Source Code Review Report: Data Access Layer Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 3 / Medium: 2 / Low: 0

## Entity Design Check
| Entity | @Table | @Column Coverage | java.time Usage | Collection Init | @Version | Verdict |
|--------|--------|-----------------|-----------------|-----------------|----------|---------|
| Product | ✅ products | ⚠️ names omitted on several fields | ✅ Instant | N/A | N/A / read-mostly | ⚠️ |
| ZeroHitSearch | ✅ zero_hit_searches | ⚠️ names omitted on id/keyword/priority | ✅ Instant | N/A | ❌ missing | ⚠️ |

## Query Quality Check
| File | Method | readOnly TX | N+1 Risk | DTO Projection | Pagination | Verdict |
|------|--------|------------|----------|----------------|------------|---------|
| ProductQueryService | listProducts | ✅ | ✅ none observed | ⚠️ maps entities | ✅ bounded Pageable | ⚠️ |
| ProductSearchService | search | N/A writes conditionally | ✅ none observed | ⚠️ maps entities | ✅ bounded Pageable | ⚠️ |
| ZeroHitQueryService | listZeroHits | ✅ | ✅ none observed | ⚠️ maps entities | ✅ bounded Pageable | ⚠️ |
| AiConsultationService | consult | ✅ | ✅ none observed | ✅ scalar lists | N/A | ✅ |

## Transaction Management Check
| File | Method | @Transactional | Rollback Rule | Event Publishing | Verdict |
|------|--------|---------------|---------------|------------------|---------|
| ProductQueryService | listProducts | ✅ readOnly | N/A | N/A | ✅ |
| ProductSearchService | search | ✅ | default runtime rollback | N/A | ✅ |
| ZeroHitRecordingService | record | ⚠️ TransactionTemplate only on fallback; atomic SQL relies on caller or single-statement atomicity | default runtime rollback | N/A | ⚠️ |
| ZeroHitQueryService | listZeroHits | ✅ readOnly | N/A | N/A | ✅ |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|----------|----------|-------------|------|---------|-------------|
| 1 | Critical | Date/Time Mapping | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7 | java.sql.Timestamp is imported and used for searchedAt binding | Bind java.time Instant/OffsetDateTime directly and align DB type |
| 2 | Critical | JPA Configuration | src/main/resources/application.yml | 14 | Datasource has hardcoded JDBC fallback; docker profile also defaults URL and credentials | Require env vars at runtime; move defaults to local/dev profile only |
| 3 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 24 | IDs use UUID and entity/domain lifecycle generation instead of String UUID generated before persistence | Use String id length 36 and service-layer UUID.randomUUID().toString() |
| 4 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 25 | Several @Column annotations omit explicit snake_case name | Add name to every @Column |
| 5 | High | Entity Design | src/main/java/com/skishop/entity/Product.java | 50 | Audit timestamps are set manually rather than @CreationTimestamp/@UpdateTimestamp | Add Hibernate timestamp annotations and remove manual lifecycle timestamp code |
| 6 | Medium | Optimistic Locking | src/main/java/com/skishop/entity/ZeroHitSearch.java | 33 | Mutable aggregate has no @Version | Add version column, migration, and conflict handling |
| 7 | Medium | Query Quality | src/main/java/com/skishop/service/ProductQueryService.java | 43 | Read-list paths fetch entities instead of DTO projections | Use interface projections or JPQL constructor expressions |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|----------------|-------------|-------|
| Entity Design | 2/5 | Tables exist, but ID convention, explicit columns, audit timestamp annotations, and versioning need work |
| Query Quality | 4/5 | Pagination and parameter binding are good; no N+1 observed; projections could improve list paths |
| Transaction Management | 4/5 | Read-only services are annotated; write path is mostly sound, with minor ambiguity around direct atomic upsert calls |
| Optimistic Locking | 2/5 | ZeroHitSearch concurrency is handled by PostgreSQL upsert, but no JPA version/fallback conflict handling |
| Flyway Migration | 4/5 | Migration naming is correct and schema largely matches entities; version column and timestamp type alignment remain |
| **Total Score** | **16/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether the String UUID primary-key convention is mandatory for this codebase, since changing it is a broad schema/API/test update.
- Decide whether datasource fallback values are allowed only in local/demo profiles, then split runtime config accordingly.

### config-di

- Status: completed
- Verdict: fail
- Summary: DI/config/security-chain review failed due to a hardcoded Docker datasource password fallback and mutable singleton authentication state. Additional high-risk gaps exist in explicit security headers and profile separation.

# Source Code Review Report: DI / Configuration / Security Filter Chain Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 3 / Medium: 1 / Low: 1

## Spring Security Filter Chain Check
| # | Expected Configuration | Actual Configuration | Verdict |
|---|----------------------|---------------------|---------|
| 1 | Global exception handler | `GlobalExceptionHandler` with `@RestControllerAdvice` | Pass |
| 2 | CORS before CSRF/authentication | `.cors(...)` exists but appears after `.csrf(...)` in DSL | Warning |
| 3 | CSRF configuration | Disabled for stateless bearer-token JSON API | Pass |
| 4 | Session management | `SessionCreationPolicy.STATELESS` | Pass |
| 5 | Request authorization | Public products/login, authenticated auth endpoints, admin role for `/api/admin/**` | Pass |
| 6 | Authentication provider / JWT filter | `BearerTokenAuthenticationFilter` before `UsernamePasswordAuthenticationFilter` | Pass |
| 7 | Security headers | No explicit `headers(...)` block | Fail |

## DI Registration Check
| Bean | Stereotype | Scope | Injection Method | Issue | Verdict |
|------|-----------|-------|-----------------|-------|---------|
| `SecurityConfig` | `@Configuration` | Singleton | Constructor | No field injection | Pass |
| `BearerTokenAuthenticationFilter` | `@Component` | Singleton | Constructor | No mutable shared state found | Pass |
| `AdminAuthService` | `@Service` | Singleton | Constructor | Mutable in-memory sessions; non-atomic token limit | Fail |
| `InMemoryLoginAttemptLimiter` | `@Service` | Singleton | Constructor | Uses concurrent map and per-key compute; acceptable for demo but in-memory | Pass |
| Repositories | Spring Data interfaces / `@Repository` gateway | Singleton | Constructor or auto-detected | JPA repositories extend `JpaRepository`; no manual registration issue found | Pass |

## application*.properties Secret Detection
| File | Detected Secret | Type | Remediation |
|------|----------------|------|-------------|
| `src/main/resources/application-docker.yml:5` | `${SPRING_DATASOURCE_PASSWORD:skishop}` | Hardcoded password fallback | Require `${SPRING_DATASOURCE_PASSWORD}` with no literal fallback |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | Critical | Secrets | `src/main/resources/application-docker.yml` | 5 | Known DB password fallback | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 2 | Critical | Singleton state | `src/main/java/com/skishop/service/AdminAuthService.java` | 41 | Mutable auth sessions with non-atomic token limit | Lock/serialize per user or use external session store |
| 3 | High | Security headers | `src/main/java/com/skishop/config/SecurityConfig.java` | 56 | Missing explicit `headers(...)` policy/CSP | Add `headers(headers -> ...)` |
| 4 | High | Filter chain order | `src/main/java/com/skishop/config/SecurityConfig.java` | 57 | CORS appears after CSRF in DSL | Put `.cors(...)` before `.csrf(...)` |
| 5 | High | Profiles | `src/main/resources` | N/A | No dev/prod profile files | Add `application-dev.yml` and `application-prod.yml` |
| 6 | Medium | Logging | `src/main/resources` | N/A | No `logback-spring.xml` | Add profile-specific structured logging |
| 7 | Low | Type-safe config | `src/main/java/com/skishop/config/AdminProperties.java` | 14 | `@ConfigurationProperties` lacks validation | Add `@Validated` and constraints |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| DI Registration Quality | 3/5 | Constructor injection is good; singleton auth state race remains |
| Security Filter Chain | 2/5 | Authz/auth filter present; missing headers and order mismatch |
| Application Properties Quality | 2/5 | Stacktrace disabled and OSIV false; Docker password fallback and no prod/dev profiles |
| Type-Safe Configuration | 4/5 | `@ConfigurationPropertiesScan` present; validation missing |
| Security Settings | 2/5 | CORS is explicit; no CSP/header policy, prod TLS/logging not represented |
| **Total Score** | **13/25** | Fail |

## Escalation Items (Requires Human Judgment)
- Confirm whether Docker defaults are intended only for local demo. Even for demo, the current password fallback should not ship as a runtime default.
- Define production deployment assumptions for HTTPS termination and production logging, then encode them in config/docs.

### security

- Status: completed
- Verdict: fail
- Summary: Security review found 2 Critical, 3 High, and 1 Medium findings. The highest-risk issues are a hardcoded Docker-profile database password default and a spoofable login rate-limit key based on untrusted forwarding headers.

# Source Code Review Report: Security Review

## Summary
- **Review Target**: `/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend` full backend target
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 3 / Medium: 1 / Low: 0

---

## Phase A: Implementation Compliance Check

### OWASP Top 10 Check Results
| # | Category | Findings | Count | Verdict |
|---|---|---:|---:|---|
| A01 | Broken Access Control | Default deny and `/api/admin/**` role checks exist, but login throttling is bypassable through spoofed forwarding headers. | 1 | ❌ |
| A02 | Cryptographic Failures | Docker profile has hardcoded default DB password. Password encoder is delegating BCrypt-capable. | 1 | ❌ |
| A03 | Injection | No unsafe SQL concatenation, command execution, unsafe deserialization, or user-controlled URL fetch found. Native/JDBC SQL uses constants and bound parameters. | 0 | ✅ |
| A07 | XSS | No server templates/JSP found, but CSP/referrer/permissions headers are missing as explicit defense-in-depth. | 1 | ⚠️ |
| A08 | Mass Assignment | Controllers bind request DTO records, not JPA entities. | 0 | ✅ |
| A10 | SSRF | No direct `RestTemplate`/`WebClient`/user-input URL fetch found in target code. | 0 | ✅ |

### Authentication/Authorization Check
| Endpoint | Auth Required | Role Restriction | IDOR Prevention | Verdict |
|---|---|---|---|---|
| `GET /actuator/health/**` | No | None | N/A | ✅ public health only; details disabled |
| `GET /api/products`, `/api/products/search` | No | None | N/A | ⚠️ search write-side effect lacks abuse throttling |
| `POST /api/auth/login` | No | None | N/A | ❌ limiter bypassable by spoofed `X-Forwarded-For` |
| `GET /api/auth/me`, `POST /api/auth/logout` | Yes | Authenticated | N/A | ✅ bearer token required |
| `/api/admin/**` | Yes | `hasRole("ADMIN")` | No per-object user data in current APIs | ✅ route-level protected |

### Hardcoded Secret Check
| File | Location | Secret Type | Remediation |
|---|---:|---|---|
| `src/main/resources/application-docker.yml` | line 5 | Default DB password `skishop` | Remove default and require env var |

### Security Header Check
| Header | Expected | Actual | Verdict |
|---|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Spring Security default likely active | ✅ medium confidence |
| `X-Frame-Options` | `DENY` | Spring Security default likely active | ✅ medium confidence |
| `Content-Security-Policy` | `default-src 'self'` | Not configured | ❌ |
| `Strict-Transport-Security` | enabled | Spring Security default only for secure requests; no explicit config | ⚠️ |
| `Server` | suppressed | No `server.server-header=` config found | ⚠️ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Not configured | ❌ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Not configured | ❌ |

### Struts Legacy Pattern Check
| Pattern | Files Found | Risk | Remediation |
|---|---:|---|---|
| Struts imports/actions/forms | 0 | None found | N/A |
| Direct `request.getParameter()` | 0 | None found | N/A |
| Field `@Autowired` | 0 | None found | N/A |
| Hidden-field security reliance | 0 | None found | N/A |

---

## Phase B: Attacker's Perspective Attack Resistance Analysis

### STRIDE Attack Resistance Summary
| STRIDE Category | Scenarios Verified | Sufficient | Insufficient | Unmitigated | Highest Risk |
|---|---:|---:|---:|---:|---|
| S: Spoofing | 4 | 2 | 1 | 1 | Critical |
| T: Tampering | 4 | 4 | 0 | 0 | Low |
| R: Repudiation | 3 | 2 | 1 | 0 | Medium |
| I: Information Disclosure | 5 | 4 | 1 | 0 | Medium |
| D: Denial of Service | 5 | 2 | 2 | 1 | High |
| E: Elevation of Privilege | 4 | 3 | 1 | 0 | Medium |

### Business Logic Attack Resistance
| # | Attack Scenario | Target Component | Defense Exists | Risk | Verdict |
|---|---|---|---|---|---|
| BL-1 | Zero-hit duplicate/race inflation | `ZeroHitAtomicUpsertGateway` | PostgreSQL atomic upsert; fallback synchronized in-process | Low | ✅ |
| BL-6 | Keyword guessing / radar pollution | public search | Length limits only; no write throttle | High | ❌ |
| BL-7 | Email bombing | N/A | No reset/email endpoint found | N/A | ✅ |

### Session Management Security
| # | Attack Scenario | Defense Exists | Risk | Verdict |
|---|---|---|---|---|
| SM-1 | Session fixation | Stateless bearer auth; no servlet login session | Low | ✅ N/A |
| SM-3 | Concurrent session abuse | Max 3 active admin tokens; oldest revoked | Medium | ⚠️ acceptable for MVP, not distributed |
| SM-5 | Insecure session cookie | No auth cookies; tokens returned in JSON | Depends on frontend storage | ⚠️ backend-only review cannot verify frontend storage |

### Attack Scenario Detailed Analysis
| # | Severity | STRIDE / BL / SM | Attack Scenario | Target File | Line # | Attack Method | Current Defense | Recommended Mitigation | Fix Code Example |
|---|---|---|---|---|---:|---|---|---|---|
| 1 | Critical | S / D | Credential stuffing bypass | `AuthController.java` | 60 | Send each login attempt with a new `X-Forwarded-For` value | Per username+source lockout | Trust forwarding headers only from known proxies and add username/global limits | `String ip = trustedProxy ? parsedForwarded : request.getRemoteAddr();` |
| 2 | Critical | A02 | Known DB credential | `application-docker.yml` | 5 | Deploy without env var and get `skishop` DB password | Env override possible | No default password; fail startup if absent | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 3 | High | D / BL | Radar DB flooding | `ProductSearchService.java` | 63 | Send many unique zero-result queries | Query length and limit validation | Add public search/write quotas and quality filters | `rateLimiter.check(clientKey);` before record |
| 4 | High | I / S | Missing browser hardening headers | `SecurityConfig.java` | 55 | Abuse missing CSP/referrer/permissions as defense gaps | Spring defaults only | Configure headers explicitly | `.headers(h -> h.contentSecurityPolicy(...))` |

---

## Consolidated Findings
| # | Severity | Phase | Category | Target File | Line # | Finding | Fix Code Example |
|---|---|---|---|---|---:|---|---|
| 1 | Critical | A/B | Secret Management | `src/main/resources/application-docker.yml` | 5 | Hardcoded default DB password | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 2 | Critical | A/B | Rate Limiting / Spoofing | `src/main/java/com/skishop/controller/AuthController.java` | 60 | Spoofable source IP bypasses login lockout | trusted proxy IP resolver + username/global limiter |
| 3 | High | B | DoS | `src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java` | 24 | Unbounded limiter map | bounded TTL cache |
| 4 | High | B | DoS / Business Logic | `src/main/java/com/skishop/service/ProductSearchService.java` | 63 | Public search can write unlimited distinct zero-hit rows | public endpoint write quota |
| 5 | High | A | Security Headers | `src/main/java/com/skishop/config/SecurityConfig.java` | 55 | CSP/referrer/permissions headers missing | explicit `.headers(...)` config |
| 6 | Medium | B | External Provider DoS | `src/main/java/com/skishop/service/SpringAiProviderClient.java` | 35 | No explicit AI timeout/bulkhead | timeout + concurrency guard |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Injection Prevention | 5/5 | Bound JPA/JDBC patterns; no command execution found |
| Authentication/Authorization | 3/5 | Route policy good; login limiter bypassable |
| Secret Management | 2/5 | Docker DB password default |
| Security Headers | 2/5 | CSP/referrer/permissions missing |
| CSRF Protection | 4/5 | Disabled, but API is stateless bearer with no credentialed CORS |
| Rate Limiting / DoS Defense | 2/5 | Login limiter exists but bypassable/unbounded; public search unthrottled |
| Spoofing Attack Resistance (S) | 3/5 | Bearer tokens strong; source IP trust issue |
| Tampering Attack Resistance (T) | 4/5 | DTO validation and server-side calculations present for current domain |
| Information Disclosure Resistance (I) | 4/5 | Error responses sanitized; header hardening incomplete |
| Privilege Escalation Resistance (E) | 4/5 | Admin routes protected; method-level security not present |
| Business Logic Attack Resistance | 4/5 | Atomic upsert good; public radar pollution remains |
| Session Management Security | 3/5 | Stateless tokens acceptable; frontend token storage not reviewed |
| Struts Legacy Pattern Safety | 5/5 | No Struts remnants found |
| **Total Score** | **45/65** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether Docker profile is production-like. If yes, remove default DB credentials before release.
- Confirm trusted reverse proxy topology before accepting any forwarded client-IP header.

### dependency

- Status: completed
- Verdict: fail
- Summary: Dependency-management review found no prohibited dependencies and no dependency/plugin/repository SNAPSHOT usage, but the POM has high-severity required-dependency and scope issues plus medium build metadata/version-management issues.

# Source Code Review Report: Dependency Management Review

## Summary
- **Review Target**: backend / `pom.xml`
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 2 / Medium: 2 / Low: 0

## Prohibited Dependency Detection Results
| # | Dependency (groupId:artifactId) | Detected pom.xml | Replacement | Severity |
|---|-------------------------------|-------------------|-------------|----------|
| - | None detected | - | - | - |

## SNAPSHOT Version Detection Results
| # | Dependency | Version | Detected pom.xml |
|---|-----------|---------|------------------|
| - | No dependency, plugin, or repository SNAPSHOT detected | - | - |

## Build Configuration Check
| pom.xml | Parent POM | Java Version | Encoding | Verdict |
|---------|-----------|--------------|----------|---------|
| `pom.xml` | `spring-boot-starter-parent` 3.2.12 | 21 | Missing build/reporting UTF-8 properties | ⚠️ Medium issue |

## Required Dependency Verification
| pom.xml | starter-web | starter-data-jpa | starter-security | flyway-core | actuator | Verdict |
|---------|-------------|------------------|------------------|-------------|----------|---------|
| `pom.xml` | Present | Present | Present | Present | Present | ❌ Missing required `logstash-logback-encoder`; H2 scope issue |

## Findings
| # | Severity | Category | Target pom.xml | Finding | Suggested Fix |
|---|----------|----------|----------------|---------|---------------|
| 1 | High | Required Dependency Verification | `pom.xml:45` | Required `net.logstash.logback:logstash-logback-encoder` is absent. | Add the dependency with a stable release version and configure Logback if structured logging is required. |
| 2 | High | Test Dependency Scope | `pom.xml:80` | `com.h2database:h2` is declared with runtime scope, although the checklist requires test-only dependencies to be test scoped. | Change H2 to `<scope>test</scope>` or isolate local runtime H2 usage in a dedicated profile. |
| 3 | Medium | Build Configuration | `pom.xml:29` | `project.build.sourceEncoding` and `project.reporting.outputEncoding` are missing. | Add both properties with `UTF-8`. |
| 4 | Medium | Version Management | `pom.xml:31` | Flyway version is locally overridden and `flyway-database-postgresql` has an explicit version instead of clean BOM inheritance. | Remove the override if Spring Boot manages the needed artifacts, or document and align the intentional override. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Prohibited Dependency Compliance | 5/5 | No prohibited dependencies detected. |
| SNAPSHOT Exclusion | 5/5 | No dependency/plugin/repository SNAPSHOT detected. Project artifact SNAPSHOT is escalated as a release decision. |
| Build Configuration | 4/5 | Parent and Java version are correct; encoding properties are missing. |
| Required Dependencies | 3/5 | Core backend dependencies are present, but required structured logging dependency is missing. |
| Version Consistency | 3/5 | Flyway version override should be removed or documented/aligned. |
| **Overall Score** | **20/25** | |

## Escalation Items (Requires Human Judgment)
- `pom.xml:13` and `Dockerfile:13` use `0.0.1-SNAPSHOT`. This is not a dependency SNAPSHOT finding, but release ownership should decide whether it is acceptable for the intended branch/artifact.

### test-quality

- Status: completed
- Verdict: fail
- Summary: Test suite has good breadth, but fails the requested test-quality standard due to suite-wide naming violations, weak AAA/act singularity in representative tests, missing coverage gates, and controller/service branch coverage gaps in the JaCoCo report.

# Source Code Review Report: Test Quality Review

## Summary
- **Review Target**: backend full test suite
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 4 / Medium: 3 / Low: 0

## Test Naming Check
| File | Violating Method | Current Name | Recommended Name |
|------|------------------|--------------|------------------|
| src/test/java/com/skishop/domain/ZeroHitDomainTests.java:18 | Yes | keywordNormalizerTrimsLowercasesAndCollapsesWhitespace | should_normalizeKeyword_when_keywordContainsWhitespaceAndUppercase |
| src/test/java/com/skishop/service/AdminAuthServiceTests.java:29 | Yes | validLoginIssuesDistinctTokenAndValidatesAdminUser | should_issueDistinctTokenAndValidateAdminUser_when_credentialsAreValid |
| src/test/java/com/skishop/controller/AuthApiIntegrationTests.java:55 | Yes | publicEndpointsRemainPublic | should_allowAccess_when_endpointIsPublic |

## AAA Pattern Check
| File | Method | Arrange Clear | Act Single | Assert Clear | Verdict |
|------|--------|---------------|------------|--------------|---------|
| src/test/java/com/skishop/service/AdminAuthServiceTests.java | validLoginIssuesDistinctTokenAndValidatesAdminUser | Partial | No | Partial | Fail |
| src/test/java/com/skishop/service/ProductRequestOptionsTests.java | toPageableUsesDefaultsAndAllowedSorts | Partial | No | Partial | Fail |
| src/test/java/com/skishop/service/AiConsultationServiceTests.java | liveProviderAnswerReturnsLiveStatus | Mostly | Yes | Yes | Warning |

## Test Type Coverage
| Test Type | Exists | Framework | Target Layer | Verdict |
|-----------|--------|-----------|--------------|---------|
| Unit Test | Yes | JUnit 5 + Mockito/lambdas | Domain/Service | Warning: naming/AAA issues |
| Integration Test (API) | Yes | @SpringBootTest + MockMvc | Controllers | Warning: branch coverage gap |
| DB Slice Test | Yes | @DataJpaTest + H2 PostgreSQL mode | Repository | Pass |
| PostgreSQL Fidelity Test | Partial | Testcontainers PostgreSQL | Zero-hit concurrency | Warning: disabled without Docker |
| Security Test | Yes | Spring Boot security integration via MockMvc | Auth/admin APIs | Pass |

## Coverage Verification
| Layer | Target | Estimated Achievement | Untested Method Count | Verdict |
|-------|--------|----------------------|-----------------------|---------|
| Overall | Branch 80%+ | 198/245 branches, displayed as 80% | 5 missed methods | Warning |
| Service | Branch 80%+ | Package shown as 80%, several classes below 80% | 2 package missed methods | Fail |
| Controller | Branch 80%+ | 5/10 branches = 50% | 0 missed methods | Fail |
| Repository | Branch 70%+ | Not directly measured for interfaces | Unknown | Warning |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 18 | All test-like methods violate `should_X_when_Y` | `void should_normalizeKeyword_when_keywordContainsWhitespaceAndUppercase()` |
| 2 | High | AAA Pattern | src/test/java/com/skishop/service/AdminAuthServiceTests.java | 29 | Multiple Acts and inline subject calls in assertions | Split issue-token and validate-token behavior |
| 3 | High | Coverage Criteria | target/site/jacoco/jacoco.csv | 40 | Controller branch coverage is 50% | Add tests for AuthController source IP branches |
| 4 | High | Coverage Criteria | target/site/jacoco/jacoco.csv | 8-25 | Multiple service classes below 80% branch coverage | Add branch-focused unit tests |
| 5 | Medium | Coverage Enforcement | pom.xml | 118 | No JaCoCo `check` threshold gate | Add `jacoco:check` limits |
| 6 | Medium | Test Documentation | src/test/java/com/skishop/controller/AuthApiIntegrationTests.java | 54 | No `@DisplayName` usage found | Add readable display names |
| 7 | Medium | Parameterized Tests | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 27 | Boundary matrices are manual repeated assertions | Use `@ParameterizedTest` + sources |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Test Naming Convention | 1/5 | Suite-wide mismatch with required pattern |
| AAA Pattern | 2/5 | Some tests have readable spacing, but Act singularity is inconsistent |
| Test Type Coverage | 4/5 | Unit, API, DB, security, and PostgreSQL concurrency tests exist |
| Coverage Criteria | 3/5 | Overall is near target, controller and service class branch gaps remain |
| Mock Quality | 4/5 | Mockito usage is limited and mostly interface-oriented |
| **Overall Score** | **13/25** | Fail under the provided agent criteria |

## Escalation Items (Requires Human Judgment)
None.

### performance

- Status: completed
- Verdict: fail
- Summary: Performance review found no N+1 association risks, but product list/search issue avoidable duplicate count queries, DTO-only reads still materialize JPA entities, search is non-sargable for larger catalogs, and cache strategy is absent for stable product master context.

# Source Code Review Report: Performance Review

## Summary
- **Review Target**: full backend source
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 3 / Medium: 3 / Low: 1

## N+1 Query Detection Results
| # | File | Method | Line | Pattern | Fix Suggestion |
|---|------|--------|------|---------|----------------|
| - | - | - | - | No entity associations or lazy collection traversal found in reviewed source | Keep association access explicit if relationships are added later |

## Pagination Check
| Endpoint | Pagination Present | Default Size | Max Size | Verdict |
|----------|-------------------|-------------|----------|---------|
| GET /api/products | Bounded first page via Pageable | 20 | 100 | ⚠️ Bounded, but no page/size metadata |
| GET /api/products/search | Bounded first page via Pageable | 20 | 100 | ⚠️ Bounded, but duplicate count query |
| GET /api/admin/zero-hits | Bounded first page via PageRequest | 20 | 100 | ⚠️ Bounded, but no page/size metadata |

## JPA Query Optimization Check
| File | Method | readOnly Txn | DTO Projection | exists vs count | Verdict |
|------|--------|-------------|----------------|-----------------|---------|
| ProductQueryService.java | listProducts | Yes | No | N/A | ❌ duplicate count + entity materialization |
| ProductSearchService.java | search | No, writes on zero-hit | No | N/A | ❌ duplicate count + entity materialization |
| ZeroHitQueryService.java | listZeroHits | Yes | No | N/A | ⚠️ acceptable for bounded rows, projection could help |
| AiConsultationService.java | consult | Yes | Scalar queries | N/A | ⚠️ cache missing for stable context |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | JPA Query Optimization | src/main/java/com/skishop/service/ProductQueryService.java | 43 | `findAll(spec,pageable)` can count, then `count(spec)` repeats it | `Page<Product> page = productRepository.findAll(specification, pageable); long total = page.getTotalElements();` |
| 2 | High | JPA Query Optimization | src/main/java/com/skishop/service/ProductSearchService.java | 59 | Same duplicate count pattern in search | Use one `Page<Product>` result |
| 3 | High | DTO Projection | src/main/java/com/skishop/service/ProductQueryService.java | 43 | DTO-only product APIs load managed entities | Add DTO/interface projection repository methods |
| 4 | Medium | Query Selectivity | src/main/java/com/skishop/service/ProductSpecifications.java | 39 | `%keyword%` lower LIKE search will not scale with normal btree indexes | Use PostgreSQL full-text search or `pg_trgm` GIN indexes |
| 5 | Medium | Cache Strategy | src/main/java/com/skishop/service/AiConsultationService.java | 45 | Stable categories/manufacturers queried on every AI consult | Add `@Cacheable` and future `@CacheEvict` on product updates |
| 6 | Medium | Database Round Trips | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 96 | Upsert followed by select can be one PostgreSQL `RETURNING` query | Use `INSERT ... ON CONFLICT ... RETURNING` |
| 7 | Low | Memory Allocation | src/main/java/com/skishop/service/AiPromptBuilder.java | 84 | Prompt formatting does `toList().stream().reduce` with string concatenation | Use `Collectors.joining(System.lineSeparator())` |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| N+1 Query Prevention | 5/5 | No relationships or query-in-loop patterns found |
| JPA Query Optimization | 2/5 | Duplicate count queries and entity materialization on read APIs |
| Pagination | 4/5 | All list APIs are bounded to max 100, but full page metadata is absent |
| Memory Efficiency | 4/5 | Mostly fine; one low-impact prompt allocation issue |
| Cache Strategy | 1/5 | No cache strategy for stable product master reads |
| **Overall Score** | **16/25** | High-priority query fixes needed |

## Escalation Items (Requires Human Judgment)
- Confirm expected catalog size and search SLA. If the catalog is expected to grow beyond demo seed data, choose PostgreSQL full-text or trigram search before performance testing.

### resilience

- Status: completed
- Verdict: fail
- Summary: Resilience review failed because the live Spring AI/OpenAI path performs an external call without explicit retry, circuit breaker, timeout, or bulkhead protection. Actuator health probes are enabled and no direct new RestTemplate() usage was found, but graceful shutdown and external dependency health coverage are incomplete.

# Source Code Review Report: Resilience Review

## Summary
- **Review Target**: backend full source review
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 3 / Medium: 1 / Low: 0

## HTTP Client Management Check
| Component | Bean-Managed | Timeout Configured | URL Externalized | Verdict |
|-----------|-------------|-------------------|-----------------|---------|
| Spring AI ChatClient / OpenAI | Yes | No explicit timeout found | API key/model externalized; base URL uses library default | ⚠️ Warning |
| RestTemplate/WebClient direct usage | N/A | N/A | N/A | ✅ Pass: no `new RestTemplate()` found |

## Resilience4j Configuration Check
| Client | @Retry | @CircuitBreaker | @TimeLimiter | Backoff | Verdict |
|--------|--------|-----------------|-------------|---------|---------|
| SpringAiProviderClient | No | No | No | No | ❌ Fail |

## Health Check Implementation Status
| Component | /actuator/health | readiness | DataSource | Custom Indicators | Verdict |
|-----------|-----------------|-----------|------------|------------------|---------|
| Spring Boot Actuator | Exposed | Probes enabled | Auto indicator expected | None found for AI provider | ⚠️ Warning |

## Fallback Strategy
| Component | External Dependency | Fallback on Failure | Defined | Verdict |
|-----------|-------------------|--------------------|---------|---------|
| AiConsultationService | OpenAI/Spring AI | No-key fallback and provider-error answer | Yes | ✅ Pass |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | Critical | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25 | Live AI provider call has no retry or circuit breaker protection. | Add Resilience4j dependency/config and annotate `generate()` with `@Retry` and `@CircuitBreaker` using a bounded fallback. |
| 2 | High | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 27 | OpenAI ChatClient has no explicit connect/read timeout or TimeLimiter. | Configure HTTP client timeouts and/or `@TimeLimiter(name = "aiProvider")`. |
| 3 | High | Graceful Shutdown | src/main/resources/application.yml | 33 | Graceful shutdown is not enabled. | Add `server.shutdown: graceful` and `spring.lifecycle.timeout-per-shutdown-phase: 30s`. |
| 4 | High | Health Checks | src/main/resources/application.yml | 44 | Readiness does not cover the configured live AI dependency. | Add an AI provider health indicator or explicit degraded component status. |
| 5 | Medium | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 34 | No concurrency isolation around slow external AI calls. | Add `@Bulkhead(name = "aiProvider")` with bounded concurrent calls. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| HTTP Client Management | 4/5 | No direct RestTemplate usage; ChatClient is bean-managed. Timeout/base URL control is incomplete. |
| Retry / CB | 1/5 | No retry, circuit breaker, or backoff on the external AI path. |
| Health Checks | 3/5 | Actuator health/readiness probes are enabled; no AI dependency indicator. |
| Timeout Management | 1/5 | No explicit provider timeout found. |
| Fallback | 4/5 | Good degraded responses for no-key and provider failure; fallback is not integrated with resilience policies. |
| **Overall Score** | **13/25** | Fail due to critical retry/circuit-breaker gap. |

## Escalation Items (Requires Human Judgment)
- Decide whether AI provider outage should make readiness DOWN or only expose a degraded component status.

Tests were not run; this was a source-only resilience review.

