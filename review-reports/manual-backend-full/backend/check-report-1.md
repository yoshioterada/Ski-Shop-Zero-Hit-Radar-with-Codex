# Source Code Review Integrated Report

## Verdict
- Target: backend
- Verdict: Rejected
- Review Date: 2026-06-04T14:05:29.269Z
- Project: /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar
- Agents: tech-lead, architecture, ddd-domain, api-endpoint, java-standards, async-concurrency, error-logging, data-access, config-di, security, dependency, test-quality, performance, resilience

## Findings Summary
| Agent | Thread ID | Status | Verdict | Critical | High | Medium | Low | Score |
|---|---|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e92ee-3270-7ea3-bcbb-18d2475d1a23 | completed | fail | 0 | 1 | 3 | 0 | 14 |
| architecture | 019e92ee-32bc-79e0-8e90-15e214f6e1a2 | completed | warning | 0 | 1 | 3 | 0 | 19 |
| ddd-domain | 019e92ee-32ea-77d2-a2cd-ad8057c69f90 | completed | warning | 0 | 3 | 0 | 0 | 22 |
| api-endpoint | 019e92ee-32c1-7251-8798-e37eae06b172 | completed | fail | 3 | 3 | 1 | 0 | 58 |
| java-standards | 019e92ee-32ea-7be1-b3dc-474321c3e940 | completed | fail | 2 | 4 | 0 | 0 | 16 |
| async-concurrency | 019e92ee-32ea-71e3-af10-2ac24a8cba71 | completed | fail | 1 | 2 | 0 | 0 | 17 |
| error-logging | 019e92ee-32b6-7390-9293-11f3c395388b | completed | fail | 0 | 5 | 2 | 0 | 13 |
| data-access | 019e92ef-df24-71b2-b64b-69eab80ef357 | completed | fail | 1 | 4 | 2 | 0 | 15 |
| config-di | 019e92f0-31f8-7772-8bef-30bebf00c832 | completed | fail | 1 | 3 | 1 | 1 | 56 |
| security | 019e92f0-6aa1-7071-a768-46384ece1702 | completed | fail | 2 | 5 | 1 | 0 | 37 |
| dependency | 019e92f0-6efa-7570-a698-4c4594691905 | completed | fail | 1 | 2 | 3 | 0 | 68 |
| test-quality | 019e92f0-d106-7f42-bfb3-01a4d5174728 | completed | fail | 0 | 3 | 3 | 0 | 52 |
| performance | 019e92f1-5cdb-7ad1-a2bc-5093082c9ae2 | completed | fail | 0 | 4 | 4 | 0 | 62 |
| resilience | 019e92f1-7281-7900-a7f3-fe68b317118e | completed | fail | 1 | 1 | 3 | 0 | 12 |

## Verdict Rationale
Critical findings were detected and require remediation before approval.

## Critical/High Findings List
| # | Severity | Source Agent | Category | Target File | Line | Finding | Suggested Fix |
|---:|---|---|---|---|---|---|---|
| 1 | High | tech-lead | Data integrity / Transaction consistency | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 90-102 | Concurrent zero-hit insert recovery continues inside a failed transaction | Use a database-level PostgreSQL upsert such as INSERT ... ON CONFLICT (normalized_keyword) DO UPDATE for zero-hit recording, or move the retry to a separate transaction after the failed insert transaction has rolled back. Add a concurrency integration test that fires two same-key zero-hit records at once and asserts one row with hitCount=2. |
| 2 | High | architecture | Project Structure | backend/src/main/java/com/skishop/entity/Product.java | 1-1 | Required package convention is not implemented for model and DTO boundaries | Either move JPA entities to `com.skishop.model` and split DTOs into `com.skishop.dto.request` / `com.skishop.dto.response`, or explicitly update the architecture standard to bless `entity/` and flat DTO packaging before more APIs are added. |
| 3 | High | ddd-domain | Aggregate Invariant | backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 55-72 | ZeroHitSearch can be constructed in invalid aggregate states | Make construction go through a validating factory such as `firstHit(...)`; make the all-args constructor package-private or test-only if possible, and validate keyword/normalizedKeyword blanks, hitCount positivity, timestamp ordering, and non-negative monetary values in the aggregate. |
| 4 | High | ddd-domain | Domain Logic Encapsulation | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71-75 | Zero-hit priority and opportunity-loss rules are controlled outside the aggregate | Move repeat-recording and demand-signal recalculation behind an aggregate method such as `recordRepeat(displayKeyword, averageProductPrice, searchedAt)` or a pure domain policy invoked from inside a consistency-preserving aggregate method. Remove or restrict public arbitrary setters like `updateDemandSignals(...)`. |
| 5 | High | ddd-domain | Value Object Implementation | backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Monetary and normalized keyword concepts are modeled as primitives instead of Value Objects | Introduce self-validating immutable Value Objects such as `Money` and `NormalizedKeyword` and embed or convert them for JPA persistence. At minimum, centralize amount scale/currency/non-negative validation and normalized-keyword validation outside raw entity field assignment. |
| 6 | High | api-endpoint | HTTP method correctness | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 43-49 | GET product search records zero-hit state | Keep GET /api/products/search read-only and move zero-hit recording to a POST command endpoint such as POST /api/zero-hit-searches, or explicitly document and mitigate the analytics side effect with cache-control and idempotency if the design is intentionally kept. |
| 7 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 33-49 | Query parameters bypass Bean Validation at controller boundary | Add @Validated to controllers and Bean Validation constraints, e.g. @Min(1) @Max(100) Integer limit, @Size(max=100) String q/category, and @Pattern for allowed sort tokens. Keep service validation as defense in depth. |
| 8 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AdminZeroHitController.java | 31-36 | Admin zero-hit query parameters are not Bean-validated | Add @Validated and annotate parameters, e.g. @Min(1) @Max(365) Integer days, @Min(1) @Max(100) Integer limit, and @Pattern(regexp = "hitCount(,desc)?\|lastSearchedAt(,desc)?") String sort. |
| 9 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/dto/AiConsultRequest.java | 10-14 | Request DTO fields are only partially constrained | Add explicit constraints to all request DTO fields, e.g. @Size(max=255) username, @Size(max=200) keyword, @NotBlank @Size(max=1000) question, @Min(0) @Max(...) hitCount, and @PastOrPresent for client-supplied timestamps if accepted. |
| 10 | High | api-endpoint | Parameter binding | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 42-45 | Current-user endpoint does not use @AuthenticationPrincipal | Change the signature to public AuthMeResponse me(@AuthenticationPrincipal AdminUserDto user) and remove the manual Authentication cast. |
| 11 | High | api-endpoint | Error response design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 24-119 | Global exception handler does not use ProblemDetail/RFC 9457 shape | Extend ResponseEntityExceptionHandler and return ProblemDetail for validation, auth, not-found, and unexpected exceptions, or record a project-level decision that the custom error contract is intentionally accepted. |
| 12 | Critical | java-standards | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27-59 | DI-managed service is directly instantiated in a test | Use Spring test injection for the service, or extract pure collaboration logic into a non-DI class and keep the Spring `@Service` constructed only by the container. |
| 13 | Critical | java-standards | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 79-80 | DI-managed service is directly instantiated in a test helper | Use constructor injection from a Spring test context, or move token/session logic into a non-Spring domain component that can be unit-tested without constructing the service bean directly. |
| 14 | High | java-standards | DI Pattern Quality | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 24-25 | Service has no corresponding interface and is injected by concrete type | Introduce a `ZeroHitRecordingUseCase` or `ZeroHitRecorder` interface with `record(String keyword)`, implement it in `ZeroHitRecordingService`, and inject the interface in `ProductSearchService`. |
| 15 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/dto/AiConsultRequest.java | 10-14 | Nullable request fields are not annotated | Annotate optional components with `@Nullable`, or make them required with validation annotations if null is not part of the public contract. |
| 16 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/dto/ProductDto.java | 21-31 | Nullable product image URL is exposed without a nullable contract | Annotate `ProductDto.imageUrl`, `Product.imageUrl`, `Product.getImageUrl()`, and the constructor parameter with `@Nullable`, or make the database/API field non-null with a guaranteed fallback value. |
| 17 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/repository/ProductRepository.java | 29-49 | Repository parameters accepting null are not annotated | Import `org.springframework.lang.Nullable` and declare `@Nullable @Param("category") String category` for both repository methods, or remove null support from the query contract. |
| 18 | Critical | async-concurrency | Thread Safety / Database Concurrency | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 66-76 | Concurrent zero-hit updates can lose increments | Make the increment concurrency-safe: add @Version to ZeroHitSearch and retry OptimisticLockingFailureException, or use @Lock(PESSIMISTIC_WRITE) for the normalized-key lookup within the transaction, or replace the read-increment-save path with an atomic @Modifying query such as UPDATE zero_hit_searches SET hit_count = hit_count + 1, last_searched_at = :now, ... WHERE normalized_keyword = :normalizedKeyword. Add a concurrent integration test that fires multiple parallel record() calls and asserts the final hitCount. |
| 19 | High | async-concurrency | Virtual Thread Adoption | backend/src/main/resources/application.yml | 1-32 | Java 21 backend does not enable Spring Boot virtual threads | Add `spring.threads.virtual.enabled: true` to the active backend configuration, then run integration tests and manually verify request logging/security behavior. Keep blocking sections out of synchronized blocks and avoid ThreadLocal-dependent application code as virtual threads are adopted. |
| 20 | High | async-concurrency | Blocking I/O / Transaction Scope | backend/src/main/java/com/skishop/service/AiConsultationService.java | 42-51 | AI provider call blocks the request path while the service transaction remains open | Limit the read-only transaction to the database context lookup, then call the AI provider outside any transaction. Enable virtual threads for the synchronous request model, and consider enforcing provider/client timeouts so a slow provider cannot occupy request capacity indefinitely. |
| 21 | High | error-logging | Correlation ID / MDC | backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | Requests do not get an X-Correlation-Id or MDC correlationId | In this filter or a dedicated OncePerRequestFilter, read X-Correlation-Id, generate a UUID when absent, set MDC.put("correlationId", correlationId), set the response header, call the chain, then remove/clear MDC in finally. |
| 22 | High | error-logging | Exception Handling | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 106-109 | Unexpected exception handler omits the Throwable from the server log | Use `LOGGER.error("Unexpected API error at {}", request.getRequestURI(), exception);` or include any safe structured fields while keeping the Throwable as the final argument. |
| 23 | High | error-logging | Exception Handling | backend/src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider fallback catch block drops exception details from logs | Log the exception as the final SLF4J argument without logging the prompt or API key, for example `LOGGER.warn("ai_consultation providerStatus={}", response.providerStatus(), exception);`. |
| 24 | High | error-logging | RFC 7807 Error Model | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 36-44 | Global errors use custom ApiErrorResponse instead of Spring ProblemDetail | Return `ProblemDetail` from exception handlers, set stable fields such as `code`, `path`, and validation `errors` via `setProperty`, and update frontend contracts/tests if the API contract changes. |
| 25 | High | error-logging | Structured Logging | backend/pom.xml | 45-100 | Production JSON/logstash logging is not configured | Add `logstash-logback-encoder` and a `logback-spring.xml` JSON appender that includes `spring.application.name`, `%X{correlationId}`, and trace/span IDs when tracing is enabled. |
| 26 | Critical | data-access | Repository Configuration | backend/src/main/resources/application.yml | 13-14 | Datasource URLs have hardcoded fallbacks in default runtime configuration | Make SPRING_DATASOURCE_URL required in default/prod config, and move localhost or Docker defaults to an explicitly activated local/dev profile or sample env file. Apply the same policy to application-docker.yml if it is used outside local demos. |
| 27 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24-26 | Entity primary keys use UUID and entity-level generation instead of String UUID generated in the service layer | Change IDs to String with @Column(name = "id", length = 36, nullable = false, updatable = false), remove @PrePersist ID generation, generate UUID strings in the service/factory boundary, and update migrations/tests consistently. |
| 28 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24-40 | Column names are not explicitly declared for all entity fields | Add explicit name attributes to all @Column annotations, for example @Column(name = "manufacturer", nullable = false, length = 100), and do the same in ZeroHitSearch for id, keyword, and priority. |
| 29 | High | data-access | Optimistic Locking | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71-76 | Zero-hit repeat recording can lose increments under concurrent searches | Add @Version Long version to ZeroHitSearch plus a Flyway migration, handle ObjectOptimisticLockingFailureException/OptimisticLockException with retry or a business exception, or replace the repeat path with an atomic UPDATE ... hit_count = hit_count + 1 query. |
| 30 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps are maintained manually instead of Hibernate audit annotations | Annotate createdAt with @CreationTimestamp and @Column(name = "created_at", nullable = false, updatable = false); annotate updatedAt with @UpdateTimestamp and @Column(name = "updated_at", nullable = false). Remove manual timestamp assignment unless there is a documented reason to use an injected Clock instead. |
| 31 | Critical | config-di | Application Properties / Secret Management | backend/src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded datasource password fallback | Remove the fallback: `password: ${SPRING_DATASOURCE_PASSWORD}`. Provide non-secret examples in `.env.example` or compose-only local documentation, and require runtime secret injection for real runs. |
| 32 | High | config-di | Spring Security Filter Chain | backend/src/main/java/com/skishop/config/SecurityConfig.java | 56-80 | Security headers are not explicitly configured in the SecurityFilterChain | Add an explicit headers block, for example frame options deny, content type options, HSTS for HTTPS deployments, and a CSP appropriate for the JSON API/admin frontend. |
| 33 | High | config-di | Profile-Based Configuration | backend/src/main/resources/application.yml | 1-60 | Production and development profiles are not separated | Add `application-dev.yml` and `application-prod.yml`. In prod, require secret env vars without defaults, set `logging.level.root=WARN`, disable SQL display, document or configure HTTPS termination, and keep stack traces disabled. |
| 34 | High | config-di | Security Settings | backend/src/main/resources/application.yml | 33-38 | HTTPS enforcement or reverse-proxy TLS termination is not configured in target files | For direct production serving, add validated `server.ssl.*` settings in `application-prod.yml`. If TLS is terminated upstream, document that requirement and ensure forwarded headers are configured consistently. |
| 35 | Critical | security | A02 Cryptographic Failures / Secret Management | backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a hardcoded database password fallback | Remove the literal fallback: `password: ${SPRING_DATASOURCE_PASSWORD}`. Put non-secret sample values in `.env.example`, and make docker/compose startup fail fast when the password is absent. |
| 36 | Critical | security | A07 Identification and Authentication Failures / Rate Limiting | backend/src/main/java/com/skishop/service/AdminAuthService.java | 52-58 | Admin login has no rate limiting or account lockout | Add a rate-limiting filter for `/api/auth/login` and failed-attempt tracking keyed by username and source IP. Lock the account or block the source after a small threshold, return a unified authentication failure, and emit structured security events without logging credentials. |
| 37 | High | security | STRIDE Tampering / CSRF Semantics / Business Logic Abuse | backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public GET search endpoint mutates zero-hit analytics state | Make product search GET read-only. Move analytics recording to a deliberate POST endpoint protected by CSRF or anti-abuse controls, or keep server-side recording but add strict rate limiting, bot controls, and safeguards so cross-site GETs cannot pollute the table. |
| 38 | High | security | Security Headers / XSS Defense in Depth | backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-80 | CSP, Referrer-Policy, Permissions-Policy, and explicit HSTS policy are not configured | Add an explicit `.headers(...)` block with `contentSecurityPolicy`, `referrerPolicy`, `permissionsPolicy`, `frameOptions`, `contentTypeOptions`, and HSTS settings appropriate for the deployment TLS model. Also add integration tests asserting the headers. |
| 39 | High | security | Denial of Service / Input Validation | backend/src/main/resources/application.yml | 33-38 | Request body and free-text inputs are not bounded | Configure HTTP limits such as Tomcat post/header/swallow sizes and JSON body limits where applicable. Add Bean Validation constraints such as `@Size(max = 100)` for search keywords and bounded `@Size` for AI questions, and reject overlong values before repository or provider calls. |
| 40 | High | security | Spoofing / Session Management | backend/src/main/java/com/skishop/config/SecurityConfig.java | 76-79 | Bearer tokens cannot be revoked and repeated logins create unlimited active tokens | Add logout/revoke support, cap active tokens per admin, invalidate older tokens on new login or password/config rotation, periodically purge expired sessions, and reduce TTL or use refresh-token rotation if longer sessions are required. |
| 41 | High | security | Information Disclosure / PII Logging | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 77-80 | User-controlled search keywords are logged without redaction | Do not log raw or normalized user search terms. Log a stable hash, length, category of event, hit count, and priority, or redact values with an allowlist/PII detector before logging. |
| 42 | Critical | dependency | SNAPSHOT Version Exclusion | backend/pom.xml | 13-13 | Backend artifact is still published as a SNAPSHOT version | Change the project version to a stable release version before production/OSS publication, for example <version>0.1.0</version>, and reserve SNAPSHOT only for non-release development branches if the project has an explicit release process. |
| 43 | High | dependency | Test Scope Enforcement | backend/pom.xml | 80-84 | H2 is runtime-scoped even though it is configured only as the test database | Change the H2 dependency scope to test unless there is an explicit non-test H2 runtime mode. Keep PostgreSQL as the runtime driver. |
| 44 | High | dependency | Required Dependency Verification | backend/pom.xml | 45-100 | Required structured logging dependency is missing | Add net.logstash.logback:logstash-logback-encoder with a vetted stable version, or document and approve a different structured logging approach in the dependency standard. |
| 45 | High | test-quality | Test Naming Convention | backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 16-33 | All test methods violate the required should_ExpectedResult_when_Condition naming pattern | Rename tests to the required pattern, e.g. should_returnNormalizedKeyword_when_keywordContainsCaseAndWhitespace(), should_calculateOpportunityLoss_when_hitCountAndAveragePriceProvided(), should_choosePriority_when_hitCountCrossesThresholds(). |
| 46 | High | test-quality | AAA Pattern | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 28-56 | Some tests combine multiple Act operations and multiple behaviors in one test method | Split into focused tests or parameterized tests, each with one Act block. Example: should_issueDistinctTokens_when_validCredentials(), should_validateAdminUser_when_tokenIsKnown(), should_throwAuthenticationFailed_when_usernameIsMissing(), should_throwAuthenticationFailed_when_passwordIsWrong(). |
| 47 | High | test-quality | Coverage Criteria | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 26-38 | Important service and adapter classes have branch coverage below 80% | Add focused unit/slice tests for SpringAiProviderClient when ChatClient is absent, returns blank/null content, succeeds, and throws; ZeroHitQueryService invalid days/sort boundaries; ProductSpecifications blank keyword branch; SecurityConfig access-denied branch where practical. |
| 48 | High | performance | Pagination | backend/src/main/java/com/skishop/service/ProductRequestOptions.java | 34-34 | Collection APIs implement only first-page limiting, not retrievable pagination | Add a validated page or offset parameter to the controllers/use cases, construct PageRequest.of(page, size, sort), and return pagination metadata such as page, size, totalElements, and totalPages. Apply the same pattern to /api/admin/zero-hits instead of hard-coding page 0. |
| 49 | High | performance | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing can execute the same count query twice | Keep the Page<Product>: Page<Product> page = productRepository.findAll(specification, pageable); then map page.getContent() and use page.getTotalElements(). If total counts are not required, return a Slice to avoid count queries entirely. |
| 50 | High | performance | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search duplicates the pageable count query and uses it for zero-hit logic | Use Page<Product> page = productRepository.findAll(specification, pageable); long totalCount = page.getTotalElements(); and base zero-hit recording on that value. Consider Slice plus a cheap exists/count path only if the API no longer needs exact totals. |
| 51 | High | performance | JPA Query Optimization | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Public product list/search fetch managed Product entities instead of DTO projections | Introduce repository projection methods returning ProductDto or ProductSummary projections for list/search queries, or use Criteria/JPQL constructor projections. Keep entity loading only for update flows or domain behavior that needs managed entities. |
| 52 | Critical | resilience | Retry / Circuit Breaker | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 34-38 | Live AI provider call is not protected by retry or circuit breaker | Add Resilience4j Spring Boot 3 support, then annotate the provider boundary, for example `@Retry(name = "aiProvider", fallbackMethod = "fallback")` and `@CircuitBreaker(name = "aiProvider", fallbackMethod = "fallback")`. Configure `maxAttempts: 3`, exponential backoff, failure threshold, and open-state duration in `application.yml`. Keep fallback returning the existing controlled fallback/error response path. |
| 53 | High | resilience | Timeout Management | backend/src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | AI provider client has no explicit timeout contract | Externalize an AI timeout property such as `app.ai.response-timeout: PT30S` and apply it through the Spring AI/OpenAI builder API or a configured Spring HTTP client/request factory with connect and response timeouts. |


## All Findings
| # | Severity | Source Agent | Category | Target File | Line | Finding |
|---:|---|---|---|---|---|---|
| 1 | High | tech-lead | Data integrity / Transaction consistency | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 90-102 | Concurrent zero-hit insert recovery continues inside a failed transaction |
| 2 | Medium | tech-lead | Design alignment / Database schema | backend/src/main/resources/db/migration/V1__create_products_and_zero_hit_searches.sql | 30-31 | Case-insensitive search indexes are named as lower indexes but created on raw columns |
| 3 | Medium | tech-lead | KISS / Code consistency | backend/src/main/java/com/skishop/repository/ProductRepository.java | 23-49 | Product search/list logic exists in two repository patterns |
| 4 | Medium | tech-lead | OSS readiness / Build metadata | backend/pom.xml | 16-28 | Backend POM contains empty OSS publication metadata |
| 5 | High | architecture | Project Structure | backend/src/main/java/com/skishop/entity/Product.java | 1-1 | Required package convention is not implemented for model and DTO boundaries |
| 6 | Medium | architecture | Design Deviation | backend/src/main/java/com/skishop/service/AiPromptBuilder.java | 1-23 | AiPromptBuilder is placed in service package despite being defined as a domain service |
| 7 | Medium | architecture | Module Boundary | backend/src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3-17 | Response DTO depends on persistence/entity enum |
| 8 | Medium | architecture | Spring Boot Configuration | backend/src/main/resources/application.yml | 13-24 | Runtime profile separation is incomplete |
| 9 | High | ddd-domain | Aggregate Invariant | backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 55-72 | ZeroHitSearch can be constructed in invalid aggregate states |
| 10 | High | ddd-domain | Domain Logic Encapsulation | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71-75 | Zero-hit priority and opportunity-loss rules are controlled outside the aggregate |
| 11 | High | ddd-domain | Value Object Implementation | backend/src/main/java/com/skishop/entity/Product.java | 40-41 | Monetary and normalized keyword concepts are modeled as primitives instead of Value Objects |
| 12 | High | api-endpoint | HTTP method correctness | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 43-49 | GET product search records zero-hit state |
| 13 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/ProductController.java | 33-49 | Query parameters bypass Bean Validation at controller boundary |
| 14 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AdminZeroHitController.java | 31-36 | Admin zero-hit query parameters are not Bean-validated |
| 15 | Critical | api-endpoint | Input validation | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/dto/AiConsultRequest.java | 10-14 | Request DTO fields are only partially constrained |
| 16 | High | api-endpoint | Parameter binding | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AuthController.java | 42-45 | Current-user endpoint does not use @AuthenticationPrincipal |
| 17 | High | api-endpoint | Error response design | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 24-119 | Global exception handler does not use ProblemDetail/RFC 9457 shape |
| 18 | Medium | api-endpoint | Controller mapping convention | /Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/backend/src/main/java/com/skishop/controller/AdminZeroHitController.java | 14-31 | Admin controllers lack class-level base @RequestMapping |
| 19 | Critical | java-standards | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27-59 | DI-managed service is directly instantiated in a test |
| 20 | Critical | java-standards | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 79-80 | DI-managed service is directly instantiated in a test helper |
| 21 | High | java-standards | DI Pattern Quality | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 24-25 | Service has no corresponding interface and is injected by concrete type |
| 22 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/dto/AiConsultRequest.java | 10-14 | Nullable request fields are not annotated |
| 23 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/dto/ProductDto.java | 21-31 | Nullable product image URL is exposed without a nullable contract |
| 24 | High | java-standards | Null Safety | backend/src/main/java/com/skishop/repository/ProductRepository.java | 29-49 | Repository parameters accepting null are not annotated |
| 25 | Critical | async-concurrency | Thread Safety / Database Concurrency | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 66-76 | Concurrent zero-hit updates can lose increments |
| 26 | High | async-concurrency | Virtual Thread Adoption | backend/src/main/resources/application.yml | 1-32 | Java 21 backend does not enable Spring Boot virtual threads |
| 27 | High | async-concurrency | Blocking I/O / Transaction Scope | backend/src/main/java/com/skishop/service/AiConsultationService.java | 42-51 | AI provider call blocks the request path while the service transaction remains open |
| 28 | High | error-logging | Correlation ID / MDC | backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | 25-40 | Requests do not get an X-Correlation-Id or MDC correlationId |
| 29 | High | error-logging | Exception Handling | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 106-109 | Unexpected exception handler omits the Throwable from the server log |
| 30 | High | error-logging | Exception Handling | backend/src/main/java/com/skishop/service/AiConsultationService.java | 57-60 | AI provider fallback catch block drops exception details from logs |
| 31 | High | error-logging | RFC 7807 Error Model | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 36-44 | Global errors use custom ApiErrorResponse instead of Spring ProblemDetail |
| 32 | High | error-logging | Structured Logging | backend/pom.xml | 45-100 | Production JSON/logstash logging is not configured |
| 33 | Medium | error-logging | PII / Data Minimization | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 77-81 | User-supplied search keywords are written to application logs |
| 34 | Medium | error-logging | Observability Integration | backend/src/main/resources/application.yml | 40-49 | Actuator metrics are not exposed or instrumented for operations |
| 35 | Critical | data-access | Repository Configuration | backend/src/main/resources/application.yml | 13-14 | Datasource URLs have hardcoded fallbacks in default runtime configuration |
| 36 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24-26 | Entity primary keys use UUID and entity-level generation instead of String UUID generated in the service layer |
| 37 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24-40 | Column names are not explicitly declared for all entity fields |
| 38 | High | data-access | Optimistic Locking | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71-76 | Zero-hit repeat recording can lose increments under concurrent searches |
| 39 | High | data-access | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 50-101 | Product audit timestamps are maintained manually instead of Hibernate audit annotations |
| 40 | Medium | data-access | Flyway Migration | backend/src/main/resources/db/migration/V1__create_products_and_zero_hit_searches.sql | 10-24 | Instant-backed timestamps are stored as TIMESTAMP without time zone |
| 41 | Medium | data-access | Query Quality | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Read APIs fetch entities and map them in memory instead of using DTO projections |
| 42 | Critical | config-di | Application Properties / Secret Management | backend/src/main/resources/application-docker.yml | 5-5 | Docker profile contains a hardcoded datasource password fallback |
| 43 | High | config-di | Spring Security Filter Chain | backend/src/main/java/com/skishop/config/SecurityConfig.java | 56-80 | Security headers are not explicitly configured in the SecurityFilterChain |
| 44 | High | config-di | Profile-Based Configuration | backend/src/main/resources/application.yml | 1-60 | Production and development profiles are not separated |
| 45 | High | config-di | Security Settings | backend/src/main/resources/application.yml | 33-38 | HTTPS enforcement or reverse-proxy TLS termination is not configured in target files |
| 46 | Medium | config-di | Logging / Embedded Server Hardening | backend/src/main/resources/application.yml | 1-60 | No logback-spring.xml with profile-specific structured logging |
| 47 | Low | config-di | Type-Safe Configuration | backend/src/main/java/com/skishop/config/AdminProperties.java | 14-15 | ConfigurationProperties records lack validation annotations |
| 48 | Critical | security | A02 Cryptographic Failures / Secret Management | backend/src/main/resources/application-docker.yml | 5-5 | Docker profile ships a hardcoded database password fallback |
| 49 | Critical | security | A07 Identification and Authentication Failures / Rate Limiting | backend/src/main/java/com/skishop/service/AdminAuthService.java | 52-58 | Admin login has no rate limiting or account lockout |
| 50 | High | security | STRIDE Tampering / CSRF Semantics / Business Logic Abuse | backend/src/main/java/com/skishop/service/ProductSearchService.java | 63-65 | Public GET search endpoint mutates zero-hit analytics state |
| 51 | High | security | Security Headers / XSS Defense in Depth | backend/src/main/java/com/skishop/config/SecurityConfig.java | 55-80 | CSP, Referrer-Policy, Permissions-Policy, and explicit HSTS policy are not configured |
| 52 | High | security | Denial of Service / Input Validation | backend/src/main/resources/application.yml | 33-38 | Request body and free-text inputs are not bounded |
| 53 | High | security | Spoofing / Session Management | backend/src/main/java/com/skishop/config/SecurityConfig.java | 76-79 | Bearer tokens cannot be revoked and repeated logins create unlimited active tokens |
| 54 | High | security | Information Disclosure / PII Logging | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 77-80 | User-controlled search keywords are logged without redaction |
| 55 | Medium | security | Business Logic Attack Resistance / Race Condition | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 66-76 | Zero-hit aggregate updates are vulnerable to lost updates |
| 56 | Critical | dependency | SNAPSHOT Version Exclusion | backend/pom.xml | 13-13 | Backend artifact is still published as a SNAPSHOT version |
| 57 | High | dependency | Test Scope Enforcement | backend/pom.xml | 80-84 | H2 is runtime-scoped even though it is configured only as the test database |
| 58 | High | dependency | Required Dependency Verification | backend/pom.xml | 45-100 | Required structured logging dependency is missing |
| 59 | Medium | dependency | Build Configuration | backend/pom.xml | 29-33 | UTF-8 source and reporting encodings are not declared |
| 60 | Medium | dependency | BOM Management | backend/pom.xml | 31-73 | Flyway version is explicitly overridden instead of inherited from Spring Boot dependency management |
| 61 | Medium | dependency | Test Dependency Checks | backend/pom.xml | 90-99 | PostgreSQL Testcontainers dependencies are absent |
| 62 | High | test-quality | Test Naming Convention | backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 16-33 | All test methods violate the required should_ExpectedResult_when_Condition naming pattern |
| 63 | High | test-quality | AAA Pattern | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 28-56 | Some tests combine multiple Act operations and multiple behaviors in one test method |
| 64 | High | test-quality | Coverage Criteria | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 26-38 | Important service and adapter classes have branch coverage below 80% |
| 65 | Medium | test-quality | DisplayName Usage | backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 15-16 | No tests use @DisplayName for human-readable specifications |
| 66 | Medium | test-quality | Parameterized Tests | backend/src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 28-35 | Boundary and repeated scenario tests are not parameterized |
| 67 | Medium | test-quality | Test Type Coverage | backend/pom.xml | 80-99 | Repository tests use H2 PostgreSQL mode but no PostgreSQL Testcontainers coverage |
| 68 | High | performance | Pagination | backend/src/main/java/com/skishop/service/ProductRequestOptions.java | 34-34 | Collection APIs implement only first-page limiting, not retrievable pagination |
| 69 | High | performance | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-44 | Product listing can execute the same count query twice |
| 70 | High | performance | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductSearchService.java | 59-60 | Product search duplicates the pageable count query and uses it for zero-hit logic |
| 71 | High | performance | JPA Query Optimization | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43-45 | Public product list/search fetch managed Product entities instead of DTO projections |
| 72 | Medium | performance | JPA Query Optimization | backend/src/main/java/com/skishop/service/ProductSpecifications.java | 39-44 | Search predicate is index-unfriendly and likely scans products as data grows |
| 73 | Medium | performance | Cache Strategy | backend/src/main/java/com/skishop/service/AiConsultationService.java | 45-47 | AI consultation reloads product master context on every request |
| 74 | Medium | performance | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ZeroHitQueryService.java | 64-67 | Zero-hit summary scans the same time window three times |
| 75 | Medium | performance | Memory Allocation | backend/src/main/java/com/skishop/service/AiPromptBuilder.java | 80-88 | Prompt list formatting creates an intermediate list and concatenates strings in reduce |
| 76 | Critical | resilience | Retry / Circuit Breaker | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 34-38 | Live AI provider call is not protected by retry or circuit breaker |
| 77 | High | resilience | Timeout Management | backend/src/main/java/com/skishop/config/SpringAiConfig.java | 28-37 | AI provider client has no explicit timeout contract |
| 78 | Medium | resilience | Bulkhead | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 35-35 | AI provider calls have no concurrency isolation |
| 79 | Medium | resilience | Health Checks | backend/src/main/resources/application.yml | 40-49 | No non-blocking health signal exists for the AI provider |
| 80 | Medium | resilience | Graceful Shutdown | backend/src/main/resources/application.yml | 33-39 | Graceful shutdown is not configured |


## Escalation Items
| # | Priority | Source Agent | Description | Recommended Decision Maker |
|---:|---|---|---|---|
| 1 | normal | tech-lead | Project owner must choose the OSS license and SCM metadata before backend publication metadata can be completed. | Repository owner / maintainer |
| 2 | normal | architecture | Decide whether the canonical backend package standard is the architecture agent's `model` + `dto/request` + `dto/response` structure or the current implementation's `entity` + flat `dto` structure. The code and review standard currently disagree. | Tech Lead / Solution Architect |
| 3 | normal | ddd-domain | Decide whether the MVP should remain a transaction-script style CRUD/read model or raise the backend to stricter DDD tactical modeling now. The current implementation is coherent for the small scope, but it does not meet the stricter Value Object and aggregate-invariant standard. | Tech lead / domain owner |
| 4 | normal | api-endpoint | The provided agent definition assumes a primarily Thymeleaf MVC application, while the backend source and backend design describe a REST JSON API consumed by Next.js. This review treated the backend target as REST; maintainers should confirm that this is the intended project-level convention before enforcing @Controller/view-name rules. | Tech lead / project maintainer |
| 5 | normal | api-endpoint | The backend design allows Spring ProblemDetail or an equivalent JSON error response, while this agent standard requires ProblemDetail. Decide whether ApiErrorResponse is an accepted public contract or should be migrated to ProblemDetail. | API owner / frontend owner |
| 6 | normal | java-standards | Clarify whether prohibited pattern #7 (`new XxxService()` for DI-managed beans) is intended to apply to unit tests. The wording says all Java files, but the agent scope also says detailed test-code quality is out of scope. | Project maintainer / Java standards owner |
| 7 | normal | async-concurrency | Decide whether the OSS backend should enable virtual threads globally for all profiles now, or gate it by profile after compatibility/load verification. | Backend technical lead |
| 8 | high | error-logging | Changing ApiErrorResponse to ProblemDetail is an API contract change and should be decided with the frontend/API owner because existing integration tests may assert the current JSON shape. | Backend/API owner and frontend owner |
| 9 | normal | error-logging | Decide whether raw search keywords are acceptable in operational logs under the project’s privacy posture. If logs may leave the local environment, prefer hashing or removing the keyword field. | Product owner or privacy/security reviewer |
| 10 | high | data-access | Decide whether the project must strictly follow the agent standard of String UUID primary keys or preserve PostgreSQL-native UUID columns. This affects entity types, migrations, DTO/test fixtures, and service ID generation conventions. | Backend technical lead |
| 11 | normal | data-access | Run schema validation against a real PostgreSQL instance to confirm whether Instant fields and TIMESTAMP columns pass Hibernate ddl-auto=validate in the target runtime. | Backend maintainer |
| 12 | high | config-di | Decide whether `application-docker.yml` is intended only for local smoke tests. If yes, keep demo credentials out of committed application profile defaults and move them to local-only compose/examples; if no, require runtime secret injection. | Tech lead / repository owner |
| 13 | normal | config-di | Confirm production TLS architecture: direct Spring Boot SSL versus reverse proxy/load balancer termination. This decision affects `application-prod.yml`, forwarded headers, HSTS, and deployment documentation. | Platform owner / deployment owner |
| 14 | highest | security | Decide whether the docker profile is intended for local-only demos or any deployable environment. If deployable, the hardcoded DB password fallback must be removed before OSS publication. | Project owner / security lead |
| 15 | high | security | Confirm the authentication architecture: the review standard assumes session-management controls, while the implementation uses stateless bearer tokens. The chosen model needs an explicit threat model for token storage, revocation, TTL, and XSS exposure. | Backend lead / security architect |
| 16 | normal | dependency | Decide whether this repository is currently on a releasable production/OSS branch. If it is not, the SNAPSHOT project version can be treated as a release-readiness blocker rather than an immediate production defect. | Project maintainer or release owner |
| 17 | normal | dependency | Confirm whether structured JSON logging via logstash-logback-encoder is mandatory for this backend or whether the dependency standard should allow a different logging implementation. | Backend tech lead |
| 18 | normal | test-quality | Decide whether PostgreSQL Testcontainers is required for OSS release quality or whether H2 MODE=PostgreSQL remains the accepted repository-test fidelity level for this project. | Project maintainer / backend tech lead |
| 19 | normal | performance | Decide whether the public API contract should remain top-N only for the current demo or be upgraded to true page/size pagination. The performance standard requires true pagination, but frontend contract tests currently assert a limit/totalCount shape. | Product owner / backend lead |
| 20 | normal | resilience | Decide whether retrying AI consultations is acceptable from a cost and duplicate-token-usage perspective. If yes, keep retries low and limited to transient network/provider exceptions. | Product owner and SRE |
| 21 | normal | resilience | Decide whether AI provider health should remain auxiliary only or be included in a separate authorized health group. The current backend design says AI health should not block base readiness. | SRE / platform owner |


## Conflict Resolution Record
| # | Agent A | Agent B | Conflict Description | Tech-Lead Adjudication | Rationale |
|---:|---|---|---|---|---|
|  |  |  |  |  |  |

## Design Document Cross-Reference Results
1. tech-lead: spec-design/backend-design.md §4.3 Index Design - Product search indexes named idx_products_name_lower and idx_products_manufacturer_lower are implemented as raw-column indexes rather than lower/case-insensitive indexes, while production search applies lower(...) to fields. (backend/src/main/resources/db/migration/V1__create_products_and_zero_hit_searches.sql)
2. architecture: spec-design/backend-design.md - Section 2.2 lists `AiPromptBuilder` as a Domain Service, but the implementation places it in `com.skishop.service` and consumes `AiConsultRequest` directly. (backend/src/main/java/com/skishop/service/AiPromptBuilder.java)
3. error-logging: orchest-code-review-error-logging agent definition - The review standard requires ProblemDetail/RFC 7807 responses, but the backend uses a custom ApiErrorResponse envelope from GlobalExceptionHandler and ApiErrorWriter. (backend/src/main/java/com/skishop/exception/ApiErrorResponse.java)
4. error-logging: orchest-code-review-error-logging agent definition - The review standard requires correlation ID propagation through MDC and logback patterns, but no MDC/correlation implementation or logback configuration exists. (backend/src/main/java/com/skishop/config/RequestLoggingFilter.java)
5. config-di: AGENTS.md / orchest-code-review-config-di - SecurityFilterChain does not include the required explicit `headers(...)` configuration block. (backend/src/main/java/com/skishop/config/SecurityConfig.java)
6. config-di: AGENTS.md / orchest-code-review-config-di - Profile-based common/dev/prod configuration separation is incomplete; only common and docker profiles are present. (backend/src/main/resources/application.yml)
7. config-di: AGENTS.md / orchest-code-review-config-di - Committed application profile contains a literal password fallback, violating zero-tolerance secret handling. (backend/src/main/resources/application-docker.yml)
8. security: orchest-code-review-security §20 Session Management Security - The implementation uses stateless opaque bearer tokens instead of the session-based model assumed by the security review checklist. Session cookie controls are not applicable, but equivalent token lifecycle controls are currently incomplete. (backend/src/main/java/com/skishop/config/SecurityConfig.java)

## Incomplete Reviews
No incomplete reviews.

## Codex SDK Execution Summary
| Agent | Thread ID | Duration | Input Tokens | Cached Input Tokens | Output Tokens | Reasoning Tokens |
|---|---|---:|---:|---:|---:|---:|
| tech-lead | 019e92ee-3270-7ea3-bcbb-18d2475d1a23 | 207916 | 1185928 | 1025024 | 11128 | 4269 |
| architecture | 019e92ee-32bc-79e0-8e90-15e214f6e1a2 | 172117 | 524309 | 404480 | 9853 | 4163 |
| ddd-domain | 019e92ee-32ea-77d2-a2cd-ad8057c69f90 | 145926 | 478781 | 429056 | 7986 | 3281 |
| api-endpoint | 019e92ee-32c1-7251-8798-e37eae06b172 | 147049 | 300860 | 256512 | 8413 | 3167 |
| java-standards | 019e92ee-32ea-7be1-b3dc-474321c3e940 | 213452 | 877290 | 798208 | 11703 | 4252 |
| async-concurrency | 019e92ee-32ea-71e3-af10-2ac24a8cba71 | 131183 | 360001 | 269824 | 6918 | 1927 |
| error-logging | 019e92ee-32b6-7390-9293-11f3c395388b | 110194 | 197386 | 154112 | 6661 | 1773 |
| data-access | 019e92ef-df24-71b2-b64b-69eab80ef357 | 117538 | 196787 | 146944 | 7083 | 2589 |
| config-di | 019e92f0-31f8-7772-8bef-30bebf00c832 | 180909 | 374617 | 274432 | 9944 | 3618 |
| security | 019e92f0-6aa1-7071-a768-46384ece1702 | 223606 | 679942 | 553472 | 12297 | 5023 |
| dependency | 019e92f0-6efa-7570-a698-4c4594691905 | 91115 | 118400 | 101888 | 5677 | 2280 |
| test-quality | 019e92f0-d106-7f42-bfb3-01a4d5174728 | 213118 | 703302 | 633856 | 9744 | 2745 |
| performance | 019e92f1-5cdb-7ad1-a2bc-5093082c9ae2 | 133126 | 235111 | 143872 | 8049 | 2918 |
| resilience | 019e92f1-7281-7900-a7f3-fe68b317118e | 116116 | 187518 | 141312 | 6808 | 2572 |


## Individual Agent Detail Reports
### tech-lead

- Status: completed
- Verdict: fail
- Summary: Tech-lead review of backend found no Critical prohibited-pattern violations, but there is one High-risk zero-hit upsert consistency issue plus maintainability/design alignment gaps.

# Source Code Review Report: Tech Lead

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 1 / Medium: 3 / Low: 0

## Prohibited Pattern Check Results
| # | Prohibited Pattern | Detection Count | Target File | Line |
|---|---|---:|---|---|
| 1 | System.out/System.err print | 0 | - | - |
| 2 | Empty catch(Exception) | 0 | - | - |
| 3 | Hardcoded production secrets | 0 | - | - |
| 4 | String-concatenated SQL | 0 | - | - |
| 5 | new Service()/Repository in production | 0 | - | - |
| 6 | @Autowired field injection | 0 | - | - |
| 7 | Optional.get() without check | 0 | - | - |
| 8 | PII/token values logged plainly | 0 confirmed | - | - |
| 9 | java.util.Date | 0 | - | - |
| 10 | Controller -> Repository direct reference | 0 | - | - |
| 11 | @Transactional on Controller | 0 | - | - |

## Design Document Alignment
| Design Document | Alignment Status | Deviation Details |
|---|---|---|
| spec-design/backend-design.md | Mostly aligned | Endpoint layer, DTOs, Spring Security policy, entities, Flyway seed count align broadly. Product search index implementation deviates from the lower/case-insensitive index intent. |
| docs/agents/java/AGENTS.md | Mostly aligned | Constructor injection, records, DTO mapping, Spring Security, and fallback AI behavior are consistent. |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|---|---|---|---:|---|---|
| 1 | High | Data integrity / Transaction consistency | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 90 | Duplicate insert recovery continues after a flush constraint violation in the same transaction; concurrent same-key zero-hit records can still fail instead of incrementing. | Use PostgreSQL `INSERT ... ON CONFLICT (normalized_keyword) DO UPDATE`, or retry in a separate transaction after rollback. |
| 2 | Medium | Design alignment / DB schema | backend/src/main/resources/db/migration/V1__create_products_and_zero_hit_searches.sql | 30 | Indexes named as lower indexes are raw-column indexes while search uses `lower(...)`. | `CREATE INDEX idx_products_name_lower ON products (lower(name));` or document/rename the raw index. |
| 3 | Medium | KISS / Code consistency | backend/src/main/java/com/skishop/repository/ProductRepository.java | 23 | JPQL product list/search methods are only test-used; production uses Specifications, creating duplicate query paths. | Keep one query pattern and remove the other. |
| 4 | Medium | OSS readiness | backend/pom.xml | 16 | POM publication metadata is empty despite OSS-quality requirement. | Fill license/scm/url metadata or remove placeholder blocks until values are chosen. |

## Inter-Agent Conflict Arbitration
No inter-agent conflict data was provided.

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|---|---:|---|
| Prohibited Pattern Compliance | 5/5 | No confirmed Critical prohibited pattern in production target. |
| Design Document Alignment | 3/5 | Broadly aligned, with index/schema drift. |
| Code Consistency | 3/5 | Duplicate product query paths and incomplete publication metadata remain. |
| Naming Convention Compliance | 5/5 | Java naming and package conventions are consistent. |
| **Overall Score** | **14/20** | High-risk zero-hit transaction fallback should be fixed before pass. |

## Escalation Items
- Choose project OSS license and SCM metadata for backend POM publication readiness.

## Verification Notes
- This was a read-only review. I did not modify files or run Maven tests because the task requested review only and the workspace is read-only.

### architecture

- Status: completed
- Verdict: warning
- Summary: Architecture review of backend found no Critical layer dependency violations. Controllers stay behind service/use-case interfaces and repositories are encapsulated by services, but package conventions, DTO boundary isolation, domain component placement, and profile separation need correction before treating the architecture as fully compliant.

# Source Code Review Report: Architecture Review

## Summary
- **Review Target**: backend
- **Verdict**: ⚠️ Warning
- **Issue Count**: Critical: 0 / High: 1 / Medium: 3 / Low: 0

## Layer Dependency Direction Check
| Package | Dependency Violation | Details |
|---------|---------------------|---------|
| controller/ | None found | Controllers import DTOs and service use-case interfaces, not repositories. |
| service/ | None found for reverse controller dependency | Services use repositories/entities/DTOs and contain transaction boundaries. |
| repository/ | None found | Repositories depend on entity types and Spring Data only. |

## Project Structure Check
| Package | Structure Compliance | Missing/Misplaced Packages |
|---------|---------------------|---------------------------|
| controller/service/repository/config/exception | Mostly compliant | Expected `model/`, `dto/request/`, and `dto/response/` are absent. JPA entities are under `entity/`; request and response DTOs are mixed in flat `dto/`. |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|----------|-------------|------|-------------------|-------------|
| 1 | High | Project Structure | backend/src/main/java/com/skishop/entity/Product.java | 1 | Required package convention is not implemented for `model`, `dto/request`, and `dto/response`. | Move entities/DTOs to the expected packages or update the architecture standard to bless the current structure. |
| 2 | Medium | Design Deviation | backend/src/main/java/com/skishop/service/AiPromptBuilder.java | 1 | `AiPromptBuilder` is implemented in `service/` even though the backend design lists it as a Domain Service. | Move prompt policy to `domain/` with domain input, or revise the design. |
| 3 | Medium | Module Boundary | backend/src/main/java/com/skishop/dto/ZeroHitItemDto.java | 3 | Response DTO imports and exposes `com.skishop.entity.Priority`. | Map to a response DTO enum or string in the mapper. |
| 4 | Medium | Spring Boot Configuration | backend/src/main/resources/application.yml | 13 | Profile separation is incomplete; only common and docker config files are present. | Add explicit dev/prod profile files or document equivalent enforced profiles. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Layer Dependency Direction | 5/5 | No Controller→Repository, Service→Controller, or Repository→Service violation found. |
| Project Structure | 3/5 | Core packages exist, but required model/request/response package conventions are not met. |
| Module Boundary Enforcement | 4/5 | No JPA entity controller response leak found; one DTO still depends on an entity enum. |
| Spring Boot Configuration | 3/5 | SecurityConfig is present and centralized; profile separation is incomplete. |
| Separation of Concerns | 4/5 | Controllers are thin, transactions are in services, exceptions are centralized; prompt-domain placement needs cleanup. |
| **Total Score** | **19/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether `entity/` + flat `dto/` is intentionally accepted, or whether the implementation should be migrated to the architecture agent's `model/` + `dto/request` + `dto/response` standard.

Tests were not run because this was a source architecture review only and no file modifications were requested.

### ddd-domain

- Status: completed
- Verdict: warning
- Summary: DDD review found no Critical aggregate-boundary violations: repositories are per aggregate root, controllers are thin, and there are no child-entity repositories or direct JPA associations between aggregate roots. The main issues are ZeroHitSearch invariants being bypassable and key domain value concepts remaining primitive strings/BigDecimals instead of explicit Value Objects.

# Source Code Review Report: DDD Domain Review

## Summary
- **Review Target**: backend
- **Verdict**: ⚠️ Warning
- **Finding Count**: Critical: 0 / High: 3 / Medium: 0 / Low: 0

## Aggregate Root Boundary Check
| Service | Aggregate Root | Boundary Compliance | Violation Details |
|---|---|---|---|
| ProductQueryService / ProductSearchService | Product | Mostly compliant | Product is read-only; no child-entity repository or cross-aggregate JPA association found. |
| ZeroHitRecordingService / ZeroHitQueryService | ZeroHitSearch | Partial | Aggregate exists and is repository-owned, but key invariants and derived demand signals can be supplied from outside the aggregate. |

## Value Object Check
| Target | Immutability | Record Usage | Validation | @Embeddable |
|---|---|---|---|---|
| Product.price | BigDecimal immutable but primitive in domain | No | DB has non-negative check; entity has no domain validation | No |
| ZeroHitSearch.estimatedOpportunityLoss | BigDecimal immutable but primitive in domain | No | No aggregate-level non-negative/scale validation | No |
| ZeroHitSearch.normalizedKeyword | String immutable but primitive in domain | No | Normalized by service path only; constructor can bypass | No |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|---|---|---|---|---|---|
| 1 | High | Aggregate Invariant | backend/src/main/java/com/skishop/entity/ZeroHitSearch.java | 55 | Public constructor can create invalid ZeroHitSearch states without enforcing keyword, hitCount, timestamp, or amount invariants. | Validate in aggregate factory/constructor and restrict the all-args constructor. |
| 2 | High | Domain Logic Encapsulation | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71 | Priority and opportunity-loss consistency are calculated outside the aggregate and passed in as arbitrary values. | Let ZeroHitSearch record repeat demand and recalculate/validate demand signals through aggregate behavior. |
| 3 | High | Value Object Implementation | backend/src/main/java/com/skishop/entity/Product.java | 40 | Monetary and normalized-keyword concepts are raw BigDecimal/String fields, not self-validating Value Objects. | Add Money / NormalizedKeyword Value Objects and embed or convert them for JPA. |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|---|---:|---|
| Aggregate Root Boundary | 4/5 | No child repositories or direct aggregate associations; invariants are still bypassable. |
| Value Object Implementation | 2/5 | Clear VO candidates are primitive fields. |
| Domain Event Design | 4/5 | No inter-aggregate writes requiring events were found in this MVP scope. |
| Repository Pattern | 4/5 | One repository per aggregate root; queries remain mostly data-access oriented. |
| Domain Logic Encapsulation | 3/5 | Domain services exist, but aggregate consistency depends on service-supplied derived values. |
| Ubiquitous Language | 5/5 | Product, ZeroHitSearch, Priority, KeywordNormalizer, and OpportunityLossCalculator align with the design language. |
| **Total Score** | **22/30** | |

## Escalation Items (Requires Human Judgment)
- Decide whether strict DDD tactical modeling is required for the MVP now, or whether the current transaction-script style is acceptable until the domain grows.

### api-endpoint

- Status: completed
- Verdict: fail
- Summary: API endpoint review found Critical validation gaps and High REST/endpoint convention issues. URLs match the backend REST design and no legacy *.do mappings were found, but query parameters and some request fields are not protected by Bean Validation, and GET /api/products/search performs a write-side effect.

# Source Code Review Report: API Endpoint Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 3 / High: 3 / Medium: 1 / Low: 0
- **Notes**: No legacy `*.do` URL mappings were found. Source review only; tests were not executed.

## Endpoint List and Compliance
| Endpoint | HTTP Method | Separation | Validation | Authorization | @AuthenticationPrincipal |
|----------|------------|-----------|-----------|--------------|-------------------------|
| `/api/products` | GET | REST controller OK | ❌ raw query params | Public | N/A |
| `/api/products/search` | GET | REST controller OK | ❌ raw query params | Public | N/A |
| `/api/auth/login` | POST | REST controller OK | ⚠️ DTO partially bounded | Public | N/A |
| `/api/auth/me` | GET | REST controller OK | N/A | Authenticated | ❌ uses `Authentication` cast |
| `/api/admin/zero-hits` | GET | REST controller OK | ❌ raw query params | Admin role | N/A |
| `/api/admin/ai-consult` | POST | REST controller OK | ⚠️ DTO partially constrained | Admin role | N/A |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | High | HTTP method correctness | `backend/src/main/java/com/skishop/controller/ProductController.java` | 43 | `GET /api/products/search` records zero-hit state through the service, so a safe method mutates metrics. | Split read-only search and POST-based zero-hit recording, or explicitly mitigate/document analytics side effects. |
| 2 | Critical | Input validation | `backend/src/main/java/com/skishop/controller/ProductController.java` | 33 | Product query params are raw `@RequestParam` values without Bean Validation or `@Validated`. | Add `@Validated`, `@Min/@Max`, `@Size`, and `@Pattern` constraints. |
| 3 | Critical | Input validation | `backend/src/main/java/com/skishop/controller/AdminZeroHitController.java` | 31 | Admin query params are not Bean-validated before service calls. | Add `@Validated`, range constraints for `days/limit`, and pattern constraints for `sort`. |
| 4 | Critical | Input validation | `backend/src/main/java/com/skishop/dto/AiConsultRequest.java` | 10 | Request DTO fields are partially unconstrained; `keyword`, `hitCount`, and timestamp have no validation, and text fields lack max sizes. | Add `@Size`, `@Min/@Max`, and timestamp constraints where applicable. |
| 5 | High | Parameter binding | `backend/src/main/java/com/skishop/controller/AuthController.java` | 42 | `/api/auth/me` manually reads and casts `Authentication` instead of using `@AuthenticationPrincipal`. | Use `me(@AuthenticationPrincipal AdminUserDto user)`. |
| 6 | High | Error response | `backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java` | 24 | Error handler returns custom `ApiErrorResponse`, not Spring `ProblemDetail`/`ResponseEntityExceptionHandler`. | Migrate to `ProblemDetail` or record an explicit API contract exception. |
| 7 | Medium | Mapping convention | `backend/src/main/java/com/skishop/controller/AdminZeroHitController.java` | 14 | Admin controllers do not declare a class-level `/api/admin` base mapping. | Add `@RequestMapping("/api/admin")` and method-relative mappings. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Spring MVC / Controller Pattern | 3/5 | REST controllers are under `com.skishop.controller`; admin base mappings are inconsistent. |
| REST Convention Compliance | 3/5 | URLs match current REST design, but GET search has write-side effects. |
| Input Validation | 1/5 | Body validation exists, but query params and several DTO fields are not Bean-validated. |
| Error Response | 3/5 | Sanitized custom JSON exists and stack traces are disabled, but not ProblemDetail. |
| Parameter Binding | 3/5 | Basic binding is clear; `/me` should use `@AuthenticationPrincipal`. |
| **Total Score** | **13/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether the backend is intentionally REST-first despite the agent definition describing a Thymeleaf MVC application.
- Decide whether the custom `ApiErrorResponse` is accepted as the public error contract or should be replaced with `ProblemDetail`.

### java-standards

- Status: completed
- Verdict: fail
- Summary: Reviewed backend Java source and test files for Java 21/Spring Boot coding standards. Production code largely follows records, constructor injection, final injected fields, and logging standards, but the stated prohibited DI pattern is present in test sources, and production code has service-interface and null-safety contract gaps.

# Source Code Review Report: Java 21 Coding Standards Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 2 / High: 4 / Medium: 0 / Low: 0

## Prohibited Pattern Detection Results
| # | Pattern | Count | Target File | Line # |
|---|---------|-------|-------------|--------|
| 1 | Direct `new XxxService()` for DI-managed bean | 3 | backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27, 39, 59 |
| 2 | Direct `new XxxService()` for DI-managed bean | 1 | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 80 |

No `System.out/err.println`, `printStackTrace`, `Thread.sleep`, `new RestTemplate`, `UnsupportedOperationException`, placeholder `RuntimeException("Not implemented")`, `TODO/FIXME/HACK/XXX`, or field `@Autowired` usage was found in production Java sources during scan.

## Incomplete / Shortcut Implementation Detection Results
| # | Type | Detection | Target File | Line # | Details |
|---|------|-----------|-------------|--------|---------|
| - | - | None found | - | - | No placeholder comments/exceptions or mock/fake/stub/dummy production classes found. |

## Naming Convention Check Results
| File | Violation Location | Current Name | Recommended Name |
|------|-------------------|-------------|------------------|
| - | - | - | No naming convention violations found. |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|----------|----------|-------------|--------|-------------------|-------------|
| 1 | Critical | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AiConsultationServiceTests.java | 27, 39, 59 | Spring `@Service` is directly instantiated with `new AiConsultationService(...)`. | Inject from Spring test context or extract pure non-DI logic for unit tests. |
| 2 | Critical | Prohibited Pattern / DI | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 80 | Spring `@Service` is directly instantiated with `new AdminAuthService(...)`. | Inject from Spring test context or extract non-DI token/session component. |
| 3 | High | DI Pattern Quality | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 24 | `ZeroHitRecordingService` has no corresponding interface and is injected by concrete type. | Add `ZeroHitRecordingUseCase` and inject that interface. |
| 4 | High | Null Safety | backend/src/main/java/com/skishop/dto/AiConsultRequest.java | 10 | Optional request components are unannotated nullable values. | Add `@Nullable` to `keyword`, `hitCount`, and `lastSearchedAt`, or validate as required. |
| 5 | High | Null Safety | backend/src/main/java/com/skishop/dto/ProductDto.java | 29 | Nullable `imageUrl` is exposed in public DTO without `@Nullable`. | Annotate DTO/entity getter and field, or make the field non-null end-to-end. |
| 6 | High | Null Safety | backend/src/main/java/com/skishop/repository/ProductRepository.java | 29, 48 | Repository category parameters accept null by query design but are not annotated. | Use `@Nullable @Param("category") String category`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Naming Conventions | 5/5 | Classes, interfaces, methods, constants, enums, and packages follow expected conventions. |
| Java 21 Feature Adoption | 4/5 | DTO/config payloads use records, queries and fallback messages use text blocks, and switch expressions are used for mappings. No missed sealed hierarchy was evident. |
| Prohibited Pattern Compliance | 1/5 | Direct construction of DI-managed services appears in test Java files under the provided all-Java prohibition. |
| DI Pattern Quality | 3/5 | Constructor injection and final fields are strong; `ZeroHitRecordingService` lacks a service interface. |
| Null Safety | 3/5 | Existing use-case parameters use `@Nullable`, but several DTO/entity/repository nullable contracts remain ambiguous. |
| **Total Score** | **16/25** | Fail due Critical prohibited pattern findings. |

## Escalation Items (Requires Human Judgment)
- Clarify whether `new XxxService()` prohibition applies to unit tests. The standards say all Java files, while the agent scope excludes detailed test-code quality.

### async-concurrency

- Status: completed
- Verdict: fail
- Summary: Async/concurrency review of backend found 1 Critical lost-update race in zero-hit aggregation and 2 High issues around Java 21 virtual-thread adoption and blocking AI calls inside a transaction/request path.

# Source Code Review Report: Async Processing & Concurrency Control Review

## Summary
- **Review Target**: backend directory
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 1 / High: 2 / Medium: 0 / Low: 0

## Virtual Thread Compatibility Matrix
| Class / Method | synchronized over I/O | ThreadLocal risk | ReentrantLock used | Verdict |
|---------------|----------------------|-----------------|-------------------|---------|
| backend configuration | None found | No application ThreadLocal found | N/A | ⚠️ `spring.threads.virtual.enabled=true` missing |
| `SpringAiProviderClient.generate` | None found | None found | N/A | ⚠️ blocking provider call on request path |

## Blocking Call Detection Results
| # | Pattern | File | Line # | Context |
|---|---------|------|--------|---------|
| 1 | Blocking SDK call | `backend/src/main/java/com/skishop/service/SpringAiProviderClient.java` | 35 | `chatClient.prompt(prompt).call().content()` invoked from the admin AI request path |

No `CompletableFuture.get()`, `.join()`, `Future.get()`, `Thread.sleep()`, `CountDownLatch.await()`, `@Async`, custom executors, or schedulers were found in production backend code.

## @Scheduled / Background Task Quality Check
| Task Name | Exception Handling | Graceful Shutdown | Thread Pool Config | Backoff | Verdict |
|-----------|-------------------|-------------------|-------------------|---------|---------|
| N/A | N/A | N/A | N/A | N/A | No scheduled/background tasks found |

## Issues
| # | Severity | Category | Target File | Line # | Issue Description | Fix Example |
|---|----------|----------|-------------|--------|-------------------|-------------|
| 1 | Critical | Thread Safety / DB Concurrency | `backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java` | 66 | Existing zero-hit rows are updated via read-increment-save without lock/version/atomic update, so concurrent requests can lose increments. | Use `@Version` + retry, `@Lock(PESSIMISTIC_WRITE)`, or an atomic `UPDATE hit_count = hit_count + 1`. |
| 2 | High | Virtual Thread Adoption | `backend/src/main/resources/application.yml` | 1 | Java 21/Spring Boot 3.2 backend does not enable virtual threads. | Add `spring.threads.virtual.enabled: true` and verify request/security behavior. |
| 3 | High | Blocking I/O / Transaction Scope | `backend/src/main/java/com/skishop/service/AiConsultationService.java` | 42 | Synchronous AI call occurs while the read-only transaction/request path remains active. | Fetch DB context in a short transaction, call AI outside the transaction, enable virtual threads, and configure provider timeouts. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| Virtual Thread Adoption | 2/5 | Java 21 is configured, but virtual threads are not enabled. |
| Blocking Call Absence | 3/5 | No future/get/sleep blocking found, but live AI is a blocking request-path call. |
| CompletableFuture / @Async Correctness | 5/5 | No `@Async` or `CompletableFuture` usage found. |
| @Scheduled / Background Task Quality | 5/5 | No scheduled/background tasks found. |
| Thread Safety | 2/5 | Zero-hit aggregation has a concrete lost-update race. |
| **Total Score** | **17/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether to enable virtual threads globally across profiles now or after a focused compatibility/load check.


### error-logging

- Status: completed
- Verdict: fail
- Summary: Exception/logging review of backend found no empty catch blocks, System.out logging, or string-concatenated log statements. Main risks are missing request correlation via MDC, non-ProblemDetail error payloads, missing server-side stack traces for handled failures, and no production JSON log configuration.

# Source Code Review Report: Exception Handling & Logging Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 5 / Medium: 2 / Low: 0

## Exception Handling Check Results
| File | Swallowing | throw e; | Logging in catch | Verdict |
|------|-----------|----------|------------------|---------|
| backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | None found | None found | Missing Throwable in catch-all handler log | ❌ Fail |
| backend/src/main/java/com/skishop/service/AiConsultationService.java | None found | None found | Missing Throwable in AiProviderException catch log | ❌ Fail |
| backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | None found | None found | Duplicate insert recovery rethrows/updates, no swallow | ✅ Pass |

## PII Logging Detection Results
| # | File | Line Number | Detected PII Item | Suggested Fix |
|---|------|-------------|-------------------|---------------|
| 1 | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 78, 93 | Potential PII in arbitrary user search keyword (`normalizedKeyword`) | Log row id/hash/length instead of raw keyword |

## Structured Logging Quality Check
| File | Placeholder Format | String Concatenation | System.out.println | Verdict |
|------|--------------------|---------------------|--------------------|---------|
| backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | Yes | No | No | ⚠️ Warning: no MDC correlation |
| backend/src/main/java/com/skishop/config/BearerTokenAuthenticationFilter.java | Yes | No | No | ✅ Pass |
| backend/src/main/java/com/skishop/config/SecurityConfig.java | Yes | No | No | ✅ Pass |
| backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | Yes | No | No | ❌ Fail: missing Throwable |
| backend/src/main/java/com/skishop/service/AiConsultationService.java | Yes | No | No | ❌ Fail: missing Throwable in catch |
| backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | Yes | No | No | ⚠️ Warning: raw keyword logged |

## Correlation ID (MDC) Implementation Status
| Module | Filter/Interceptor | Response Header | MDC Logging | MDC Cleanup |
|--------|-------------------|-----------------|-------------|-------------|
| backend | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |

## Findings
| # | Severity | Category | Target File | Line Number | Finding | Suggested Fix Code |
|---|----------|----------|-------------|-------------|---------|-------------------|
| 1 | High | Correlation ID / MDC | backend/src/main/java/com/skishop/config/RequestLoggingFilter.java | 25 | No X-Correlation-Id assignment, response propagation, MDC put, or MDC cleanup | Add OncePerRequestFilter with MDC.put/remove and response.setHeader |
| 2 | High | Exception Handling | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 108 | Catch-all 500 handler logs exception class but not stack trace | `LOGGER.error("Unexpected API error at {}", request.getRequestURI(), exception);` |
| 3 | High | Exception Handling | backend/src/main/java/com/skishop/service/AiConsultationService.java | 59 | Provider exception fallback log omits exception details | `LOGGER.warn("ai_consultation providerStatus={}", response.providerStatus(), exception);` |
| 4 | High | RFC 7807 | backend/src/main/java/com/skishop/exception/GlobalExceptionHandler.java | 36 | Custom ApiErrorResponse used instead of ProblemDetail | Return ProblemDetail and attach code/errors with properties |
| 5 | High | Structured Logging | backend/pom.xml | 45 | No logstash-logback-encoder/logback-spring.xml JSON logging | Add dependency and JSON logback config with app/correlation/trace fields |
| 6 | Medium | PII / Data Minimization | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 78 | Raw user search keyword logged | Log id/hash/length instead |
| 7 | Medium | Observability | backend/src/main/resources/application.yml | 40 | Only health actuator endpoint exposed; no custom metrics found | Expose protected metrics and add Micrometer counters/timers |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Exception Handling | 3/5 | Sanitized client errors and no swallowed exceptions, but server logs drop stack traces in key paths |
| Structured Logging Quality | 3/5 | Placeholder logging is used; JSON/logstash production logging is missing |
| PII Logging Compliance | 3/5 | No explicit email/password/token logging found; raw user keyword logging remains a risk |
| Correlation ID (MDC) | 1/5 | No correlation ID implementation found |
| Observability Integration | 3/5 | Actuator health exists; metrics/tracing/log integration incomplete |
| **Overall Score** | **13/25** | |

## Escalation Items (Requires Human Judgment)
- High: ProblemDetail migration changes API response shape and needs backend/frontend owner decision.
- Normal: Decide whether raw search keywords are permitted in operational logs.

### data-access

- Status: completed
- Verdict: fail
- Summary: Data-access review found one critical configuration issue and several high-impact JPA convention/concurrency gaps in backend. No files were modified.

# Source Code Review Report: Data Access Layer Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 4 / Medium: 2 / Low: 0

## Entity Design Check
| Entity | @Table | @Column Coverage | java.time Usage | Collection Init | @Version | Verdict |
|--------|--------|------------------|-----------------|-----------------|----------|---------|
| Product | OK | NG: several fields omit explicit `name` | Warning: `Instant` + DB `TIMESTAMP` | N/A | N/A/read-mostly | ⚠️ |
| ZeroHitSearch | OK | NG: several fields omit explicit `name` | Warning: `Instant` + DB `TIMESTAMP` | N/A | NG: mutable counter has no version | ❌ |

## Query Quality Check
| File | Method | readOnly TX | N+1 Risk | DTO Projection | Pagination | Verdict |
|------|--------|-------------|----------|----------------|------------|---------|
| ProductQueryService.java | listProducts | OK | Low | NG: entity fetch then map | OK | ⚠️ |
| ProductSearchService.java | search | Write TX justified by zero-hit recording | Low | NG: entity fetch then map | OK | ⚠️ |
| ZeroHitQueryService.java | listZeroHits | OK | Low | NG: entity fetch then map | OK | ⚠️ |
| AiConsultationService.java | consult | OK | Low | OK: scalar lists | N/A | ✅ |

## Transaction Management Check
| File | Method | @Transactional | Rollback Rule | Event Publishing | Verdict |
|------|--------|----------------|---------------|------------------|---------|
| ProductQueryService.java | listProducts | readOnly=true | N/A | N/A | ✅ |
| ProductSearchService.java | search | Present | N/A | N/A | ✅ |
| ZeroHitRecordingService.java | record | Present | N/A | N/A | ⚠️ lost-update risk without optimistic/atomic locking |
| Controllers | public endpoints | No controller TX found | N/A | N/A | ✅ |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Example |
|---|----------|----------|-------------|------|---------|-------------|
| 1 | Critical | Repository Configuration | backend/src/main/resources/application.yml | 13 | Datasource URL has hardcoded fallback `jdbc:postgresql://localhost:5432/skishop`. | Require env var in default/prod config; move defaults to explicit local profile. |
| 2 | High | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24 | PK uses `UUID`, and IDs are generated in entity lifecycle/factory code instead of service-level String UUID. | Use `String id`, `length=36`, and generate `UUID.randomUUID().toString()` in service boundary. |
| 3 | High | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 24 | Multiple `@Column` annotations omit explicit `name`. Same pattern exists in ZeroHitSearch. | Add `@Column(name = "snake_case", ...)` for every persisted field. |
| 4 | High | Optimistic Locking | backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java | 71 | Repeat recording uses read-modify-save on `hitCount` with no `@Version`, lock, or atomic update. | Add `@Version` and retry/translate lock conflicts, or use an atomic increment query. |
| 5 | High | Entity Design | backend/src/main/java/com/skishop/entity/Product.java | 50 | Product audit timestamps are manually maintained via lifecycle callbacks. | Use `@CreationTimestamp` / `@UpdateTimestamp`. |
| 6 | Medium | Flyway Migration | backend/src/main/resources/db/migration/V1__create_products_and_zero_hit_searches.sql | 10 | `Instant` fields are stored as `TIMESTAMP` without time zone. | Use `TIMESTAMPTZ` or switch entities to `LocalDateTime` intentionally. |
| 7 | Medium | Query Quality | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43 | Read APIs fetch entities and map to DTOs in memory. | Use DTO projections for list/search/radar reads. |

## Scorecard
| Evaluation Area | Score (1-5) | Notes |
|----------------|-------------|-------|
| Entity Design | 2/5 | Tables exist and java.time is used, but PK convention, explicit column names, audit annotations, and versioning need work. |
| Query Quality | 4/5 | Pagination and parameter binding are good; DTO projection is the main gap. |
| Transaction Management | 4/5 | Service-layer transactions are present; zero-hit update still needs concurrency handling. |
| Optimistic Locking | 2/5 | Mutable zero-hit aggregate has no version or conflict handling. |
| Flyway Migration | 3/5 | Migrations exist and naming is valid; timestamp semantics and validation against PostgreSQL need confirmation. |
| **Total Score** | **15/25** | |

## Escalation Items (Requires Human Judgment)
- Decide whether to enforce String UUID IDs or preserve PostgreSQL-native UUID columns.
- Run Hibernate `ddl-auto=validate` against real PostgreSQL to verify `Instant`/`TIMESTAMP` compatibility.

No tests were run; this was a read-only source review.

### config-di

- Status: completed
- Verdict: fail
- Summary: DI registration is mostly sound, but the backend fails this specialized review because application-docker.yml contains a literal datasource password fallback, and the SecurityFilterChain does not explicitly configure required security headers/CSP. Production profile and HTTPS/logging hardening are also incomplete.

# Source Code Review Report: DI / Configuration / Security Filter Chain Review

## Summary
- **Review Target**: backend directory
- **Verdict**: ❌ Fail
- **Issue Count**: Critical: 1 / High: 3 / Medium: 1 / Low: 1

## Spring Security Filter Chain Check
| # | Expected Configuration | Actual Configuration | Verdict |
|---|----------------------|---------------------|---------|
| 1 | Global exception handler | `GlobalExceptionHandler` uses `@RestControllerAdvice` | ✅ Pass |
| 2 | CORS before authentication | `.cors(Customizer.withDefaults())` plus `CorsConfigurationSource` bean | ✅ Pass |
| 3 | CSRF configuration | Disabled for stateless JSON API | ✅ Pass |
| 4 | Session management | `SessionCreationPolicy.STATELESS` | ✅ Pass |
| 5 | Request authorization | Public health/products/login; auth required for `/api/auth/me`; admin role for `/api/admin/**` | ✅ Pass |
| 6 | Authentication filter/provider | `BearerTokenAuthenticationFilter` registered before `UsernamePasswordAuthenticationFilter` | ✅ Pass |
| 7 | Security headers | No `.headers(...)` DSL block | ❌ Fail |

## DI Registration Check
| Bean | Stereotype | Scope | Injection Method | Issue | Verdict |
|------|-----------|-------|-----------------|-------|---------|
| `SecurityConfig` | `@Configuration` | Singleton | Constructor | None | ✅ Pass |
| `BearerTokenAuthenticationFilter` | `@Component` | Singleton | Constructor | None | ✅ Pass |
| `RequestLoggingFilter` | `@Component` | Singleton | No dependencies | None | ✅ Pass |
| `AdminAuthService` | `@Service` | Singleton | Constructor | Uses thread-safe in-memory sessions; acceptable for demo but should be revisited for production persistence | ⚠️ Warning |
| Product/zero-hit/AI services | `@Service` / `@Component` | Singleton | Constructor | No field injection found | ✅ Pass |
| Repositories | Spring Data interfaces | Singleton proxies | Auto-detected | Extend `JpaRepository` | ✅ Pass |

## application*.properties Secret Detection
| File | Detected Secret | Type | Remediation |
|------|----------------|------|-------------|
| `backend/src/main/resources/application-docker.yml:5` | `${SPRING_DATASOURCE_PASSWORD:skishop}` | Hardcoded password fallback | Remove literal fallback and require env/secret injection |
| `backend/src/main/resources/application.yml` | None | Env placeholders only | No action |
| `backend/src/test/resources/application-test.yml` | `{noop}test-password` | Test fixture | Not counted as production secret |

## Issues
| # | Severity | Category | Target File | Line | Issue Description | Fix Example |
|---|---------|---------|------------|------|-------------------|-------------|
| 1 | Critical | Secret management | `backend/src/main/resources/application-docker.yml` | 5 | Docker profile contains a literal datasource password fallback | `password: ${SPRING_DATASOURCE_PASSWORD}` |
| 2 | High | Security filter chain | `backend/src/main/java/com/skishop/config/SecurityConfig.java` | 56 | Missing explicit `headers(...)` configuration | Add frame options, content type options, CSP, and HSTS |
| 3 | High | Profile separation | `backend/src/main/resources/application.yml` | 1 | No dev/prod profile separation found | Add `application-dev.yml` and `application-prod.yml` |
| 4 | High | HTTPS enforcement | `backend/src/main/resources/application.yml` | 33 | No `server.ssl.*` or reviewed TLS termination documentation | Configure SSL or document reverse proxy TLS |
| 5 | Medium | Logging | `backend/src/main/resources/application.yml` | 1 | No `logback-spring.xml` or profile-specific logging | Add profile-based structured logging |
| 6 | Low | Type-safe config | `backend/src/main/java/com/skishop/config/AdminProperties.java` | 14 | `@ConfigurationProperties` records lack validation | Add `@Validated` and Bean Validation constraints |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|----------------|-------------|-------|
| DI Registration Quality | 4/5 | Constructor injection and stereotypes are solid; in-memory singleton sessions remain a production consideration |
| Security Filter Chain | 3/5 | Authorization/authentication are present; explicit security headers are missing |
| Application Properties Quality | 2/5 | Stack traces and OSIV are handled, but Docker password fallback and profile separation fail the standard |
| Type-Safe Configuration | 3/5 | Uses `@ConfigurationPropertiesScan`; validation is missing |
| Security Settings | 2/5 | HTTPS/proxy handling, CSP/security headers, and structured logging need hardening |
| **Total Score** | **14/25** | |

## Escalation Items (Requires Human Judgment)
- Confirm whether Docker profile defaults are local-only. Even for local smoke, committed password fallbacks should be moved out of application profile defaults.
- Confirm production TLS architecture so Spring Boot SSL, forwarded headers, HSTS, and deployment documentation can be made consistent.

### security

- Status: completed
- Verdict: fail
- Summary: Static security review of backend found Critical issues in secret handling and brute-force protection, plus High-risk gaps around public state mutation, security headers, request limiting, bearer-token lifecycle, and user-input logging. No files were modified and no tests were run because this was a review-only task.

# Source Code Review Report: Security Review

## Summary
- **Review Target**: backend directory
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 2 / High: 5 / Medium: 1 / Low: 0
- **Review Mode**: Static source review only. No files modified; tests not run.

## Phase A: Implementation Compliance Check

| OWASP Area | Result |
|---|---|
| A01 Broken Access Control | Default deny and `/api/admin/**` role guard exist, but public GET mutates state. |
| A02 Cryptographic Failures | Critical: docker profile has hardcoded DB password fallback. |
| A03 Injection | No SQL concatenation, unsafe native query parameters, command execution, or unsafe deserialization found. |
| A07 XSS | High: CSP/referrer/permissions headers not configured. |
| A08 Mass Assignment | DTOs are used; no entity direct binding found. |
| A10 SSRF | No user-controlled URL fetch path found. |

## Phase B: STRIDE / Business Logic

| Category | Highest Risk | Notes |
|---|---|---|
| Spoofing | High | Bearer tokens lack revocation/logout/session cap. |
| Tampering | High | Public GET search can poison zero-hit analytics. |
| Repudiation | Medium | Security events are logged, but no external/tamper-resistant audit evidence found. |
| Information Disclosure | High | User-controlled search keywords are logged. Error responses are otherwise sanitized. |
| Denial of Service | Critical | Login has no rate limit/lockout; request/input sizes are unbounded. |
| Elevation of Privilege | Low | Admin route role guard is present; no IDOR surface found in current single-admin API. |

## Consolidated Findings

| # | Severity | Finding |
|---|---|---|
| 1 | Critical | `backend/src/main/resources/application-docker.yml:5` hardcodes DB password fallback. |
| 2 | Critical | `backend/src/main/java/com/skishop/service/AdminAuthService.java:52` login lacks rate limiting/account lockout. |
| 3 | High | `backend/src/main/java/com/skishop/service/ProductSearchService.java:63` public GET search mutates zero-hit state. |
| 4 | High | `backend/src/main/java/com/skishop/config/SecurityConfig.java:55` lacks explicit CSP/referrer/permissions headers. |
| 5 | High | `backend/src/main/resources/application.yml:33` and request DTOs lack request/input size bounds. |
| 6 | High | `backend/src/main/java/com/skishop/config/SecurityConfig.java:78` disables logout; bearer tokens cannot be revoked. |
| 7 | High | `backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java:77` logs user-controlled keywords. |
| 8 | Medium | `backend/src/main/java/com/skishop/service/ZeroHitRecordingService.java:66` uses non-atomic read/increment/save for zero-hit counts. |

## Scorecard

| Evaluation Item | Score |
|---|---:|
| Injection Prevention | 5/5 |
| Authentication/Authorization | 3/5 |
| Secret Management | 2/5 |
| Security Headers | 2/5 |
| CSRF Protection | 3/5 |
| Rate Limiting / DoS Defense | 1/5 |
| Spoofing Attack Resistance | 2/5 |
| Tampering Attack Resistance | 2/5 |
| Information Disclosure Resistance | 3/5 |
| Privilege Escalation Resistance | 4/5 |
| Business Logic Attack Resistance | 2/5 |
| Session/Token Management Security | 2/5 |
| Struts Legacy Pattern Safety | 5/5 |
| **Total Score** | **37/65** |

## Escalation Items
- Remove or explicitly constrain docker default credentials before OSS publication.
- Decide whether stateless bearer tokens are the intended auth model, then add equivalent lifecycle protections.

### dependency

- Status: completed
- Verdict: fail
- Summary: Dependency-management review found no prohibited legacy libraries, but backend/pom.xml fails release-quality dependency policy because the artifact is still SNAPSHOT, H2 is runtime-scoped despite only being configured for tests, required encoding metadata is absent, and selected dependency versions are drifting from Spring Boot BOM management.

# Source Code Review Report: Dependency Management Review

## Summary
- **Review Target**: backend/pom.xml
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 2 / Medium: 3 / Low: 0

## Prohibited Dependency Detection Results
| # | Dependency (groupId:artifactId) | Detected pom.xml | Replacement | Severity |
|---|-------------------------------|-------------------|-------------|----------|
| - | None detected | backend/pom.xml | - | - |

## SNAPSHOT Version Detection Results
| # | Dependency | Version | Detected pom.xml |
|---|-----------|---------|------------------|
| 1 | com.skishop:backend project artifact | 0.0.1-SNAPSHOT | backend/pom.xml:13 |

## Build Configuration Check
| pom.xml | Parent POM | Java Version | Encoding | Verdict |
|---------|-----------|--------------|----------|---------|
| backend/pom.xml | spring-boot-starter-parent 3.2.12 | 21 | Missing project.build.sourceEncoding and project.reporting.outputEncoding | ❌ Fail |

## Required Dependency Verification
| pom.xml | starter-web | starter-data-jpa | starter-security | flyway-core | actuator | Verdict |
|---------|-------------|------------------|------------------|-------------|----------|---------|
| backend/pom.xml | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Warning: logstash-logback-encoder missing; H2 scope issue |

## Findings
| # | Severity | Category | Target pom.xml | Finding | Suggested Fix |
|---|----------|----------|----------------|---------|---------------|
| 1 | Critical | SNAPSHOT Version Exclusion | backend/pom.xml:13 | Project artifact version is 0.0.1-SNAPSHOT. This is not a dependency coordinate, but it violates the agent's release-quality SNAPSHOT exclusion policy for production/OSS publication. | Use a stable release version such as 0.1.0 for releasable builds. |
| 2 | High | Test Scope Enforcement | backend/pom.xml:80 | com.h2database:h2 is runtime-scoped, while inspected app configs use PostgreSQL for runtime and H2 only in application-test.yml. | Change H2 scope to test unless a runtime H2 mode is intentionally supported. |
| 3 | High | Required Dependency Verification | backend/pom.xml:45 | net.logstash.logback:logstash-logback-encoder is not declared. | Add the encoder dependency with a stable vetted version, or approve/document an alternative structured logging standard. |
| 4 | Medium | Build Configuration | backend/pom.xml:29 | UTF-8 source/reporting encodings are missing from properties. | Add project.build.sourceEncoding and project.reporting.outputEncoding as UTF-8. |
| 5 | Medium | BOM Management | backend/pom.xml:31 | Flyway version is explicitly overridden via flyway.version and applied to flyway-database-postgresql. | Prefer Spring Boot parent BOM management; document compatibility if override is intentional. |
| 6 | Medium | Test Dependency Checks | backend/pom.xml:90 | PostgreSQL Testcontainers dependencies are absent despite PostgreSQL runtime and Flyway migrations. | Add org.testcontainers:junit-jupiter and org.testcontainers:postgresql with test scope, or document why H2-only integration coverage is sufficient. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Prohibited Dependency Compliance | 5/5 | No Struts, Log4j 1.x, commons-dbcp/dbutils, javax.servlet, javax.mail, or JUnit 4 detected. |
| SNAPSHOT Exclusion | 2/5 | No dependency/plugin SNAPSHOT detected, but project artifact is SNAPSHOT. |
| Build Configuration | 3/5 | Spring Boot parent 3.2.x and Java 21 are correct; encoding properties are missing. |
| Required Dependencies | 3/5 | Core web/JPA/security/validation/Flyway/PostgreSQL/test dependencies are present; structured logging dependency is missing. |
| Version Consistency | 4/5 | Single-module POM avoids cross-module conflicts; Flyway version override creates BOM drift risk. |
| **Overall Score** | **17/25** | Fails due to release SNAPSHOT policy and classpath-scope issue. |

## Escalation Items (Requires Human Judgment)
- Confirm whether backend/pom.xml is intended to represent a release/production branch. If not, treat the SNAPSHOT finding as release-readiness rather than production impact.
- Confirm whether logstash-logback-encoder is mandatory for this backend or whether the dependency standard should be updated for an alternative structured logging implementation.

### test-quality

- Status: completed
- Verdict: fail
- Summary: Backend test suite has broad integration coverage and an existing JaCoCo report above the overall 80% branch target, but it fails the requested test-quality bar because test method naming is universally non-compliant, AAA/act singularity is weak in several tests, and important service/adapter branches remain below 80%.

# Source Code Review Report: Test Quality Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 3 / Medium: 3 / Low: 0
- **Note**: I did not modify files. I used the checked-in/current JaCoCo report under `backend/target/site/jacoco`; tests were not freshly executed in this read-only sandbox.

## Test Naming Check
| File | Violating Method | Current Name | Recommended Name |
|------|------------------|--------------|------------------|
| backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java:16 | yes | keywordNormalizerTrimsLowercasesAndCollapsesWhitespace | should_returnNormalizedKeyword_when_keywordContainsCaseAndWhitespace |
| backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java:28 | yes | validLoginIssuesDistinctTokenAndValidatesAdminUser | should_issueDistinctToken_when_credentialsAreValid |
| backend/src/test/java/com/skishop/controller/AuthApiIntegrationTests.java:80 | yes | invalidLoginReturnsUnauthorizedErrorPayload | should_returnUnauthorizedErrorPayload_when_loginCredentialsAreInvalid |
| backend/src/test/java/com/skishop/repository/RepositoryIntegrationTests.java:142 | yes | zeroHitRepositoryPreventsDuplicateNormalizedKeywordsAndProvidesSummaryQueries | should_preventDuplicateNormalizedKeyword_when_zeroHitSearchIsSaved |

All 64 `@Test` methods scanned violate the required `should_ExpectedResult_when_Condition` pattern; 0 matching methods were found.

## AAA Pattern Check
| File | Method | Arrange Clear | Act Single | Assert Clear | Verdict |
|------|--------|---------------|------------|--------------|---------|
| backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java:28 | validLoginIssuesDistinctTokenAndValidatesAdminUser | Partial | No | Yes | ❌ Fail |
| backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java:46 | loginFailsWhenCredentialsAreMissingWrongOrUnconfigured | Partial | No | Yes | ❌ Fail |
| backend/src/test/java/com/skishop/repository/RepositoryIntegrationTests.java:123 | productRepositorySupportsInitialListSearchAverageAndAiContextQueries | Partial | No | Yes | ⚠️ Warning |

## Test Type Coverage
| Test Type | Exists | Framework | Target Layer | Verdict |
|-----------|--------|-----------|--------------|---------|
| Unit Test | Yes | JUnit 5, AssertJ, limited Mockito | Domain/service helpers | ⚠️ Naming/AAA issues |
| API Integration Test | Yes | `@SpringBootTest` + `@AutoConfigureMockMvc` | Controllers/security flows | ✅ Present |
| DB Slice Test | Yes | `@DataJpaTest` + H2 `MODE=PostgreSQL` | Repositories/schema | ⚠️ No PostgreSQL Testcontainers |
| Security Test | Yes | MockMvc with real token flow | Auth/admin endpoints | ✅ Present |
| E2E Test | Not in backend target | N/A | Browser UX | Not assessed for backend-only review |

## Coverage Verification
| Layer | Target | Estimated Achievement | Untested Method Count | Verdict |
|-------|--------|----------------------|-----------------------|---------|
| Overall | 80% branch | 83% branch, 95.4% line | 7 missed methods in report | ✅ Pass overall |
| Service package | 80% branch | 80% branch | 3 missed methods in package | ⚠️ Borderline |
| Controller package | 80% branch | n/a branches, 100% line/method | 0 | ✅ Pass |
| Repository | 70% branch | JaCoCo does not report repository interfaces; slice tests exist | Unknown | ⚠️ Fidelity risk |

Class-level branch gaps from the existing report: `SpringAiProviderClient` 25%, `AiConsultationService` 60%, `ZeroHitQueryService` 66.7%, `ProductSpecifications` 62.5%, config package 75%.

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | Test Naming Convention | backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 16 | All tests violate `should_ExpectedResult_when_Condition`. | `void should_returnNormalizedKeyword_when_keywordContainsCaseAndWhitespace()` |
| 2 | High | AAA Pattern | backend/src/test/java/com/skishop/service/AdminAuthServiceTests.java | 28 | Multiple Act operations are bundled in one test. | Split login, token uniqueness, and token validation tests. |
| 3 | High | Coverage Criteria | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 26 | Key service/adapter branches below 80%. | Add provider absent/blank/success/error tests. |
| 4 | Medium | DisplayName Usage | backend/src/test/java/com/skishop/domain/ZeroHitDomainTests.java | 15 | No `@DisplayName` usage found. | Add readable `@DisplayName` on important tests. |
| 5 | Medium | Parameterized Tests | backend/src/test/java/com/skishop/service/ProductRequestOptionsTests.java | 28 | Repeated boundary scenarios are not parameterized. | Use `@ParameterizedTest` with `@ValueSource`/`@CsvSource`. |
| 6 | Medium | Test Type Coverage | backend/pom.xml | 80 | No PostgreSQL Testcontainers test coverage. | Add Testcontainers PostgreSQL repository/migration suite. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| Test Naming Convention | 1/5 | 0 compliant test method names. |
| AAA Pattern | 2/5 | Some tests have clear spacing, but multiple Act/scenario bundling remains. |
| Test Type Coverage | 4/5 | Unit, API, DB slice, and security flows exist; no Testcontainers. |
| Coverage Criteria | 3/5 | Overall branch target passes, but important class-level branch gaps remain. |
| Mock Quality | 4/5 | Minimal mocking and no concrete-class mocking found; verification usage is limited. |
| **Overall Score** | **14/25** | Fails strict agent standard mainly due naming and focused-test quality. |

## Escalation Items (Requires Human Judgment)
- Whether PostgreSQL Testcontainers is mandatory for release-quality OSS confidence or H2 PostgreSQL mode remains sufficient for this project.

### performance

- Status: completed
- Verdict: fail
- Summary: Performance review found no N+1 relationship risks, but several High issues remain around limit-only pagination, duplicate count queries, and entity fetching on public list/search paths.

# Source Code Review Report: Performance Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 0 / High: 4 / Medium: 4 / Low: 0
- **Notes**: Review only; no files modified and no tests run.

## N+1 Query Detection Results
| # | File | Method | Line | Pattern | Fix Suggestion |
|---|------|--------|------|---------|----------------|
| - | - | - | - | No JPA relationships or loop-triggered lazy collection access found in target source. | No action. |

## Pagination Check
| Endpoint | Pagination Present | Default Size | Max Size | Verdict |
|----------|-------------------|-------------|----------|---------|
| GET /api/products | Partial: limit only, page fixed to 0 | 20 | 100 | ⚠️ Missing page/size metadata and page traversal |
| GET /api/products/search | Partial: limit only, page fixed to 0 | 20 | 100 | ⚠️ Missing page/size metadata and page traversal |
| GET /api/admin/zero-hits | Partial: limit only, page fixed to 0 | 20 | 100 | ⚠️ Missing page/size metadata and page traversal |

## JPA Query Optimization Check
| File | Method | readOnly Txn | DTO Projection | exists vs count | Verdict |
|------|--------|-------------|----------------|-----------------|---------|
| ProductQueryService.java | listProducts | Yes | No, entity mapped after fetch | N/A | ⚠️ Duplicate count and entity materialization |
| ProductSearchService.java | search | Write transaction due zero-hit recording | No, entity mapped after fetch | N/A | ⚠️ Duplicate count and entity materialization |
| ZeroHitQueryService.java | listZeroHits | Yes | No, entity mapped after fetch | N/A | ⚠️ Summary aggregates split into 3 queries |
| AiConsultationService.java | consult | Yes | Scalar distinct queries | N/A | ⚠️ Missing cache for stable product master context |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | High | Pagination | backend/src/main/java/com/skishop/service/ProductRequestOptions.java | 34 | Collection APIs are limit-only with page fixed to 0; clients cannot retrieve later pages and responses lack full page metadata. | Add validated page/size params and return totalElements/page/size/totalPages. |
| 2 | High | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43 | findAll(spec, pageable) can execute a Page count, then count(spec) executes another count. | Use Page<Product> page = repository.findAll(...); page.getTotalElements(). |
| 3 | High | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ProductSearchService.java | 59 | Search repeats the same count pattern and can duplicate count work on a hot endpoint. | Reuse Page.getTotalElements() for response and zero-hit detection. |
| 4 | High | DTO Projection | backend/src/main/java/com/skishop/service/ProductQueryService.java | 43 | Public product reads materialize managed Product entities before DTO mapping. | Add DTO/interface projections for public list/search reads. |
| 5 | Medium | Query Optimization | backend/src/main/java/com/skishop/service/ProductSpecifications.java | 39 | lower(...) + '%keyword%' LIKE is not helped by the current plain B-tree indexes. | Use pg_trgm/full-text search or expression indexes aligned to the predicate. |
| 6 | Medium | Cache Strategy | backend/src/main/java/com/skishop/service/AiConsultationService.java | 45 | Distinct categories/manufacturers are loaded on every AI consultation. | Cache product master context and evict on future product updates. |
| 7 | Medium | Duplicate Query Execution | backend/src/main/java/com/skishop/service/ZeroHitQueryService.java | 64 | Summary count and sums scan the same time window in three separate queries. | Combine into one aggregate projection query. |
| 8 | Medium | Memory Allocation | backend/src/main/java/com/skishop/service/AiPromptBuilder.java | 80 | formatList uses toList().stream().reduce(...) with repeated String concatenation. | Use Collectors.joining(System.lineSeparator()). |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| N+1 Query Prevention | 5/5 | No entity associations or query-in-loop patterns found. |
| JPA Query Optimization | 2/5 | Duplicate counts, entity materialization, and index-unfriendly search remain. |
| Pagination | 2/5 | Limits are bounded, but true page traversal and metadata are missing. |
| Memory Efficiency | 3/5 | Main issue is small but avoidable prompt formatting allocation. |
| Cache Strategy | 2/5 | Stable product master context is not cached. |
| **Overall Score** | **14/25** | High findings should be addressed before OSS-quality production posture. |

## Escalation Items (Requires Human Judgment)
- Decide whether the API contract should move from demo-style top-N responses to true page/size pagination, because frontend tests currently expect limit + totalCount while the performance standard requires proper pagination metadata.


### resilience

- Status: completed
- Verdict: fail
- Summary: Resilience review of backend found one critical gap in the live AI external call path: it has fallback after failure, but no retry/circuit breaker protection, no explicit timeout, no bulkhead, and no graceful shutdown configuration.

# Source Code Review Report: Resilience Review

## Summary
- **Review Target**: backend
- **Verdict**: ❌ Fail
- **Finding Count**: Critical: 1 / High: 1 / Medium: 3 / Low: 0

## HTTP Client Management Check
| Component | Bean-Managed | Timeout Configured | URL Externalized | Verdict |
|-----------|-------------|-------------------|-----------------|---------|
| Spring AI ChatClient | Yes | No explicit timeout | API key/model only | ⚠️ Warning |
| RestTemplate/WebClient direct use | No direct `new RestTemplate()` found | N/A | N/A | ✅ Pass |

## Resilience4j Configuration Check
| Client | @Retry | @CircuitBreaker | @TimeLimiter | Backoff | Verdict |
|--------|--------|-----------------|-------------|---------|---------|
| SpringAiProviderClient | No | No | No | No config | ❌ Fail |

## Health Check Implementation Status
| Component | /actuator/health | readiness | DataSource | Custom Indicators | Verdict |
|-----------|-----------------|-----------|------------|------------------|---------|
| Backend Actuator | Enabled and public | Probes enabled | Auto-configured by Boot when datasource health is active | None for AI provider | ⚠️ Warning |

## Fallback Strategy
| Component | External Dependency | Fallback on Failure | Defined | Verdict |
|-----------|-------------------|--------------------|---------|---------|
| AiConsultationService | Spring AI / OpenAI-compatible provider | Returns controlled fallback/error answer | Yes | ✅ Pass |

## Findings
| # | Severity | Category | Target File | Line | Finding | Fix Code Example |
|---|----------|----------|-------------|------|---------|------------------|
| 1 | Critical | Retry / Circuit Breaker | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 34 | Live AI call has no retry/circuit breaker and no Resilience4j config/dependency. | Add Resilience4j Spring Boot 3, annotate provider boundary with `@Retry` and `@CircuitBreaker`, configure 3 attempts with exponential backoff. |
| 2 | High | Timeout | backend/src/main/java/com/skishop/config/SpringAiConfig.java | 28 | Spring AI/OpenAI client has no explicit timeout. | Externalize `app.ai.response-timeout` and apply it through the Spring AI client or underlying HTTP client. |
| 3 | Medium | Bulkhead | backend/src/main/java/com/skishop/service/SpringAiProviderClient.java | 35 | AI provider call has no concurrency isolation. | Add `@Bulkhead(name = "aiProvider")` and configure `maxConcurrentCalls`. |
| 4 | Medium | Health | backend/src/main/resources/application.yml | 40 | No non-blocking AI provider health signal exists. | Add a lightweight AI provider health indicator/metric that does not block base readiness. |
| 5 | Medium | Graceful Shutdown | backend/src/main/resources/application.yml | 33 | Graceful shutdown is not configured. | Add `server.shutdown: graceful` and `spring.lifecycle.timeout-per-shutdown-phase: 20s`. |

## Scorecard
| Evaluation Item | Score (1-5) | Notes |
|-----------------|-------------|-------|
| HTTP Client Management | 3/5 | No direct `new RestTemplate()`, but AI endpoint/base client tuning is incomplete. |
| Retry / CB | 1/5 | No retry, circuit breaker, or backoff for the live provider call. |
| Health Checks | 3/5 | Actuator health/probes are enabled; AI provider signal is absent. |
| Timeout Management | 1/5 | No explicit external call timeout found. |
| Fallback | 5/5 | AI key absence and provider exception paths return controlled responses. |
| **Overall Score** | **12/25** | Fallback exists, but live-call resilience controls are missing. |

## Escalation Items (Requires Human Judgment)
- Decide AI retry policy with cost/idempotency tradeoffs.
- Decide whether AI provider health should be auxiliary only or placed in a separate authorized health group.

