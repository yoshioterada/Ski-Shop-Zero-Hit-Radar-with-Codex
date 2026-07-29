# Source Code Review Integrated Report

## Verdict
- Target: full
- Verdict: Rejected
- Review Date: 2026-06-04T17:50:39.441Z
- Project: /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend
- Agents: tech-lead, architecture, ddd-domain, api-endpoint, java-standards, async-concurrency, error-logging, data-access, config-di, security, dependency, test-quality, performance, resilience

## Findings Summary
| Agent | Thread ID | Status | Verdict | Critical | High | Medium | Low | Score |
|---|---|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e93bc-701e-7d22-898b-aae5fbc56ff2 | completed | fail | 2 | 0 | 2 | 2 | 65 |
| architecture | 019e93bc-701e-7340-97cd-0be050b2fdb2 | completed | warning | 0 | 2 | 3 | 0 | 19 |
| ddd-domain | 019e93bc-701e-76e0-a8bb-afdfa2a5519e | completed | fail | 0 | 3 | 1 | 0 | 17 |
| api-endpoint | 019e93bc-70b8-7992-a094-b5aed253619a | completed | fail | 0 | 2 | 2 | 1 | 15 |
| java-standards | 019e93bc-701e-7463-a39c-d53f33e1a19c | completed | fail | 0 | 5 | 0 | 0 | 19 |
| async-concurrency | 019e93bc-701e-76d2-a59b-064cf2417b88 | completed | fail | 2 | 2 | 0 | 0 | 52 |
| error-logging | 019e93bc-701e-7e12-90e0-91f6924932ab | completed | fail | 0 | 5 | 2 | 0 | 13 |
| data-access | 019e93be-57f0-7861-b021-9c1ca1c01c08 | completed | fail | 2 | 5 | 2 | 0 | 14 |
| config-di | 019e93be-9a5a-77f0-8202-cb958155e669 | completed | fail | 2 | 3 | 2 | 0 | 14 |
| security | 019e93be-9ef5-7862-adef-a413f2646242 | completed | fail | 2 | 3 | 1 | 0 | 45 |
| dependency | 019e93be-a9d1-7652-affd-1de29bad7300 | completed | fail | 1 | 2 | 2 | 0 | 68 |
| test-quality | 019e93be-fd07-7342-ba51-3e2b3f016c7c | completed | fail | 0 | 4 | 3 | 0 | 52 |
| performance | 019e93bf-9c9e-7d51-9cdf-267a8d2dd408 | completed | fail | 0 | 3 | 3 | 0 | 64 |
| resilience | 019e93c0-16ba-7261-abf9-795a31efd7a3 | completed | fail | 1 | 3 | 1 | 0 | 60 |

## Verdict Rationale
Critical findings were detected and require remediation before approval.

## Critical/High Findings List
| # | Severity | Source Agent | Category | Target File | Line | Finding | Suggested Fix |
|---:|---|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27-59 | Direct instantiation of Spring service under test violates the project-wide DI rule | Use Spring-managed construction in the test context with mocked collaborators, or explicitly amend the project standards to exempt unit-test construction of the service under test. |
| 2 | Critical | tech-lead | Prohibited Pattern | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 113-113 | Admin auth test directly constructs DI services | Use a Spring test slice/context with constructor-injected beans or document a narrow test-only exemption for constructing the subject under test. |
| 3 | High | architecture | Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-21 | Repository/data-access component is placed in the service package | Move this class to `com.skishop.repository` or an explicitly designed infrastructure/data-access package, then inject it into `ZeroHitRecordingService` from that lower layer. Keep orchestration in service and database-specific SQL in the data-access boundary. |
| 4 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | JPA entities are not in the required model package | Either move JPA entities/enums to `com.skishop.model` and update imports, or update the architecture/AGENTS convention to explicitly accept `entity/` as the persistence model package. |
| 5 | High | ddd-domain | Domain Event Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-64 | Zero-hit recording is coupled by direct service-to-service call instead of a domain event | Introduce an immutable record event carrying the normalized/display keyword and occurred time, publish it from the product search use case via `ApplicationEventPublisher`, and handle recording in a dedicated listener. If recording must occur after the search transaction commits, use `@TransactionalEventListener(phase = AFTER_COMMIT)`. |
| 6 | High | ddd-domain | Aggregate Root Boundary | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | Native upsert bypasses ZeroHitSearch aggregate behavior and duplicates domain rules in SQL | Move mutation back through the aggregate, for example by using a locked repository method (`findByNormalizedKeyword` with pessimistic write lock) plus `ZeroHitSearch.firstHit` / `recordRepeat` inside one transaction, with unique-constraint retry for concurrent inserts. If native upsert must remain, isolate it as infrastructure and add strong tests/guards proving it cannot diverge from the aggregate policy. |
| 7 | High | ddd-domain | Value Object Implementation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Money-like concepts are raw BigDecimal fields instead of immutable value objects | Create a `Money` value object record with compact-constructor validation for amount, currency, scale, and non-negativity, then persist it via `@Embedded`/converter according to the chosen JPA mapping. Use it for product price and estimated opportunity loss while keeping DTOs frontend-friendly if needed. |
| 8 | High | api-endpoint | HTTP Method Semantics | src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search records zero-hit demand as a side effect | Keep GET /api/products/search read-only. Move zero-hit recording to an explicit POST endpoint such as POST /api/zero-hit-searches or POST /api/products/search-events with a validated request DTO, then update the frontend and design docs together. |
| 9 | High | api-endpoint | Error Response Design | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 25-45 | API errors do not use Spring ProblemDetail / RFC 9457 format | Extend ResponseEntityExceptionHandler where appropriate and return ProblemDetail, e.g. ProblemDetail.forStatusAndDetail(status, message), with stable extension properties such as code, path, and errors. Align the security ApiErrorWriter with the same ProblemDetail shape. |
| 10 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24-24 | DI-managed concrete service/repository classes bypass interface segregation | Introduce a small interface such as ZeroHitRecordingUseCase/ZeroHitRecorder with record(String keyword), implement it in ZeroHitRecordingService, and inject that abstraction. Consider an interface/port for ZeroHitAtomicUpsertGateway if it remains a Spring @Repository boundary. |
| 11 | High | java-standards | Naming Conventions | src/main/java/com/skishop/controller/AuthController.java | 46-46 | Controller method name is not verb-first | Rename to getCurrentUser(Authentication authentication) or getAuthenticatedAdmin(Authentication authentication). |
| 12 | High | java-standards | Naming Conventions | src/main/java/com/skishop/repository/ProductRepository.java | 55-55 | Repository method name is not verb-first | Rename to findAveragePrice() or calculateAveragePrice(), then update callers in ZeroHitRecordingService and tests. |
| 13 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19-21 | Nullable parameters are accepted but not annotated | Change the signature to public String normalize(@Nullable String keyword) and import org.springframework.lang.Nullable. |
| 14 | High | java-standards | Null Safety | src/main/java/com/skishop/service/AiConsultationService.java | 110-111 | Private helper accepts nullable collection without annotation | Import java.util.List and org.springframework.lang.Nullable, then use private String firstOrUnknown(@Nullable List<String> values). |
| 15 | Critical | async-concurrency | Virtual Threads / Pinning | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | JPA read/write operations are executed inside synchronized fallback upsert lock | Prefer a database-level atomic upsert or unique-constraint retry path for every supported database. If a JVM fallback lock remains, replace monitor locking with `ReentrantLock` and keep the critical section as small as possible; avoid holding it across JDBC calls where feasible, for example by handling duplicate insert conflicts and retrying the update in a new transaction. |
| 16 | Critical | async-concurrency | Virtual Threads / Pinning | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Database metadata lookup occurs inside synchronized supports check | Initialize database support outside a Java monitor, such as during bean initialization, or use `ReentrantLock`/an atomic lazy holder that does not monitor-pin while waiting on JDBC. If duplicate detection calls are acceptable, compute outside the lock and publish the volatile cached value afterward. |
| 17 | High | async-concurrency | Virtual Thread Adoption | src/main/resources/application.yml | 1-64 | Spring Boot virtual threads are not enabled | Add `spring.threads.virtual.enabled: true` to the common Spring configuration, then remove or refactor monitor-wrapped I/O before relying on it in production. |
| 18 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 125-132 | Admin active-token limit is enforced with a non-atomic check-then-put sequence | Guard the full token issuance invariant with a small `ReentrantLock` or synchronize only the in-memory session mutation block. Keep password verification and other potentially slow work outside the lock. |
| 19 | High | error-logging | Correlation ID / MDC | src/main/java/com/skishop/config/RequestLoggingFilter.java | 29-40 | No request correlation ID is assigned, propagated, or included in logs | Add a `OncePerRequestFilter` that reads `X-Correlation-Id`, generates a UUID when absent, calls `MDC.put("correlationId", correlationId)`, sets the response header, and clears MDC in `finally`. Include `%X{correlationId}` or a JSON `correlationId` field in Logback. |
| 20 | High | error-logging | Exception Handling | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Unexpected exception logging drops the stack trace | Use `LOGGER.error("Unexpected API error path={} type={}", request.getRequestURI(), exception.getClass().getName(), exception);` while keeping the client response sanitized. |
| 21 | High | error-logging | Exception Handling | src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider failures are caught but logged without the exception | Log the throwable without prompt or credential data, for example `LOGGER.warn("ai_consultation providerStatus={} errorType={}", response.providerStatus(), exception.getClass().getName(), exception);`. |
| 22 | High | error-logging | RFC7807 Error Contract | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-45 | Global exception responses do not use Spring `ProblemDetail` | Migrate exception handlers to return `ProblemDetail` with stable `title`, `detail`, `status`, and extension properties such as `code`, `path`, and validation `errors`. Coordinate with frontend contract tests because this is a breaking response-shape change. |
| 23 | High | error-logging | Structured Logging Configuration | pom.xml | 45-110 | Production JSON Logback configuration is missing | Add `logstash-logback-encoder` and `src/main/resources/logback-spring.xml` with JSON output for production, including `application`, `correlationId`, and trace/span fields where available. |
| 24 | Critical | data-access | Repository Configuration | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 14-14 | Default profiles embed JDBC URLs instead of requiring externalized datasource configuration | Remove JDBC URL defaults from shared/runtime profiles. Require SPRING_DATASOURCE_URL, and move local/demo defaults into an explicitly activated local profile or compose-only environment. |
| 25 | Critical | data-access | Date/Time Persistence | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | java.sql.Timestamp is used in the PostgreSQL upsert path | Bind a java.time value directly, or use OffsetDateTime/LocalDateTime with an explicit UTC policy. For PostgreSQL, prefer TIMESTAMPTZ plus OffsetDateTime/Instant-compatible binding instead of introducing java.sql.Timestamp in application code. |
| 26 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 24-26 | Primary keys use UUID type and entity/JDBC generation instead of String UUID generated in the service layer | Either migrate IDs to String/VARCHAR(36) and generate them in services before construction, or record an explicit project exception and update the agent standards/design docs to approve PostgreSQL UUID IDs. |
| 27 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 25-40 | Product columns rely on implicit column names | Add explicit names such as @Column(name = "id", ...), @Column(name = "manufacturer", ...), @Column(name = "name", ...), @Column(name = "category", ...), @Column(name = "description", ...), and @Column(name = "price", ...). |
| 28 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 24-38 | ZeroHitSearch columns rely on implicit column names | Add @Column(name = "id", ...), @Column(name = "keyword", ...), and @Column(name = "priority", ...). |
| 29 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps use lifecycle callbacks instead of Hibernate audit annotations | Annotate createdAt with @CreationTimestamp and updatedAt with @UpdateTimestamp, keep @Column(name = "created_at", updatable = false, nullable = false) and @Column(name = "updated_at", nullable = false), and remove manual audit timestamp callbacks unless a documented clock strategy is required. |
| 30 | High | data-access | Transaction Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 59-73 | ZeroHitRecordingService.record performs writes without an explicit transaction boundary on the PostgreSQL path | Put the transaction boundary on ZeroHitRecordingService.record() or wrap both atomic and fallback branches in TransactionTemplate so the upsert and subsequent repository read participate in one explicit transaction. |
| 31 | Critical | config-di | Application Properties / Secret Detection | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded datasource password fallback | Remove the literal default and require external configuration, e.g. `password: ${SPRING_DATASOURCE_PASSWORD}`. Keep any demo-only credentials in a clearly non-production local/dev profile or compose example, not in the runtime Docker profile. |
| 32 | Critical | config-di | DI Registration / Singleton Thread Safety | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 41-42 | Singleton auth service keeps mutable session state with a non-atomic token cap | Make session issuance and cap enforcement one atomic critical section, or move admin sessions to a transactional/token store with a unique admin/session policy. If in-memory state remains for demo use, explicitly document it as single-instance only and synchronize the compound operation. |
| 33 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 57-58 | SecurityFilterChain order does not match the required CORS-before-CSRF sequence | Move `.cors(Customizer.withDefaults())` before `.csrf(...)` and add a short code comment documenting that CSRF is disabled because the API is stateless and does not use cookie-based browser sessions. |
| 34 | High | config-di | Spring Security Headers | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 80-81 | Security headers are not explicitly configured and CSP is absent | Add `.headers(headers -> headers.contentSecurityPolicy(...).frameOptions(...).contentTypeOptions(Customizer.withDefaults()).httpStrictTransportSecurity(...))`, with HSTS enabled only for HTTPS/proxy-terminated production traffic. |
| 35 | High | config-di | Application Properties / Profile Separation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources |  | Production and development configuration profiles are missing | Add `application-dev.yml` for local defaults and `application-prod.yml` for required env-backed secrets, `spring.jpa.show-sql=false`, and `logging.level.root=WARN`. Keep Docker profile either prod-equivalent or explicitly local-only. |
| 36 | Critical | security | A07/A01 Spoofing - Login Rate Limiting | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login lockout can be bypassed by spoofing X-Forwarded-For | Only trust forwarding headers when the immediate peer is a configured trusted proxy, or remove this parsing and use request.getRemoteAddr(). Prefer edge rate limiting at the reverse proxy/gateway and configure Spring's ForwardedHeaderFilter/server.forward-headers-strategy only behind a trusted proxy that strips incoming client headers. |
| 37 | Critical | security | A02 Cryptographic Failures - Secret Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 3-5 | Docker profile ships default database credentials | Remove secret fallbacks from runtime profiles: use username: ${SPRING_DATASOURCE_USERNAME} and password: ${SPRING_DATASOURCE_PASSWORD}. Put demo-only values in compose/smoke files or .env.example, not in application runtime config. |
| 38 | High | security | A05 Security Misconfiguration - Security Headers | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Security headers are incomplete and not explicitly configured | Add .headers(headers -> headers.contentTypeOptions(...).frameOptions(...).httpStrictTransportSecurity(...).contentSecurityPolicy(...).referrerPolicy(...).permissionsPolicy(...)) and set server.server-header to blank where supported. Confirm HSTS is enabled only when served over HTTPS or behind TLS-terminating infrastructure. |
| 39 | High | security | A05/D Denial of Service - Request Size Limits | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 33-37 | Configured body limits do not cover JSON request bodies | Enforce a request Content-Length/body limit for application/json via reverse proxy, servlet filter, or container valve; return 413 for oversized bodies. Also add @Size caps to LoginRequest username/password as a secondary validation layer. |
| 40 | High | security | D Denial of Service - Rate Limiter State Exhaustion | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 23-59 | Login attempt limiter has unbounded in-memory key growth | Use a bounded cache with expire-after-write/access and maximumSize, or move throttling to Redis/gateway with TTL keys. Normalize and trust source IP only after fixing forwarded header handling. Add tests for eviction and high-cardinality attack behavior. |
| 41 | Critical | dependency | SNAPSHOT Version Exclusion | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 13-13 | Project artifact version is SNAPSHOT | Use a release/stable version for publishable builds, for example 0.1.0, and reserve SNAPSHOT only for local development branches if the release process explicitly allows it. |
| 42 | High | dependency | Test Dependency Scope | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 80-84 | H2 is packaged as a runtime dependency instead of test-only | Change H2 to <scope>test</scope> unless a real non-test runtime profile intentionally uses H2 and is documented. |
| 43 | High | dependency | Required Dependency Verification | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Required structured logging dependency is missing | Add net.logstash.logback:logstash-logback-encoder with an explicit approved version, then configure Logback JSON output if structured logs are part of the runtime standard. |
| 44 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 17-18 | All test methods violate required should_ExpectedResult_when_Condition naming | Rename tests to specification-style names, e.g. `should_returnNormalizedKeyword_when_keywordContainsMixedCaseAndWhitespace`, `should_returnUnauthorizedError_when_protectedEndpointHasNoToken`. Apply this consistently to every test method. |
| 45 | High | test-quality | AAA Pattern | src/test/java/com/skishop/controller/FrontendContractIntegrationTests.java | 63-63 | Several tests combine multiple actions and behaviors in one method | Split into focused tests such as `should_matchProductListContract_when_productsRequested`, `should_matchZeroHitContract_when_searchHasNoResults`, `should_returnValidationErrorContract_when_loginPayloadInvalid`, each with clear Arrange / Act / Assert blocks. |
| 46 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 40-40 | Controller branch coverage is below the required 80% target | Add controller/security tests for the missing AuthController branches, especially logout/me paths with null, invalid, non-admin, and unexpected authentication principal states, then verify controller branch coverage >= 80%. |
| 47 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 10-10 | AI provider adapter branch coverage is far below service-layer expectations | Add unit tests around `SpringAiProviderClient.generate` using mocked `ObjectProvider<ChatClient>` / fluent ChatClient interactions for: missing API key, missing ChatClient, nonblank answer, blank answer, null answer, and provider RuntimeException wrapping into AiProviderException. |
| 48 | High | performance | Duplicate query execution | src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing executes an avoidable second count query | Keep the Page returned by findAll and use page.getTotalElements(): Page<Product> page = productRepository.findAll(specification, pageable); return new ProductListResponse(page.getContent().stream().map(productMapper::toDto).toList(), page.getTotalElements()); |
| 49 | High | performance | Duplicate query execution | src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search executes an avoidable second count query | Store Page<Product> page = productRepository.findAll(specification, pageable), map page.getContent(), and use page.getTotalElements() for both response metadata and the zero-hit decision. |
| 50 | High | performance | Pagination | src/main/java/com/skishop/service/ProductRequestOptions.java | 29-35 | Collection APIs are capped but not truly paginated | Add a validated page parameter, build PageRequest.of(page, safeSize, sort), and return pagination metadata such as page, size, totalElements, and totalPages for list/search/dashboard collection responses. |
| 51 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25-39 | Live AI provider call has no retry or circuit breaker protection | Add Resilience4j Spring Boot support and wrap the provider call, for example @Retry(name = "aiProvider", fallbackMethod = "fallback") and @CircuitBreaker(name = "aiProvider", fallbackMethod = "fallback"), with YAML config using maxAttempts 3, exponential backoff, and a bounded open-state wait. Ensure the fallback returns Optional.empty() or throws AiProviderException consistently so AiConsultationService keeps returning FALLBACK/ERROR responses. |
| 52 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | External AI call has no explicit connect/read or operation timeout | Configure explicit provider timeouts through the supported Spring AI/OpenAI client builder or properties, and add an overall operation timeout. Target values should be short and documented, for example connect timeout 3-5s and read/operation timeout 10-20s for this admin consultation endpoint. |
| 53 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-42 | Graceful shutdown is not configured | Add `server.shutdown: graceful` and `spring.lifecycle.timeout-per-shutdown-phase: 20s` or another bounded value aligned with deployment probe/drain settings. |
| 54 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | No custom health/readiness signal exists for the AI provider dependency | Add a custom AI provider HealthIndicator or readiness group member. If AI is intentionally optional because fallback is acceptable, document that decision and expose a non-gating indicator or metric so operations can still detect provider outages. |


## All Findings
| # | Severity | Source Agent | Category | Target File | Line | Finding |
|---:|---|---|---|---|---|---|
| 1 | Critical | tech-lead | Prohibited Pattern | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27-59 | Direct instantiation of Spring service under test violates the project-wide DI rule |
| 2 | Critical | tech-lead | Prohibited Pattern | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 113-113 | Admin auth test directly constructs DI services |
| 3 | Medium | tech-lead | Layering Consistency | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-20 | Repository-style gateway is located in the service package |
| 4 | Medium | tech-lead | Quality Gate | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 114-131 | Coverage target is reported but not enforced |
| 5 | Low | tech-lead | KISS / Maintainability | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/repository/ProductRepository.java | 23-49 | ProductRepository exposes unused duplicate query paths |
| 6 | Low | tech-lead | Design Documentation Alignment | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/db/migration/V3__zero_hit_invariants.sql | 1-5 | Zero-hit opportunity-loss nullability is stricter than the design document |
| 7 | High | architecture | Project Structure | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 1-21 | Repository/data-access component is placed in the service package |
| 8 | High | architecture | Project Structure | src/main/java/com/skishop/entity/Product.java | 1-20 | JPA entities are not in the required model package |
| 9 | Medium | architecture | Project Structure | src/main/java/com/skishop/dto/LoginRequest.java | 1-11 | Request and response DTOs are mixed in a flat dto package |
| 10 | Medium | architecture | Module Boundary Enforcement | src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3-17 | API DTO depends on persistence enum type |
| 11 | Medium | architecture | Spring Boot Configuration | src/main/resources/application.yml | 13-23 | Profile separation is incomplete for architecture standard |
| 12 | High | ddd-domain | Domain Event Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-64 | Zero-hit recording is coupled by direct service-to-service call instead of a domain event |
| 13 | High | ddd-domain | Aggregate Root Boundary | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25-57 | Native upsert bypasses ZeroHitSearch aggregate behavior and duplicates domain rules in SQL |
| 14 | High | ddd-domain | Value Object Implementation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Money-like concepts are raw BigDecimal fields instead of immutable value objects |
| 15 | Medium | ddd-domain | Domain Logic Encapsulation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 73-79 | Product aggregate does not enforce its own domain invariants |
| 16 | High | api-endpoint | HTTP Method Semantics | src/main/java/com/skishop/controller/ProductController.java | 51-58 | GET /api/products/search records zero-hit demand as a side effect |
| 17 | High | api-endpoint | Error Response Design | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 25-45 | API errors do not use Spring ProblemDetail / RFC 9457 format |
| 18 | Medium | api-endpoint | Parameter Binding | src/main/java/com/skishop/controller/AuthController.java | 45-48 | Current-user endpoint manually casts Authentication instead of using @AuthenticationPrincipal |
| 19 | Medium | api-endpoint | Input Validation | src/main/java/com/skishop/dto/LoginRequest.java | 11-11 | LoginRequest accepts unbounded username and password strings |
| 20 | Low | api-endpoint | URL Convention | src/main/java/com/skishop/controller/AdminZeroHitController.java | 19-37 | Admin controllers inline full /api/admin paths instead of class-level base mapping |
| 21 | High | java-standards | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24-24 | DI-managed concrete service/repository classes bypass interface segregation |
| 22 | High | java-standards | Naming Conventions | src/main/java/com/skishop/controller/AuthController.java | 46-46 | Controller method name is not verb-first |
| 23 | High | java-standards | Naming Conventions | src/main/java/com/skishop/repository/ProductRepository.java | 55-55 | Repository method name is not verb-first |
| 24 | High | java-standards | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19-21 | Nullable parameters are accepted but not annotated |
| 25 | High | java-standards | Null Safety | src/main/java/com/skishop/service/AiConsultationService.java | 110-111 | Private helper accepts nullable collection without annotation |
| 26 | Critical | async-concurrency | Virtual Threads / Pinning | src/main/java/com/skishop/service/ZeroHitRecordingService.java | 86-89 | JPA read/write operations are executed inside synchronized fallback upsert lock |
| 27 | Critical | async-concurrency | Virtual Threads / Pinning | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 81-83 | Database metadata lookup occurs inside synchronized supports check |
| 28 | High | async-concurrency | Virtual Thread Adoption | src/main/resources/application.yml | 1-64 | Spring Boot virtual threads are not enabled |
| 29 | High | async-concurrency | Thread Safety | src/main/java/com/skishop/service/AdminAuthService.java | 125-132 | Admin active-token limit is enforced with a non-atomic check-then-put sequence |
| 30 | High | error-logging | Correlation ID / MDC | src/main/java/com/skishop/config/RequestLoggingFilter.java | 29-40 | No request correlation ID is assigned, propagated, or included in logs |
| 31 | High | error-logging | Exception Handling | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 119-122 | Unexpected exception logging drops the stack trace |
| 32 | High | error-logging | Exception Handling | src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider failures are caught but logged without the exception |
| 33 | High | error-logging | RFC7807 Error Contract | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 37-45 | Global exception responses do not use Spring `ProblemDetail` |
| 34 | High | error-logging | Structured Logging Configuration | pom.xml | 45-110 | Production JSON Logback configuration is missing |
| 35 | Medium | error-logging | Exception Hierarchy | src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 69-71 | Business and domain failures are mapped through broad `IllegalArgumentException` handling |
| 36 | Medium | error-logging | Observability Integration | src/main/resources/application.yml | 44-53 | Actuator exposes health only; metrics endpoint is not enabled for operational visibility |
| 37 | Critical | data-access | Repository Configuration | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 14-14 | Default profiles embed JDBC URLs instead of requiring externalized datasource configuration |
| 38 | Critical | data-access | Date/Time Persistence | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 7-100 | java.sql.Timestamp is used in the PostgreSQL upsert path |
| 39 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 24-26 | Primary keys use UUID type and entity/JDBC generation instead of String UUID generated in the service layer |
| 40 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 25-40 | Product columns rely on implicit column names |
| 41 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 24-38 | ZeroHitSearch columns rely on implicit column names |
| 42 | High | data-access | Entity Design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps use lifecycle callbacks instead of Hibernate audit annotations |
| 43 | High | data-access | Transaction Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 59-73 | ZeroHitRecordingService.record performs writes without an explicit transaction boundary on the PostgreSQL path |
| 44 | Medium | data-access | Optimistic Locking | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 23-47 | ZeroHitSearch has concurrent update risk but no @Version column |
| 45 | Medium | data-access | Query Quality | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Read APIs load full entities instead of DTO projections |
| 46 | Critical | config-di | Application Properties / Secret Detection | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded datasource password fallback |
| 47 | Critical | config-di | DI Registration / Singleton Thread Safety | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/AdminAuthService.java | 41-42 | Singleton auth service keeps mutable session state with a non-atomic token cap |
| 48 | High | config-di | Spring Security Filter Chain | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 57-58 | SecurityFilterChain order does not match the required CORS-before-CSRF sequence |
| 49 | High | config-di | Spring Security Headers | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 80-81 | Security headers are not explicitly configured and CSP is absent |
| 50 | High | config-di | Application Properties / Profile Separation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources |  | Production and development configuration profiles are missing |
| 51 | Medium | config-di | Type-Safe Configuration | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/AdminProperties.java | 14-15 | ConfigurationProperties records are not validated |
| 52 | Medium | config-di | Logging / Server Security Settings | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources |  | No profile-specific Logback configuration or production log levels are present |
| 53 | Critical | security | A07/A01 Spoofing - Login Rate Limiting | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 60-69 | Login lockout can be bypassed by spoofing X-Forwarded-For |
| 54 | Critical | security | A02 Cryptographic Failures - Secret Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml | 3-5 | Docker profile ships default database credentials |
| 55 | High | security | A05 Security Misconfiguration - Security Headers | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-81 | Security headers are incomplete and not explicitly configured |
| 56 | High | security | A05/D Denial of Service - Request Size Limits | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application.yml | 33-37 | Configured body limits do not cover JSON request bodies |
| 57 | High | security | D Denial of Service - Rate Limiter State Exhaustion | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/InMemoryLoginAttemptLimiter.java | 23-59 | Login attempt limiter has unbounded in-memory key growth |
| 58 | Medium | security | A02 Cryptographic Failures - Password Hashing | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java | 84-91 | Production code accepts {noop} admin passwords without a profile guard |
| 59 | Critical | dependency | SNAPSHOT Version Exclusion | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 13-13 | Project artifact version is SNAPSHOT |
| 60 | High | dependency | Test Dependency Scope | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 80-84 | H2 is packaged as a runtime dependency instead of test-only |
| 61 | High | dependency | Required Dependency Verification | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 45-110 | Required structured logging dependency is missing |
| 62 | Medium | dependency | Build Configuration | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 29-33 | UTF-8 source and reporting encodings are not declared |
| 63 | Medium | dependency | BOM Management | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml | 31-73 | Flyway version is overridden instead of fully relying on Spring Boot dependency management |
| 64 | High | test-quality | Test Naming Convention | src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 17-18 | All test methods violate required should_ExpectedResult_when_Condition naming |
| 65 | High | test-quality | AAA Pattern | src/test/java/com/skishop/controller/FrontendContractIntegrationTests.java | 63-63 | Several tests combine multiple actions and behaviors in one method |
| 66 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 40-40 | Controller branch coverage is below the required 80% target |
| 67 | High | test-quality | Coverage Criteria | target/site/jacoco/jacoco.csv | 10-10 | AI provider adapter branch coverage is far below service-layer expectations |
| 68 | Medium | test-quality | Coverage Gate | pom.xml | 114-131 | JaCoCo reports coverage but does not enforce minimum thresholds |
| 69 | Medium | test-quality | Test Naming Convention | src/test/java/com/skishop/BackendApplicationTests.java | 42-47 | No @DisplayName annotations are used for human-readable specifications |
| 70 | Medium | test-quality | Parameterized Tests | src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 27-31 | Boundary and matrix checks are bundled instead of parameterized |
| 71 | High | performance | Duplicate query execution | src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing executes an avoidable second count query |
| 72 | High | performance | Duplicate query execution | src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search executes an avoidable second count query |
| 73 | High | performance | Pagination | src/main/java/com/skishop/service/ProductRequestOptions.java | 29-35 | Collection APIs are capped but not truly paginated |
| 74 | Medium | performance | JPA query optimization | src/main/java/com/skishop/service/ZeroHitQueryService.java | 64-67 | Zero-hit dashboard scans the same filtered range three times for summary metrics |
| 75 | Medium | performance | Query shape / indexing | src/main/java/com/skishop/service/ProductSpecifications.java | 39-44 | Product keyword search is non-sargable and existing indexes will not help contains matching |
| 76 | Medium | performance | Cache strategy | src/main/java/com/skishop/service/AiConsultationService.java | 45-47 | Stable product context is queried on every AI consultation without caching |
| 77 | Critical | resilience | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25-39 | Live AI provider call has no retry or circuit breaker protection |
| 78 | High | resilience | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | External AI call has no explicit connect/read or operation timeout |
| 79 | High | resilience | Graceful Shutdown | src/main/resources/application.yml | 33-42 | Graceful shutdown is not configured |
| 80 | High | resilience | Health Checks | src/main/resources/application.yml | 44-53 | No custom health/readiness signal exists for the AI provider dependency |
| 81 | Medium | resilience | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-35 | Live AI calls have no concurrency isolation |


## Escalation Items
| # | Priority | Source Agent | Description | Recommended Decision Maker |
|---:|---|---|---|---|
| 1 | high | tech-lead | Decide whether the zero-tolerance prohibited-pattern checklist applies to isolated unit tests. If tests are exempt for constructing the subject under test, the two Critical findings should be downgraded or removed and the standards should say so explicitly. | Repository tech lead / standards owner |
| 2 | normal | architecture | No design reference files were supplied for this review, so fidelity to `spec-design` or `design-docs` could not be checked beyond the provided AGENTS/agent-definition standards. | Tech lead / repository owner |
| 3 | normal | ddd-domain | Decide whether zero-hit recording must remain synchronously reflected in the search API response (`zeroHitRecorded=true`) or can become eventually consistent through a domain event listener. That product/API decision affects the correct transaction phase for the event handler. | Product owner and backend lead |
| 4 | high | api-endpoint | Decide whether to make zero-hit recording a breaking API change now. Fixing GET side effects requires frontend and design updates because backend-design.md currently documents GET /api/products/search as recording zero-hit demand. | Tech lead / product owner |
| 5 | normal | api-endpoint | Decide the migration timing for ProblemDetail because README currently documents a custom ApiErrorResponse payload while the review standard and modify plan recommend RFC 9457. | Backend lead / frontend lead |
| 6 | normal | async-concurrency | Decide whether the JPA zero-hit fallback is a supported runtime path or only a test/dev compatibility path. If it is supported, it needs a non-pinning, database-safe concurrency design; if not, removing it would reduce production concurrency risk. | Backend technical lead |
| 7 | high | error-logging | Confirm whether the frontend contract intentionally requires the custom `ApiErrorResponse` shape. Migrating to `ProblemDetail` satisfies the logging/error review standard but is a breaking API-contract change. | Backend lead and frontend owner |
| 8 | normal | error-logging | Decide whether production deployments should expose actuator `metrics` directly or via a platform-specific Prometheus/Micrometer pipeline. | Platform or operations owner |
| 9 | normal | data-access | Decide whether the project intentionally permits PostgreSQL UUID columns/java.util.UUID IDs despite the review agent's String UUID primary-key standard. If permitted, update the standards to avoid repeated false positives. | Backend tech lead |
| 10 | normal | data-access | Decide whether the non-PostgreSQL JPA fallback for zero-hit upserts is a supported runtime path. If it is supported, it needs a real concurrency control strategy; if not, it should be documented or removed. | Backend tech lead |
| 11 | high | config-di | Confirm whether production HTTPS is terminated by an upstream reverse proxy or must be configured in Spring Boot. No `server.ssl.*` settings or production deployment documentation were present in the reviewed backend files. | Platform/Security owner |
| 12 | normal | config-di | Decide whether in-memory admin sessions are acceptable for OSS demo-only operation. They are not suitable for multi-instance production without sticky sessions or a shared/token-backed session store. | Backend owner |
| 13 | high | security | Confirm deployment topology for trusted reverse proxies and whether X-Forwarded-For is stripped/replaced before reaching the app. Until confirmed, treat login throttling as bypassable. | Backend/platform owner |
| 14 | high | security | Decide whether Docker profile defaults are demo-only or production-capable. Runtime application profiles should not contain fallback credentials if this repo is intended for OSS release. | Project maintainer / release owner |
| 15 | normal | test-quality | Decide whether OSS release CI should enforce JaCoCo thresholds at overall-only, package, or class granularity. Current overall branch coverage is barely above 80%, while controller and specific service adapter branches are below target. | Backend maintainer / release owner |
| 16 | normal | performance | Confirm whether product and zero-hit collection endpoints are intentionally first-window only for the MVP, or whether OSS quality requires navigable pagination now. The performance recommendation is to add page metadata, but this is an API contract decision. | Product/API owner |
| 17 | high | resilience | Decide whether live AI availability should gate readiness. The application has a user-facing fallback, so making AI readiness non-gating may be correct, but operations still need visibility into provider outages. | Product owner and SRE/platform owner |


## Conflict Resolution Record
| # | Agent A | Agent B | Conflict Description | Tech-Lead Adjudication | Rationale |
|---:|---|---|---|---|---|
|  |  |  |  |  |  |

## Design Document Cross-Reference Results
1. tech-lead: spec-design/backend-design.md - Layering table separates Application Service from Repository/Infrastructure, but `ZeroHitAtomicUpsertGateway` is a JDBC `@Repository` class in the service package. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java)
2. tech-lead: spec-design/backend-design.md - The design marks `estimated_opportunity_loss` nullable, while migration V3 and `ZeroHitSearch` enforce NOT NULL. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/db/migration/V3__zero_hit_invariants.sql)
3. architecture: orchest-code-review-architecture package convention - Expected `model/` package for JPA entities is absent; entities are implemented under `entity/`. (src/main/java/com/skishop/entity/Product.java)
4. architecture: orchest-code-review-architecture package convention - Expected `dto/request/` and `dto/response/` package split is absent; request and response contracts are mixed in `dto/`. (src/main/java/com/skishop/dto/LoginRequest.java)
5. ddd-domain: DDD domain review checklist / AGENTS.md - Inter-aggregate coordination is implemented with direct service calls rather than domain events via `ApplicationEventPublisher`. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/service/ProductSearchService.java)
6. ddd-domain: DDD domain review checklist / AGENTS.md - Money-like domain values are not implemented as immutable value objects and are not embedded/converted consistently in entities. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java)
7. api-endpoint: ../spec-design/modify-issues/full-review-modify-plan.md - The modify plan recommends splitting zero-hit recording out of GET search and migrating errors to ProblemDetail, but the current implementation still records from GET /api/products/search and returns ApiErrorResponse. (src/main/java/com/skishop/service/ProductSearchService.java)
8. data-access: orchest-code-review-data-access Review Checklist: Entity Design - Primary key implementation uses java.util.UUID/PostgreSQL UUID and entity/domain/JDBC-side generation instead of String UUID generated in the service layer. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java)
9. data-access: orchest-code-review-data-access Review Checklist: Entity Design - Several @Column annotations omit explicit snake_case name attributes. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java)
10. data-access: orchest-code-review-data-access Review Checklist: Entity Design - Product audit timestamps use @PrePersist/@PreUpdate rather than @CreationTimestamp/@UpdateTimestamp. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/entity/Product.java)
11. config-di: AGENTS.md / DI-Configuration-Security review standard - Required profile separation is not present: no `application-dev.yml` or `application-prod.yml`. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources)
12. config-di: AGENTS.md / SecurityFilterChain order requirement - Security chain config places CSRF before CORS and omits explicit `headers(...)` configuration. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java)
13. security: AGENTS.md - Runtime config contains a default database password fallback, conflicting with the instruction not to commit passwords/secrets and to keep sample settings separate. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/resources/application-docker.yml)
14. security: orchest-code-review-security agent definition - Required security headers, especially CSP, Referrer-Policy, Permissions-Policy, HSTS, and Server suppression, are not explicitly configured. (/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/config/SecurityConfig.java)

## Incomplete Reviews
No incomplete reviews.

## Codex SDK Execution Summary
| Agent | Thread ID | Duration | Input Tokens | Cached Input Tokens | Output Tokens | Reasoning Tokens |
|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e93bc-701e-7d22-898b-aae5fbc56ff2 | 208035 | 605453 | 407040 | 11055 | 4888 |
| architecture | 019e93bc-701e-7340-97cd-0be050b2fdb2 | 167169 | 218205 | 161792 | 6658 | 2664 |
| ddd-domain | 019e93bc-701e-76e0-a8bb-afdfa2a5519e | 145876 | 362062 | 266752 | 7481 | 2699 |
| api-endpoint | 019e93bc-70b8-7992-a094-b5aed253619a | 143095 | 305020 | 194560 | 7625 | 2570 |
| java-standards | 019e93bc-701e-7463-a39c-d53f33e1a19c | 257964 | 1174207 | 1087488 | 13745 | 5203 |
| async-concurrency | 019e93bc-701e-76d2-a59b-064cf2417b88 | 124883 | 244788 | 174592 | 6323 | 2305 |
| error-logging | 019e93bc-701e-7e12-90e0-91f6924932ab | 141922 | 280194 | 218112 | 7471 | 2305 |
| data-access | 019e93be-57f0-7861-b021-9c1ca1c01c08 | 177019 | 265101 | 184832 | 10531 | 4506 |
| config-di | 019e93be-9a5a-77f0-8202-cb958155e669 | 139907 | 221630 | 167424 | 8507 | 3406 |
| security | 019e93be-9ef5-7862-adef-a413f2646242 | 183357 | 492933 | 416256 | 10828 | 3108 |
| dependency | 019e93be-a9d1-7652-affd-1de29bad7300 | 93418 | 125074 | 102912 | 5313 | 2389 |
| test-quality | 019e93be-fd07-7342-ba51-3e2b3f016c7c | 136143 | 523423 | 425472 | 7748 | 2402 |
| performance | 019e93bf-9c9e-7d51-9cdf-267a8d2dd408 | 170717 | 352229 | 302080 | 9440 | 3626 |
| resilience | 019e93c0-16ba-7261-abf9-795a31efd7a3 | 97874 | 151900 | 84480 | 5681 | 1729 |


## Individual Agent Detail Reports
### tech-lead

- Status: completed
- Verdict: fail
- Summary: Tech-lead review found project-wide prohibited-pattern violations in tests, plus medium-risk consistency gaps around package layering and coverage enforcement. Main production controller/service/repository boundaries are otherwise mostly aligned with the backend design.

# Source Code Review Report: Tech Lead

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 0 / Medium: 2 / Low: 2

## Prohibited Pattern Check Results
| # | Prohibited Pattern | Detection Count | Target File | Line |
|---|---|---:|---|---|
| 1 | System.out/System.err | 0 | - | - |
| 2 | Empty catch swallowing exceptions | 0 | - | - |
| 3 | Hardcoded production secrets | 0 | - | - |
| 4 | String-concatenated SQL | 0 | - | - |
| 5 | Direct `new ...Service(...)` | 4 | `AiConsultationServiceTests.java`, `AdminAuthServiceTests.java` | 27, 39, 59, 113 |
| 6 | `@Autowired` field injection | 0 | Constructor `@Autowired` only | - |
| 7 | Unchecked `Optional.get()` | 0 | `BearerTokenAuthenticationFilter` checks `isEmpty()` first | - |
| 8 | PII in logs | 0 observed | - | - |
| 9 | `java.util.Date` | 0 | - | - |
| 10 | Controller -> Repository direct reference | 0 | - | - |
| 11 | `@Transactional` on Controller | 0 | - | - |

## Design Document Alignment
| Design Document | Alignment Status | Deviation Details |
|---|---|---|
| `spec-design/backend-design.md` | Mostly aligned | Endpoints, DTOs, Spring Security policy, Flyway/JPA entity mapping mostly match. Deviations: JDBC repository gateway is in service package; opportunity-loss nullability is stricter than the doc. |
| `spec-design/zero-hit-radar-requirment.md` | Mostly aligned | Product/search/zero-hit/auth/AI runtime fallback behavior is reflected in code from static inspection. |
| `AGENTS.md` | Not aligned | Project-wide prohibited-pattern checklist is violated in tests; coverage target is not enforced. |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | Critical | Prohibited Pattern | `src/test/java/com/skishop/service/AiConsultationServiceTests.java` | 27 | Direct `new AiConsultationService(...)` for a DI-target class appears in test cases. | Use Spring-managed construction or document a test exemption. |
| 2 | Critical | Prohibited Pattern | `src/test/java/com/skishop/service/AdminAuthServiceTests.java` | 113 | Direct `new AdminAuthService(...)` and `new InMemoryLoginAttemptLimiter(...)`. | Use a test context or document a test exemption. |
| 3 | Medium | Layering Consistency | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 1 | JDBC `@Repository` gateway is packaged under `service`. | Move to repository/infrastructure package. |
| 4 | Medium | Quality Gate | `pom.xml` | 114 | JaCoCo report exists but no line/branch coverage check enforces 80%. | Add `jacoco:check` rules for LINE and BRANCH >= 0.80. |
| 5 | Low | KISS | `src/main/java/com/skishop/repository/ProductRepository.java` | 23 | Unused custom product query methods duplicate the Specification path. | Remove unused methods or use them consistently. |
| 6 | Low | Design Docs | `src/main/resources/db/migration/V3__zero_hit_invariants.sql` | 1 | Schema enforces NOT NULL where design doc says nullable. | Update docs or relax schema. |

## Inter-Agent Conflict Arbitration
No inter-agent conflict input was supplied. One escalation remains: whether test-only direct service construction is exempt from the prohibited-pattern checklist.

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Prohibited Pattern Compliance | 2/5 | Test-only direct service construction violates the supplied zero-tolerance rule. |
| Design Document Alignment | 4/5 | API/security/entity design mostly aligned; minor schema/package drift. |
| Code Consistency | 3/5 | Good controller/use-case boundaries; persistence gateway package and duplicate repository paths reduce consistency. |
| Naming Convention Compliance | 5/5 | Java naming is consistent. |
| **Overall Score** | **14/20** | Production code is generally coherent, but standards compliance is not clean. |

## Escalation Items
- Decide whether unit tests may construct the service under test directly. If yes, update the standards so future reviews do not classify this as Critical.

### architecture

- Status: completed
- Verdict: warning
- Summary: Architecture review found no Critical layer-direction violations, but there are High/Medium structural deviations in package placement and API/persistence boundary separation.

# Source Code Review Report: Architecture Review

## Summary
- **Review Target**: full backend
- **Verdict**: ⚠️ Warning
- **Issue Count**: Critical: 0 / High: 2 / Medium: 3 / Low: 0
- **Design references**: none supplied; reviewed against AGENTS and the architecture agent definition only.

## Layer Dependency Direction Check
| Package | Dependency Violation | Details |
|---|---|---|
| controller | None found | Controllers depend on service/use-case types and DTOs, not repositories. |
| service | Warning | Service package contains a `@Repository` JDBC gateway, blurring service vs data-access boundaries. |
| repository | None found | Repository interfaces extend Spring Data repositories and do not import service/controller packages. |

## Project Structure Check
| Package | Structure Compliance | Missing/Misplaced Packages |
|---|---|---|
| controller/service/repository/config/exception | Mostly compliant | Main classes are present in expected top-level packages. |
| model | Not compliant | Expected `model/` package is missing; JPA entities are under `entity/`. |
| dto/request and dto/response | Not compliant | DTOs are mixed in flat `dto/`. |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---|---|---|---|---|---|
| 1 | High | Project Structure | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 1 | A `@Repository` JDBC/native SQL gateway is implemented in `service/`. | Move to `repository/` or an approved infrastructure package. |
| 2 | High | Project Structure | `src/main/java/com/skishop/entity/Product.java` | 1 | JPA entities are under `entity/` instead of required `model/`. | Move entities to `model/` or update the architecture standard. |
| 3 | Medium | Project Structure | `src/main/java/com/skishop/dto/LoginRequest.java` | 1 | Request/response DTOs are mixed in a flat package. | Split into `dto.request` and `dto.response`. |
| 4 | Medium | Module Boundary Enforcement | `src/main/java/com/skishop/dto/ZeroHitItemDto.java` | 3 | API DTO imports persistence enum `Priority`. | Use a response enum/string or move shared enum to domain. |
| 5 | Medium | Spring Boot Configuration | `src/main/resources/application.yml` | 13 | Dev/prod profile separation is incomplete. | Add explicit dev/prod profile config or update the standard. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Layer Dependency Direction | 5/5 | No controller→repository or reverse package dependencies found. |
| Project Structure | 3/5 | Entity/model, DTO split, and repository placement deviations. |
| Module Boundary Enforcement | 3/5 | DTO mapping exists, but response DTO depends on persistence enum and data-access gateway lives in service. |
| Spring Boot Configuration | 4/5 | Main app and SecurityConfig are present; profile separation is incomplete. |
| Separation of Concerns | 4/5 | Controllers are generally thin and transactions are service-side. |
| **Total Score** | **19/25** | No Critical violations, but structural cleanup is needed before the architecture can be considered fully compliant. |

## Escalation Items (Requires Human Judgment)
- Decide whether `entity/` is intentionally accepted instead of `model/`; if yes, update the architecture standard to avoid repeated false positives.
- Decide whether `Priority` is a persistence-only enum or a shared domain/API enum.

### ddd-domain

- Status: completed
- Verdict: fail
- Summary: DDD domain review found no child-entity repository violations, but the implementation has High-severity issues: inter-aggregate coordination is done by direct service calls, PostgreSQL upsert SQL bypasses aggregate/domain policy behavior, and monetary concepts are not modeled as immutable value objects.

# Source Code Review Report: DDD Domain Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 3 / Medium: 1 / Low: 0

## Aggregate Root Boundary Check
| Service | Aggregate Root | Boundary Compliance | Violation Details |
|---------|---------------|--------------------|--------------------|
| ProductSearchService | Product / ZeroHitSearch | ⚠️ Warning | Directly coordinates zero-hit recording via service call instead of domain event. |
| ZeroHitRecordingService | ZeroHitSearch | ⚠️ Warning | JPA fallback mutates through aggregate, but PostgreSQL path delegates to SQL upsert that bypasses aggregate methods. |
| ProductQueryService | Product | ✅ Pass | Read-only query use case only. |
| ZeroHitQueryService | ZeroHitSearch | ✅ Pass | Read-only query use case only. |

## Value Object Check
| Target | Immutability | Record Usage | Validation | @Embeddable |
|--------|-------------|-------------|------------|-------------|
| ZeroHitDemandSignals | ✅ Immutable | ✅ record | ✅ compact constructor | N/A |
| Product.price | ⚠️ BigDecimal only | ❌ no Money record | ⚠️ DB-only non-negative check | ❌ none |
| ZeroHitSearch.estimatedOpportunityLoss | ⚠️ BigDecimal only | ❌ no Money record | ⚠️ aggregate validates non-negative, but no Money VO | ❌ none |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|----------|----------|-------------|------|---------|-------------|
| 1 | High | Domain Event Design | src/main/java/com/skishop/service/ProductSearchService.java | 63 | Zero-hit recording is coupled by direct service call instead of domain event. | Publish an immutable zero-hit detected event via ApplicationEventPublisher and handle it in a listener. |
| 2 | High | Aggregate Root Boundary | src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java | 25 | Native SQL upsert bypasses ZeroHitSearch aggregate behavior and duplicates hit-count, priority, and loss rules. | Use aggregate mutation under locking/unique retry, or heavily constrain the native path so it cannot drift from domain policy. |
| 3 | High | Value Object Implementation | src/main/java/com/skishop/entity/Product.java | 40 | Monetary concepts are raw BigDecimal fields instead of Money value objects. | Introduce immutable Money VO and embed/convert it for persistence. |
| 4 | Medium | Domain Logic Encapsulation | src/main/java/com/skishop/entity/Product.java | 73 | Product aggregate does not enforce blank text or non-negative price invariants itself. | Add constructor/factory validation or dedicated value objects. |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|----------------|-------------|-------|
| Aggregate Root Boundary | 3/5 | No child repositories, but native upsert bypasses aggregate behavior. |
| Value Object Implementation | 2/5 | DTO records are good; money-like domain values lack VO modeling. |
| Domain Event Design | 1/5 | No domain event implementation; direct service coordination is used. |
| Repository Pattern | 3/5 | One repository per aggregate, but repository/gateway contains business calculations. |
| Domain Logic Encapsulation | 3/5 | ZeroHitSearch has behavior; Product remains mostly anemic and SQL duplicates rules. |
| Ubiquitous Language | 5/5 | Names such as ZeroHitSearch, OpportunityLoss, Priority, and DemandSignals are clear and consistent. |
| **Total Score** | **17/30** | |

## Escalation Items (Requires Human Judgment)
- Decide whether zero-hit recording should be synchronous in the search journey or event-driven/eventually consistent, because that determines the correct event listener transaction phase.


### api-endpoint

- Status: completed
- Verdict: fail
- Summary: Reviewed the full backend from the API endpoint perspective. No legacy .do mappings were found and the implemented URLs match the documented /api contract, but there are High-severity endpoint design gaps: GET search performs a write, and API errors use a custom payload rather than Spring ProblemDetail/RFC 9457.

# Source Code Review Report: API Endpoint Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 2 / Medium: 2 / Low: 1

## Endpoint List and Compliance
| Endpoint | HTTP Method | Separation | Validation | Authorization | @AuthenticationPrincipal |
|----------|------------|-----------|-----------|--------------|-------------------------|
| `/api/products` | GET | REST controller delegates to use case | Query params bounded | Public | N/A |
| `/api/products/search` | GET | REST controller delegates to use case | Query params bounded | Public | N/A |
| `/api/auth/login` | POST | REST controller delegates to use case | `@Valid @RequestBody`, but fields lack `@Size` | Public | N/A |
| `/api/auth/me` | GET | REST controller delegates to use case | N/A | Authenticated | Missing; manual `Authentication` cast |
| `/api/auth/logout` | POST | REST controller delegates to use case | N/A | Authenticated | Uses `Authentication` for token credential |
| `/api/admin/zero-hits` | GET | REST controller delegates to use case | Query params bounded | `ROLE_ADMIN` via SecurityConfig | N/A |
| `/api/admin/ai-consult` | POST | REST controller delegates to use case | `@Valid @RequestBody` | `ROLE_ADMIN` via SecurityConfig | N/A |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | High | HTTP Method Semantics | `src/main/java/com/skishop/controller/ProductController.java` | 51 | `GET /api/products/search` can record zero-hit demand via `ProductSearchService` lines 63-65. | Split mutation into `POST /api/zero-hit-searches` or `POST /api/products/search-events`. |
| 2 | High | Error Response Design | `src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 25 | Errors return custom `ApiErrorResponse` rather than Spring `ProblemDetail` / RFC 9457. | Return `ProblemDetail` with stable extension properties. |
| 3 | Medium | Parameter Binding | `src/main/java/com/skishop/controller/AuthController.java` | 46 | `/api/auth/me` manually casts `Authentication.getPrincipal()`. | Use `@AuthenticationPrincipal AdminUserDto user`. |
| 4 | Medium | Input Validation | `src/main/java/com/skishop/dto/LoginRequest.java` | 11 | Login fields are `@NotBlank` but not length-limited. | Add `@Size` bounds to username and password. |
| 5 | Low | URL Convention | `src/main/java/com/skishop/controller/AdminZeroHitController.java` | 19 | Admin controllers lack class-level `@RequestMapping` base paths. | Use `@RequestMapping("/api/admin")` and relative method mappings. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Spring MVC Controller Pattern | 4/5 | REST controller pattern is intentional for this backend; admin base mappings are inconsistent. |
| REST Convention Compliance | 2/5 | No `.do` URLs, but GET search performs a write. |
| Input Validation | 4/5 | Validation is generally present; login fields lack explicit size limits. |
| Error Response | 2/5 | Stack traces disabled, but responses are not ProblemDetail/RFC 9457. |
| Parameter Binding | 3/5 | Current-user endpoint does not use `@AuthenticationPrincipal`. |
| **Total Score** | **15/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether the zero-hit recording endpoint split should be treated as a breaking API change now.
- Decide migration timing from custom `ApiErrorResponse` to Spring `ProblemDetail` because frontend normalization and README examples are affected.

### java-standards

- Status: completed
- Verdict: fail
- Summary: Java 21/Spring Boot coding-standards review found no production prohibited-pattern hits, but failed due mandatory high-severity DI, naming, and null-safety standard violations.

# Source Code Review Report: Java 21 Coding Standards Review

## Summary
- **Review Target**: full backend
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 0 / High: 5 / Medium: 0 / Low: 0

## Prohibited Pattern Detection Results
| # | Pattern | Count | Target File | Line # |
|---|---------|-------|-------------|--------|
| - | Production prohibited patterns reviewed | 0 | - | - |

## Incomplete / Shortcut Implementation Detection Results
| # | Type | Detection | Target File | Line # | Details |
|---|------|-----------|-------------|--------|---------|
| - | TODO/FIXME/placeholder/UnsupportedOperationException/mock-dummy production contamination | 0 | - | - | No production Java hits found. |

## Naming Convention Check Results
| File | Violation Location | Current Name | Recommended Name |
|------|-------------------|-------------|-----------------|
| src/main/java/com/skishop/controller/AuthController.java | line 46 | me | getCurrentUser |
| src/main/java/com/skishop/repository/ProductRepository.java | line 55 | averagePrice | findAveragePrice or calculateAveragePrice |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|----------|----------|-------------|--------|-------------------|-------------|
| 1 | High | DI Pattern Quality | src/main/java/com/skishop/service/ProductSearchService.java | 24 | Concrete DI-managed service/repository boundaries bypass the required interface segregation. | Add ZeroHitRecordingUseCase/port and inject the interface. |
| 2 | High | Naming Conventions | src/main/java/com/skishop/controller/AuthController.java | 46 | Public endpoint method is not verb-first. | Rename me() to getCurrentUser(). |
| 3 | High | Naming Conventions | src/main/java/com/skishop/repository/ProductRepository.java | 55 | Repository method is not verb-first. | Rename averagePrice() to findAveragePrice(). |
| 4 | High | Null Safety | src/main/java/com/skishop/domain/KeywordNormalizer.java | 19 | Parameter accepts null but is not annotated. | Add @Nullable to keyword. |
| 5 | High | Null Safety | src/main/java/com/skishop/service/AiConsultationService.java | 110 | Parameter accepts null but is not annotated. | Add @Nullable to values. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Naming Conventions | 3/5 | Two method naming violations found. |
| Java 21 Feature Adoption | 4/5 | DTOs use records; switch expressions and text blocks are present. |
| Prohibited Pattern Compliance | 5/5 | No production prohibited-pattern hits found. |
| DI Pattern Quality | 3/5 | Constructor injection is good, but interface segregation is incomplete. |
| Null Safety | 4/5 | Nullable intent is mostly explicit, with two missing annotations. |
| **Total Score** | **19/25** | |

## Escalation Items (Requires Human Judgment)
None.

Note: Tests/build were not run; this was a source-only standards review.

### async-concurrency

- Status: completed
- Verdict: fail
- Summary: Async/concurrency review found 2 Critical and 2 High issues. The code has no Spring async/scheduled/future fire-and-forget patterns, but it is not virtual-thread enabled and contains synchronized blocks around JDBC/JPA I/O that would pin virtual-thread carrier threads once enabled.

# Source Code Review Report: Async Processing & Concurrency Control Review

## Summary
- **Review Target**: full backend source under `/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend`
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 2 / Medium: 0 / Low: 0

## Virtual Thread Compatibility Matrix
| Class / Method | synchronized over I/O | ThreadLocal risk | ReentrantLock used | Verdict |
|---|---:|---:|---:|---|
| `ZeroHitRecordingService.recordWithJpaFallback` | Yes, JPA repository read/save inside monitor | None found | No | ❌ Critical |
| `ZeroHitAtomicUpsertGateway.supportsAtomicUpsert` | Yes, JDBC metadata lookup inside monitor | None found | No | ❌ Critical |
| Controllers/services overall | Synchronous request processing | None found | No | ⚠️ Virtual threads not enabled |

## Blocking Call Detection Results
| # | Pattern | File | Line # | Context |
|---|---|---|---:|---|
| 1 | Blocking JDBC/JPA inside `synchronized` | `src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 86 | fallback zero-hit upsert uses repository I/O while holding monitor |
| 2 | Blocking JDBC metadata lookup inside `synchronized` | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 81 | lazy support detection calls `dataSource.getConnection()` via `databaseProductName()` |

No production `CompletableFuture.get()`, `.join()`, `Future.get()`, `Thread.sleep()`, `CountDownLatch.await()` without timeout, `@Async`, custom executor, or `@Scheduled` usage was found. Test code uses `Future.get(timeout)` and latch awaits with timeouts only.

## @Scheduled / Background Task Quality Check
| Task Name | Exception Handling | Graceful Shutdown | Thread Pool Config | Backoff | Verdict |
|---|---|---|---|---|---|
| None found | N/A | N/A | N/A | N/A | ✅ No scheduled/background task surface |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|---|---|---|---:|---|---|
| 1 | Critical | Virtual Threads / Pinning | `src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 86 | JPA lookup/save occurs inside `synchronized`, pinning virtual-thread carriers and serializing fallback writes. | Use database upsert/constraint retry; if a JVM lock remains, use `ReentrantLock` and avoid holding it across JDBC where possible. |
| 2 | Critical | Virtual Threads / Pinning | `src/main/java/com/skishop/service/ZeroHitAtomicUpsertGateway.java` | 81 | `supportsAtomicUpsert()` performs database metadata I/O inside `synchronized (this)`. | Initialize outside a monitor or use a non-monitor lazy-init strategy. |
| 3 | High | Virtual Thread Adoption | `src/main/resources/application.yml` | 1 | `spring.threads.virtual.enabled=true` is not configured for Spring Boot 3.2 / Java 21. | Add the property to common config after fixing monitor-wrapped I/O. |
| 4 | High | Thread Safety | `src/main/java/com/skishop/service/AdminAuthService.java` | 125 | Active-token limit uses non-atomic count/remove/put over a `ConcurrentHashMap`. | Guard the complete token issuance invariant with a small lock. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Virtual Thread Adoption | 1/5 | Java 21 is configured, but Spring virtual threads are not enabled and monitor-wrapped I/O must be fixed first. |
| Blocking Call Absence | 3/5 | No future joins/sleeps; blocking JDBC occurs inside synchronized sections. |
| CompletableFuture / @Async Correctness | 5/5 | No production `@Async` or `CompletableFuture` usage found. |
| @Scheduled / Background Task Quality | 5/5 | No scheduled/background task code found. |
| Thread Safety | 2/5 | Zero-hit fallback locking is unsafe for virtual threads; admin session cap has a compound race. |
| **Total Score** | **16/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether the JPA zero-hit fallback is a supported runtime path. If supported, it needs a non-pinning database-safe concurrency design; if not, removing it would simplify the concurrency model.

### error-logging

- Status: completed
- Verdict: fail
- Summary: Exception swallowing, PII logging, string-concatenated log statements, and System.out logging were not found in production code. The review fails on missing correlation ID/MDC propagation, non-RFC7807 error payloads, incomplete production log configuration, and failure logs that omit stack traces.

# Source Code Review Report: Exception Handling & Logging Review

## Summary
- **Review Target**: backend / full
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 5 / Medium: 2 / Low: 0

## Exception Handling Check Results
| File | Swallowing | throw e; | Logging in catch | Verdict |
|------|-----------|----------|------------------|---------|
| `SpringAiProviderClient.java` | No | No | Propagates with cause | ✅ |
| `AiConsultationService.java` | No | No | Missing throwable in catch log | ❌ |
| `ZeroHitAtomicUpsertGateway.java` | No | No | Wraps with cause | ✅ |
| `GlobalExceptionHandler.java` | No | No | 500 handler omits throwable | ❌ |

## PII Logging Detection Results
| # | File | Line Number | Detected PII Item | Suggested Fix |
|---|------|-------------|-------------------|---------------|
| - | - | - | No direct production PII logging found | Keep avoiding raw username, password, bearer token, prompt, and raw keyword logging |

## Structured Logging Quality Check
| File | Placeholder Format | String Concatenation | System.out.println | Verdict |
|------|--------------------|---------------------|--------------------|---------|
| Production Java sources | Used consistently | Not found | Not found | ⚠️ Missing JSON Logback configuration |

## Correlation ID (MDC) Implementation Status
| Module | Filter/Interceptor | Response Header | MDC Logging | MDC Cleanup |
|--------|-------------------|-----------------|-------------|-------------|
| Backend API | Missing | Missing | Missing | Missing |

## Findings
| # | Severity | Category | Target File | Line Number | Finding | Suggested Fix Code |
|---|----------|----------|-------------|-------------|---------|-------------------|
| 1 | High | Correlation ID / MDC | `src/main/java/com/skishop/config/RequestLoggingFilter.java` | 29 | No request correlation ID or MDC propagation | Add `MDC.put`, response `X-Correlation-Id`, and `MDC.clear()` in `finally` |
| 2 | High | Exception Handling | `src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 121 | Unexpected exception log omits stack trace | Pass `exception` as final SLF4J argument |
| 3 | High | Exception Handling | `src/main/java/com/skishop/service/AiConsultationService.java` | 57 | AI provider catch log omits throwable | Log error type and throwable without prompt/secrets |
| 4 | High | RFC7807 | `src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 37 | Error responses use custom `ApiErrorResponse`, not `ProblemDetail` | Return `ProblemDetail` with extension fields |
| 5 | High | Structured Logging | `pom.xml` | 45 | No logstash encoder or `logback-spring.xml` | Add JSON Logback configuration |
| 6 | Medium | Exception Hierarchy | `src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 69 | Broad `IllegalArgumentException` mapping hides business vs validation semantics | Add domain-specific exception hierarchy |
| 7 | Medium | Observability | `src/main/resources/application.yml` | 44 | Actuator exposes health only, not metrics | Include metrics in controlled environments |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Exception Handling | 2/5 | Central handler exists and responses are sanitized, but no `ProblemDetail`, weak hierarchy, and key logs omit throwables |
| Structured Logging Quality | 3/5 | Placeholder format is good; JSON/logstash config missing |
| PII Logging Compliance | 5/5 | No direct PII logging found; keyword logging uses hash/length |
| Correlation ID (MDC) | 0/5 | No implementation found |
| Observability Integration | 3/5 | Actuator health exists; metrics/log/tracing integration incomplete |
| **Overall Score** | **13/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether custom `ApiErrorResponse` is an intentional frontend contract before migrating to `ProblemDetail`.
- Decide metrics exposure strategy for production environments.

### data-access

- Status: completed
- Verdict: fail
- Summary: Data-access review found 2 Critical, 5 High, and 2 Medium issues. The schema is Flyway-managed, OSIV is disabled, and list queries are bounded, but the implementation deviates from the review agent's entity conventions and has transaction/timestamp risks around zero-hit persistence.

# Source Code Review Report: Data Access Layer Review

## Summary
- **Review Target**: backend full
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 5 / Medium: 2 / Low: 0
- **Execution**: Static review only; no files modified.

## Entity Design Check
| Entity | @Table | @Column Coverage | java.time Usage | Collection Init | @Version | Verdict |
|--------|--------|------------------|-----------------|-----------------|----------|---------|
| Product | OK | Missing explicit `name` on multiple columns | Uses `Instant`; audit callbacks use `Instant.now()` | N/A | Missing; probably low risk for seeded read model | ⚠️ |
| ZeroHitSearch | OK | Missing explicit `name` on id/keyword/priority | Uses `Instant`; JDBC path uses `java.sql.Timestamp` | N/A | Missing despite aggregate update risk | ❌ |

## Query Quality Check
| File | Method | readOnly TX | N+1 Risk | DTO Projection | Pagination | Verdict |
|------|--------|-------------|----------|----------------|------------|---------|
| ProductQueryService | listProducts | OK | Low | Entity mapped after load | OK | ⚠️ |
| ProductSearchService | search | Write TX | Low | Entity mapped after load | OK | ⚠️ |
| ZeroHitQueryService | listZeroHits | OK | Low | Entity mapped after load | OK | ⚠️ |
| AiConsultationService | consult | OK | Low | Scalar list queries | N/A | ✅ |

## Transaction Management Check
| File | Method | @Transactional | Rollback Rule | Event Publishing | Verdict |
|------|--------|----------------|---------------|------------------|---------|
| ProductSearchService | search | Present | Default unchecked rollback | N/A | ✅ |
| ZeroHitRecordingService | record | Missing on public mutating method; PostgreSQL branch not wrapped | N/A | N/A | ❌ |
| Controllers | All reviewed | No controller transactions found | N/A | N/A | ✅ |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|----------|----------|-------------|------|---------|-------------|
| 1 | Critical | Repository Configuration | application.yml | 14 | JDBC URL fallback is hardcoded | Require env var; move local defaults to local profile/compose |
| 2 | Critical | Date/Time Persistence | ZeroHitAtomicUpsertGateway.java | 7,100 | `java.sql.Timestamp` used for upsert binding | Bind java.time value with explicit UTC/TIMESTAMPTZ policy |
| 3 | High | Entity Design | Product.java / ZeroHitSearch.java | 24-26 | IDs use UUID and are generated outside service layer | Use String UUID service-generated IDs or document approved exception |
| 4 | High | Entity Design | Product.java | 25-40 | Several columns omit explicit `name` | Add `@Column(name = "...")` |
| 5 | High | Entity Design | ZeroHitSearch.java | 24-38 | Several columns omit explicit `name` | Add `@Column(name = "...")` |
| 6 | High | Entity Design | Product.java | 50-101 | Audit timestamps do not use `@CreationTimestamp` / `@UpdateTimestamp` | Replace manual callbacks for audit fields |
| 7 | High | Transaction Management | ZeroHitRecordingService.java | 59-73 | Public write method lacks explicit transaction on PostgreSQL path | Add `@Transactional` or wrap both branches in TransactionTemplate |
| 8 | Medium | Optimistic Locking | ZeroHitSearch.java | 23-47 | No `@Version` for mutable aggregate | Add version column and conflict handling or remove fallback |
| 9 | Medium | Query Quality | ProductQueryService.java | 43-45 | Read APIs load full entities instead of DTO projections | Return DTO/interface projections from repositories |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|----------------|-------------|-------|
| Entity Design | 2/5 | Tables exist, but ID, column naming, audit, and version conventions diverge |
| Query Quality | 3/5 | Bounded queries and no associations; projections are missing |
| Transaction Management | 3/5 | Main search path is transactional, but zero-hit write service is not self-contained |
| Optimistic Locking | 2/5 | Atomic PostgreSQL upsert helps, but entity/fallback path has no versioning |
| Flyway Migration | 4/5 | Migrations exist and use valid names; schema lacks version column and uses timestamp choices that should be revisited |
| **Total Score** | **14/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether PostgreSQL UUID/java.util.UUID IDs are an approved project exception to the String UUID standard.
- Confirm whether the non-PostgreSQL JPA fallback is a supported runtime path requiring optimistic locking/retry behavior.

### config-di

- Status: completed
- Verdict: fail
- Summary: DI/config/security-chain review found Critical issues: a Docker profile ships a literal datasource password fallback, and singleton auth state has a non-atomic token-limit path. Security headers and profile separation also need work before OSS-quality release.

# Source Code Review Report: DI / Configuration / Security Filter Chain Review

## Summary
- **Review Target**: full backend
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 3 / Medium: 2 / Low: 0

## Spring Security Filter Chain Check
| # | Expected Configuration | Actual Configuration | Verdict |
|---|----------------------|---------------------|---------|
| 1 | `@ControllerAdvice` global exception handler | `GlobalExceptionHandler` has `@RestControllerAdvice` | ✅ |
| 2 | CORS before authentication | CORS exists, but appears after CSRF in DSL | ⚠️ |
| 3 | CSRF configuration | Disabled for stateless API, but before CORS | ⚠️ |
| 4 | Session management | `STATELESS` configured | ✅ |
| 5 | Request authorization | Public product/login/health; admin requires `ROLE_ADMIN` | ✅ |
| 6 | Authentication provider / JWT filter | Bearer filter registered before `UsernamePasswordAuthenticationFilter` | ✅ |
| 7 | Security headers | No explicit `headers(...)`; CSP absent | ❌ |

## DI Registration Check
| Bean | Stereotype | Scope | Injection Method | Issue | Verdict |
|------|-----------|-------|-----------------|-------|---------|
| `SecurityConfig` | `@Configuration` | Singleton | Constructor | No DI issue | ✅ |
| `BearerTokenAuthenticationFilter` | `@Component` | Singleton | Constructor | No DI issue | ✅ |
| `AdminAuthService` | `@Service` | Singleton | Constructor | Mutable session state with non-atomic token cap | ❌ |
| `InMemoryLoginAttemptLimiter` | `@Service` | Singleton | Constructor | Concurrent map used; no direct DI issue | ✅ |
| Repositories | Spring Data / `@Repository` gateway | Singleton | Constructor where applicable | JPA repositories extend `JpaRepository` | ✅ |

## application*.properties Secret Detection
| File | Detected Secret | Type | Remediation |
|------|----------------|------|-------------|
| `src/main/resources/application-docker.yml:5` | `${SPRING_DATASOURCE_PASSWORD:skishop}` | Hardcoded password fallback | Require env var; remove literal default |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | Critical | Secret Detection | `application-docker.yml` | 5 | Docker runtime profile defaults DB password to `skishop` | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 2 | Critical | Singleton State | `AdminAuthService.java` | 41 | Shared sessions with non-atomic active-token limit | Synchronize issue path or use external session store |
| 3 | High | Security Chain Order | `SecurityConfig.java` | 57 | CSRF appears before CORS | Move `.cors(...)` before `.csrf(...)` |
| 4 | High | Security Headers | `SecurityConfig.java` | 80 | Missing explicit headers/CSP | Add `headers(...)` DSL |
| 5 | High | Profile Separation | `src/main/resources` | n/a | Missing dev/prod profile files | Add `application-dev.yml` and `application-prod.yml` |
| 6 | Medium | Type-Safe Config | `AdminProperties.java` | 14 | Config records lack validation | Add `@Validated` and constraints |
| 7 | Medium | Logging | `src/main/resources` | n/a | No `logback-spring.xml` or prod log levels | Add profile logging config |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| DI Registration Quality | 3/5 | Constructor injection is good; singleton mutable auth state needs tightening |
| Security Filter Chain | 3/5 | Authorization and bearer filter exist; order/header requirements not fully met |
| Application Properties Quality | 2/5 | OSIV and stacktrace are safe; Docker password fallback and profile split fail |
| Type-Safe Configuration | 3/5 | Uses `@ConfigurationPropertiesScan`; validation is missing |
| Security Settings | 3/5 | CORS is explicit but not validated; headers/logging/TLS posture incomplete |
| **Total Score** | **14/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm production TLS termination strategy: Spring Boot SSL vs reverse proxy.
- Decide whether in-memory admin sessions are acceptable beyond a single-instance OSS demo.


### security

- Status: completed
- Verdict: fail
- Summary: Security review found 2 Critical, 3 High, and 1 Medium issues. The highest risks are bypassable login throttling via trusted client-supplied forwarding headers and default Docker database credentials.

# Source Code Review Report: Security Review

## Summary
- **Review Target**: `/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend` full backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 3 / Medium: 1 / Low: 0
- **Execution Note**: Static read-only review only. Tests were not executed.

---

## Phase A: Implementation Compliance Check

### OWASP Top 10 Check Results
| # | Category | Findings | Count | Verdict |
|---|---|---:|---:|---|
| A01 | Broken Access Control | Admin URL policy uses `/api/admin/**.hasRole("ADMIN")` and default authenticated fallback. Login throttling source identity is spoofable. | 1 | ❌ |
| A02 | Cryptographic Failures | Docker profile has default DB password; `{noop}` admin password accepted by production code. | 2 | ❌ |
| A03 | Injection | No string-concatenated SQL found. JPQL/native SQL use constants and named parameters. | 0 | ✅ |
| A07 | XSS | No templates/JSP found in backend target. Security header gaps remain. | 0 direct | ⚠️ |
| A08 | Mass Assignment | Controllers bind request DTO records, not JPA entities. | 0 | ✅ |
| A10 | SSRF | No direct user-controlled URL fetches found; Spring AI endpoint is configured from server-side properties. | 0 | ✅ |

### Authentication/Authorization Check
| Endpoint | Auth Required | Role Restriction | IDOR Prevention | Verdict |
|---|---|---|---|---|
| `GET /actuator/health/**` | No | N/A | N/A | ✅ |
| `GET /api/products`, `/api/products/search` | No | N/A | N/A | ✅ public, bounded params |
| `POST /api/auth/login` | No | N/A | N/A | ❌ rate-limit source spoofable |
| `GET /api/auth/me`, `POST /api/auth/logout` | Yes | Any authenticated bearer | N/A | ✅ |
| `/api/admin/**` | Yes | `ROLE_ADMIN` | N/A for singleton admin/read-only data | ✅ |

### Hardcoded Secret Check
| File | Location | Secret Type | Remediation |
|---|---:|---|---|
| `src/main/resources/application-docker.yml` | 3-5 | Default DB username/password fallback | Require env vars; move demo values to `.env.example` or compose-only smoke config. |

### Security Header Check
| Header | Expected | Actual | Verdict |
|---|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Spring Security default likely present | ⚠️ not explicit |
| `X-Frame-Options` | `DENY` | Spring Security default likely present | ⚠️ not explicit |
| `Content-Security-Policy` | `default-src 'self'` or API-appropriate policy | Not configured | ❌ |
| `Strict-Transport-Security` | Enabled over HTTPS | Not configured explicitly | ❌ |
| `Server` | Suppressed | Not configured | ❌ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Not configured | ❌ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Not configured | ❌ |

### Struts Legacy Pattern Check
| Pattern | Files Found | Risk | Remediation |
|---|---:|---|---|
| Struts imports/classes | 0 | None found | N/A |
| `request.getParameter()` direct use | 0 | None found | N/A |
| `@Autowired` field injection in main | 0 | None found | N/A |
| `System.out` / `printStackTrace` in main | 0 | None found | N/A |

---

## Phase B: Attacker's Perspective Attack Resistance Analysis

### STRIDE Attack Resistance Summary
| STRIDE Category | Scenarios Verified | Sufficient | Insufficient | Unmitigated | Highest Risk |
|---|---:|---:|---:|---:|---|
| S: Spoofing | 4 | 2 | 1 | 1 | Critical |
| T: Tampering | 4 | 4 | 0 | 0 | Low |
| R: Repudiation | 3 | 1 | 2 | 0 | Medium |
| I: Information Disclosure | 5 | 4 | 1 | 0 | High |
| D: Denial of Service | 5 | 2 | 3 | 0 | High |
| E: Elevation of Privilege | 4 | 3 | 1 | 0 | Medium |

### Business Logic Attack Resistance
| # | Attack Scenario | Target Component | Defense Exists | Risk | Verdict |
|---|---|---|---|---|---|
| BL-1 | Zero-hit concurrent upsert race | `ZeroHitAtomicUpsertGateway` | PostgreSQL `ON CONFLICT` atomic upsert | Low | ✅ |
| BL-2 | Public search flooding records many zero-hit rows | `ProductSearchService` / `ZeroHitRecordingService` | Keyword length bounded, DB unique normalized keyword | Medium | ⚠️ no global public rate limit |
| BL-3 | AI consult abuse/cost amplification | `AiConsultController` | Admin-only, request size validation | Medium | ⚠️ no body-level limit/global quota |

### Session Management Security
| # | Attack Scenario | Defense Exists | Risk | Verdict |
|---|---|---|---|---|
| SM-1 | Session fixation | Stateless bearer auth, no server session login | Low | ✅ |
| SM-2 | Long-lived token | Token TTL defaults to 8h | Medium | ⚠️ acceptable but should be deployment-tunable |
| SM-3 | Concurrent session abuse | Max 3 active tokens per admin, oldest invalidated | Medium | ⚠️ not single-session but bounded |
| SM-4 | Token theft | Opaque 32-byte random token, not logged | Medium | ✅ |
| SM-5 | Cookie flags | No auth cookie used | Low | ✅ |

### Attack Scenario Detailed Analysis
| # | Severity | STRIDE / BL / SM | Attack Scenario | Target File | Line # | Attack Method | Current Defense | Recommended Mitigation | Fix Code Example |
|---|---|---|---|---|---:|---|---|---|---|
| 1 | Critical | S / D | Credential stuffing bypass | `AuthController.java` | 60 | Rotate `X-Forwarded-For` per attempt | Per username+source limiter | Trust forwarding headers only from known proxy; edge limiter | `String sourceIp = trustedProxy(request) ? parsedForwardedFor(request) : request.getRemoteAddr();` |
| 2 | Critical | I / Config | Predictable DB credential | `application-docker.yml` | 3 | Deploy Docker profile without env override | Env override possible | Remove fallback secret | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 3 | High | I / Config | Missing browser defense headers | `SecurityConfig.java` | 55 | Browser MIME/embed/referrer policy abuse | Spring defaults only partial | Add explicit `.headers(...)` | `.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))` |
| 4 | High | D | Large JSON body DoS | `application.yml` | 33 | Send oversized JSON body to login/AI endpoint | Form-post limit only | JSON content-length/body filter or gateway 413 | `if (len > max) response.sendError(413);` |
| 5 | High | D | Limiter memory exhaustion | `InMemoryLoginAttemptLimiter.java` | 23 | Many random username/IP pairs | ConcurrentHashMap, no eviction | Bounded TTL cache or external limiter | Use Caffeine/Redis TTL keys |
| 6 | Medium | E / Config | Plaintext admin password misconfiguration | `SecurityConfig.java` | 90 | Set `ADMIN_PASSWORD={noop}...` in production | Delegating encoder accepts it | Reject `{noop}` outside tests | Validate property at startup |

---

## Consolidated Findings
| # | Severity | Phase | Category | Target File | Line # | Finding | Fix Code Example |
|---|---|---|---|---|---:|---|---|
| 1 | Critical | A/B | A01/A07 Spoofing | `AuthController.java` | 60 | Client-controlled forwarding header bypasses login rate limiting | Use trusted proxy handling or `remoteAddr` |
| 2 | Critical | A | A02 Secrets | `application-docker.yml` | 3 | Default DB credentials in runtime profile | `${SPRING_DATASOURCE_PASSWORD}` without fallback |
| 3 | High | A/B | Security headers | `SecurityConfig.java` | 55 | Missing CSP/HSTS/referrer/permissions/server suppression | Add `.headers(...)` block |
| 4 | High | B | DoS | `application.yml` | 33 | JSON body size not bounded by current config | Add body limit filter/gateway limit |
| 5 | High | B | DoS | `InMemoryLoginAttemptLimiter.java` | 23 | Unbounded login limiter state | Bounded TTL cache / Redis limiter |
| 6 | Medium | A | Password hashing | `SecurityConfig.java` | 90 | `{noop}` accepted without production guard | Reject non-adaptive encoders outside test |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Injection Prevention | 5/5 | Parameterized JPQL/JDBC; no command execution found. |
| Authentication/Authorization | 3/5 | Admin URL policy good; login throttling source spoofable. |
| Secret Management | 2/5 | Docker default DB password fallback. |
| Security Headers | 2/5 | Missing explicit CSP/HSTS/referrer/permissions/server suppression. |
| CSRF Protection | 4/5 | CSRF disabled, but API uses stateless Authorization header and no credentialed CORS. |
| Rate Limiting / DoS Defense | 2/5 | Login limiter exists but bypassable/unbounded; JSON body limit missing. |
| Spoofing Attack Resistance (S) | 3/5 | Opaque tokens strong; brute-force path weak. |
| Tampering Attack Resistance (T) | 4/5 | DTO validation and server-side calculations; no purchase/payment flow present. |
| Information Disclosure Resistance (I) | 4/5 | Safe error handler and no stack traces; header/server leakage remains. |
| Privilege Escalation Resistance (E) | 4/5 | URL role guard; no method security guard, but current services low mutation. |
| Business Logic Attack Resistance | 4/5 | Atomic zero-hit upsert implemented. |
| Session Management Security | 4/5 | Stateless tokens; bounded active tokens; no cookies. |
| Struts Legacy Pattern Safety | 5/5 | No Struts/JSP/request parameter legacy patterns found. |
| **Total Score** | **45/65** | Fail until Critical findings are fixed. |

## Escalation Items (Requires Human Judgment)
- Confirm trusted proxy deployment and forwarded-header sanitization before accepting the current source-IP logic.
- Decide whether Docker runtime profile can contain demo credentials. For OSS release, runtime profiles should require explicit secrets.

### dependency

- Status: completed
- Verdict: fail
- Summary: Dependency management review found no prohibited legacy dependencies, but the Maven project still uses a SNAPSHOT artifact version, exposes H2 at runtime, omits required structured logging dependency, and has BOM/encoding hygiene issues.

# Source Code Review Report: Dependency Management Review

## Summary
- **Review Target**: `/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/pom.xml`
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 2 / Medium: 2 / Low: 0

## Prohibited Dependency Detection Results
| # | Dependency (groupId:artifactId) | Detected pom.xml | Replacement | Severity |
|---|-------------------------------|-------------------|-------------|----------|
| - | None detected | - | - | - |

## SNAPSHOT Version Detection Results
| # | Dependency | Version | Detected pom.xml |
|---|-----------|---------|------------------|
| 1 | `com.skishop:backend` project artifact | `0.0.1-SNAPSHOT` | `pom.xml:13` |

## Build Configuration Check
| pom.xml | Parent POM | Java Version | Encoding | Verdict |
|---------|-----------|--------------|----------|---------|
| `pom.xml` | `spring-boot-starter-parent:3.2.12` | `21` | Missing explicit source/reporting UTF-8 | ⚠️ Warning |

## Required Dependency Verification
| pom.xml | starter-web | starter-data-jpa | starter-security | flyway-core | actuator | Verdict |
|---------|-------------|------------------|------------------|-------------|----------|---------|
| `pom.xml` | Present | Present | Present | Present | Present | ⚠️ Warning: required `logstash-logback-encoder` missing; H2 runtime scope should be test |

## Findings
| # | Severity | Category | Target pom.xml | Finding | Suggested Fix |
|---|----------|----------|----------------|---------|---------------|
| 1 | Critical | SNAPSHOT Version Exclusion | `pom.xml:13` | Project artifact version is `0.0.1-SNAPSHOT`. | Use a release/stable version for publishable builds. |
| 2 | High | Test Dependency Scope | `pom.xml:80` | H2 has runtime scope although it appears test-only. | Change H2 scope to `test` unless a documented runtime profile requires it. |
| 3 | High | Required Dependency Verification | `pom.xml:45` | `net.logstash.logback:logstash-logback-encoder` is missing. | Add the dependency and configure structured Logback output if required by runtime standards. |
| 4 | Medium | Build Configuration | `pom.xml:29` | UTF-8 source/reporting encodings are not declared. | Add `project.build.sourceEncoding` and `project.reporting.outputEncoding` as `UTF-8`. |
| 5 | Medium | BOM Management | `pom.xml:31` | Flyway version is overridden and `flyway-database-postgresql` is explicitly pinned. | Prefer Spring Boot parent BOM management or document the override. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Prohibited Dependency Compliance | 5/5 | No prohibited Struts, Log4j 1, legacy DBCP/DBUtils, javax servlet/mail, or JUnit 4 dependencies found. |
| SNAPSHOT Exclusion | 2/5 | Project artifact uses `0.0.1-SNAPSHOT`. |
| Build Configuration | 3/5 | Parent and Java 21 are correct; encoding properties are missing. |
| Required Dependencies | 3/5 | Core web/JPA/security/Flyway/actuator dependencies are present; logging dependency is missing and H2 scope is wrong. |
| Version Consistency | 4/5 | Single-module project has no duplicate dependency version conflicts; Flyway BOM override remains a concern. |
| **Overall Score** | **17/25** | |

## Escalation Items (Requires Human Judgment)
None.

## Verification Notes
Review was limited to dependency/build metadata and dependency-relevant configuration. No files were modified.

### test-quality

- Status: completed
- Verdict: fail
- Summary: Test suite has broad functional coverage, but fails this agent’s quality bar due to systemic test naming violations, missing @DisplayName usage, oversized multi-act tests, controller branch coverage below 80%, and no enforced JaCoCo coverage gate.

# Source Code Review Report: Test Quality Review

## Summary
- **Review Target**: backend full test suite
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 4 / Medium: 3 / Low: 0

## Test Naming Check
| File | Violating Method | Current Name | Recommended Name |
|---|---|---|---|
| `src/test/java/com/skishop/domain/ZeroHitDomainTests.java:18` | Yes | `keywordNormalizerTrimsLowercasesAndCollapsesWhitespace` | `should_returnNormalizedKeyword_when_keywordContainsMixedCaseAndWhitespace` |
| `src/test/java/com/skishop/BackendApplicationTests.java:43` | Yes | `contextLoads` | `should_loadApplicationContext_when_testProfileStarts` |
| `src/test/java/com/skishop/controller/FrontendContractIntegrationTests.java:63` | Yes | `productAuthRadarAiAndErrorPayloadsMatchFrontendTypes` | Split first; then use `should_matchProductContract_when_productsRequested`, etc. |

No test methods matched `should_ExpectedResult_when_Condition`; `@DisplayName` usage was also absent.

## AAA Pattern Check
| File | Method | Arrange Clear | Act Single | Assert Clear | Verdict |
|---|---|---:|---:|---:|---|
| `FrontendContractIntegrationTests.java:63` | `productAuthRadarAiAndErrorPayloadsMatchFrontendTypes` | Partial | No | Partial | Fail |
| `ProductApiIntegrationTests.java:74` | `searchProductsMatchesManufacturerNameCategoryAndDescription` | Partial | No | Yes | Fail |
| `ProductRequestOptionsTests.java:28` | `toPageableRejectsInvalidLimitAndSort` | Partial | No | Yes | Warning |
| `AiConsultationServiceTests.java:24` | `liveProviderAnswerReturnsLiveStatus` | Yes | Yes | Yes | Pass structurally, naming still fails |

## Test Type Coverage
| Test Type | Exists | Framework | Target Layer | Verdict |
|---|---:|---|---|---|
| Unit Test | Yes | JUnit 5, Mockito/hand fakes | Domain/service | Pass |
| API Integration Test | Yes | `@SpringBootTest` + `MockMvc` | Controllers | Pass |
| DB Slice Test | Yes | `@DataJpaTest`, H2 `MODE=PostgreSQL` | Repository | Pass; Testcontainers recommended |
| PostgreSQL Fidelity Test | Yes | Testcontainers PostgreSQL | Concurrent zero-hit upsert | Pass |
| Security Test | Yes | spring-security-test request postprocessors + bearer-token flows | Auth/admin APIs | Pass |

## Coverage Verification
| Layer | Target | Estimated Achievement | Untested Method Count | Verdict |
|---|---:|---:|---:|---|
| Overall | 80% branch | 80% branch (`198/245`) | 5 methods missed in report | Warning: barely passes |
| Service | 80% branch | 80% branch (`140/173`) | 2 methods missed in service package | Warning |
| Controller | 80% branch | 50% branch (`5/10`) | 0 methods missed | Fail |
| Repository | 70% branch | Repository interfaces not directly in JaCoCo class rows | N/A | Covered by integration tests |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | High | Test Naming | `ZeroHitDomainTests.java` | 18 | Required should/when naming is not used anywhere. | `void should_returnNormalizedKeyword_when_keywordContainsMixedCaseAndWhitespace()` |
| 2 | High | AAA Pattern | `FrontendContractIntegrationTests.java` | 63 | One test performs many independent API journeys. | Split into one behavior per test. |
| 3 | High | Coverage | `target/site/jacoco/jacoco.csv` | 40 | Controller branch coverage is 50%, below 80%. | Add missing AuthController branch tests. |
| 4 | High | Coverage | `target/site/jacoco/jacoco.csv` | 10 | `SpringAiProviderClient` branch coverage is 25%. | Unit test all provider availability / answer / exception branches. |
| 5 | Medium | Coverage Gate | `pom.xml` | 114 | JaCoCo has report generation but no threshold check. | Add `jacoco:check` with line and branch limits. |
| 6 | Medium | DisplayName | `BackendApplicationTests.java` | 42 | No `@DisplayName` annotations found. | Add human-readable display names. |
| 7 | Medium | Parameterized Tests | `ProductRequestOptionsTests.java` | 28 | Boundary cases are bundled in one test instead of parameterized. | Use `@ParameterizedTest` + `@ValueSource` / `@CsvSource`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Test Naming Convention | 1/5 | Systemic violation; no `@DisplayName`. |
| AAA Pattern | 2/5 | Some unit tests are clear, but several integration tests are multi-act scenarios. |
| Test Type Coverage | 4/5 | Strong spread across unit, API, DB, security, and PostgreSQL concurrency tests. |
| Coverage Criteria | 3/5 | Overall barely passes, controller branch coverage fails, no enforced gate. |
| Mock Quality | 3/5 | Mockito usage is limited and mostly appropriate; more direct adapter tests needed. |
| **Overall Score** | **13/25** | |

## Escalation Items (Requires Human Judgment)
- Decide the CI coverage enforcement policy before OSS release: overall-only threshold is likely too weak because controller branch coverage is currently below target despite overall branch coverage passing.

### performance

- Status: completed
- Verdict: fail
- Summary: Performance review found no N+1 query or query-in-loop issues, but there are high-impact query and pagination risks: duplicate count queries on product list/search paths, limit-only collection APIs, repeated dashboard aggregate scans, non-sargable product search, and missing cache for stable AI context data. Static review only; tests were not run.

# Source Code Review Report: Performance Review

## Summary
- **Review Target**: backend full source review
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 3 / Medium: 3 / Low: 0
- **Scope Note**: Static performance review only; tests were not run.

## N+1 Query Detection Results
| # | File | Method | Line | Pattern | Fix Suggestion |
|---|------|--------|------|---------|----------------|
| - | - | - | - | No entity associations or query-in-loop patterns found in production code. | No action required. |

## Pagination Check
| Endpoint | Pagination Present | Default Size | Max Size | Verdict |
|----------|-------------------|-------------|----------|---------|
| GET /api/products | Partial: fixed page 0 with limit only | 20 | 100 | ⚠️ Add page and metadata |
| GET /api/products/search | Partial: fixed page 0 with limit only | 20 | 100 | ⚠️ Add page and metadata |
| GET /api/admin/zero-hits | Partial: fixed page 0 with limit only | 20 | 100 | ⚠️ Add page and metadata |

## JPA Query Optimization Check
| File | Method | readOnly Txn | DTO Projection | exists vs count | Verdict |
|------|--------|-------------|----------------|-----------------|---------|
| ProductQueryService.java | listProducts | Yes | No, entity mapped after fetch | N/A | ⚠️ Duplicate count query |
| ProductSearchService.java | search | Write txn due zero-hit recording | No, entity mapped after fetch | N/A | ⚠️ Duplicate count query |
| ZeroHitQueryService.java | listZeroHits | Yes | No, entity mapped after fetch | N/A | ⚠️ Three separate summary aggregate queries |
| AiConsultationService.java | consult | Yes | Scalar distinct queries | N/A | ⚠️ Missing cache for stable context |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | Duplicate query execution | src/main/java/com/skishop/service/ProductQueryService.java | 43 | Product listing calls findAll(spec, pageable).getContent() and then count(spec), causing an avoidable second count query. | Keep Page<Product> page = productRepository.findAll(specification, pageable); use page.getContent() and page.getTotalElements(). |
| 2 | High | Duplicate query execution | src/main/java/com/skishop/service/ProductSearchService.java | 59 | Product search repeats the same count-query issue before zero-hit logic. | Keep the returned Page and use page.getTotalElements() for both response metadata and zero-hit detection. |
| 3 | High | Pagination | src/main/java/com/skishop/service/ProductRequestOptions.java | 34 | PageRequest.of(0, ...) creates a first-page-only API. Collection endpoints expose limit but not page/size/totalPages metadata. | Add validated page parameters and return page metadata. |
| 4 | Medium | JPA query optimization | src/main/java/com/skishop/service/ZeroHitQueryService.java | 64 | Dashboard summary performs three aggregate queries over the same since predicate. | Use one summary projection query returning count, sum(hitCount), and sum(estimatedOpportunityLoss). |
| 5 | Medium | Query shape / indexing | src/main/java/com/skishop/service/ProductSpecifications.java | 39 | lower(column) LIKE '%keyword%' cannot use the current plain B-tree indexes for contains search. | Use PostgreSQL full-text search or pg_trgm GIN functional indexes, verified with EXPLAIN ANALYZE. |
| 6 | Medium | Cache strategy | src/main/java/com/skishop/service/AiConsultationService.java | 45 | AI prompt context runs distinct category and manufacturer queries on every consultation. | Cache the stable product context with Spring Cache and add eviction when product writes exist. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| N+1 Query Prevention | 5/5 | No relationships or DB calls inside production loops found. |
| JPA Query Optimization | 2/5 | Duplicate count queries, repeated aggregates, and non-sargable search need cleanup. |
| Pagination | 2/5 | Limits are capped, but APIs are first-page-only and lack page metadata. |
| Memory Efficiency | 4/5 | Bounded result sizes and Java records are good; entity materialization remains acceptable for current DTO shape. |
| Cache Strategy | 3/5 | No cache for stable product master context used by AI consult. |
| **Overall Score** | **16/25** | Main risks are DB query count and scalable collection/search behavior. |

## Escalation Items (Requires Human Judgment)
- Decide whether collection APIs are intentionally first-window only for the MVP, or whether public OSS quality requires navigable pagination in the current API contract.


### resilience

- Status: completed
- Verdict: fail
- Summary: Resilience review found one critical gap and several high/medium risks around the live Spring AI external call. Actuator health probes are enabled and no direct RestTemplate instantiation was found, but the AI provider path lacks retry/circuit breaker, explicit timeout, bulkhead isolation, and graceful shutdown settings.

# Source Code Review Report: Resilience Review

## Summary
- **Review Target**: backend full source
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 3 / Medium: 1 / Low: 0

## HTTP Client Management Check
| Component | Bean-Managed | Timeout Configured | URL Externalized | Verdict |
|-----------|-------------|-------------------|-----------------|---------|
| Spring AI ChatClient | Yes | No visible explicit timeout | API key/model externalized; base URL uses library default | ⚠️ Warning |

## Resilience4j Configuration Check
| Client | @Retry | @CircuitBreaker | @TimeLimiter | Backoff | Verdict |
|--------|--------|-----------------|-------------|---------|---------|
| SpringAiProviderClient | No | No | No | No | ❌ Fail |

## Health Check Implementation Status
| Component | /actuator/health | readiness | DataSource | Custom Indicators | Verdict |
|-----------|-----------------|-----------|------------|------------------|---------|
| Backend | Enabled/exposed | Probes enabled via Actuator | Expected active by auto-config | None found for AI provider | ⚠️ Warning |

## Fallback Strategy
| Component | External Dependency | Fallback on Failure | Defined | Verdict |
|-----------|-------------------|--------------------|---------|---------|
| AiConsultationService | Spring AI/OpenAI-compatible provider | Missing key returns FALLBACK; provider exception returns ERROR response | Yes | ✅ Pass |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | Critical | Retry / Circuit Breaker | src/main/java/com/skishop/service/SpringAiProviderClient.java | 25 | Live AI provider call has no retry or circuit breaker protection. | Add Resilience4j `@Retry(name="aiProvider")` and `@CircuitBreaker(name="aiProvider")` around `generate`, with maxAttempts 3 and exponential backoff. |
| 2 | High | Timeout Management | src/main/java/com/skishop/config/SpringAiConfig.java | 28 | OpenAI-compatible client is built without visible explicit timeout settings. | Configure connect/read timeouts through the supported Spring AI client builder/properties and add an overall operation timeout. |
| 3 | High | Graceful Shutdown | src/main/resources/application.yml | 33 | `server.shutdown=graceful` and shutdown phase timeout are missing. | Add `server.shutdown: graceful` and `spring.lifecycle.timeout-per-shutdown-phase: 20s`. |
| 4 | High | Health Checks | src/main/resources/application.yml | 44 | No custom health/readiness signal exists for the AI provider dependency. | Add an AI provider `HealthIndicator`, or document AI as non-gating and expose a non-gating indicator/metric. |
| 5 | Medium | Bulkhead Pattern | src/main/java/com/skishop/service/SpringAiProviderClient.java | 35 | Synchronous live AI calls have no concurrency isolation. | Add a Resilience4j semaphore bulkhead for the AI provider path. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| HTTP Client Management | 4/5 | No `new RestTemplate()` found; ChatClient is Spring-managed. Timeout/base URL controls need improvement. |
| Retry / CB | 1/5 | No retry, circuit breaker, time limiter, or backoff configuration found. |
| Health Checks | 4/5 | Actuator health and probes are enabled; AI dependency visibility is missing. |
| Timeout Management | 1/5 | No explicit provider timeout found. |
| Fallback | 4/5 | Missing-key and provider-error fallbacks are implemented; stronger resilience controls should route into these paths. |
| **Overall Score** | **12/25** | Critical resilience controls are missing for the live AI provider. |

## Escalation Items (Requires Human Judgment)
- Decide whether live AI availability should gate readiness. Because fallback exists, non-gating AI readiness may be acceptable, but the provider outage still needs operational visibility.


