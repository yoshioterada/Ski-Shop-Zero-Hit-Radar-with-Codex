# Codex Ski Shop Backend Service Implementation Plan

## 1. Purpose

This implementation plan defines a phased, comprehensive approach for implementing the Spring Boot backend specification in `spec-design/backend-design.md`.

Because `backend-design.md` covers REST APIs, persistence, authentication, Zero Hit Radar aggregation, AI consultation, Docker, testing, and frontend integration, the implementation is divided into 10 phases. Each phase clearly defines its scope, implementation tasks, and completion checklist, and requires verification against the specification before proceeding to the next phase.

## 2. Implementation Approach

- Use Java 21 / Spring Boot and maintain clear responsibility boundaries among Controller, Application Service, Domain Service, Repository, and Infrastructure layers.
- Establish the general user journey from the Product API through Zero Hit recording first, then add authentication, admin APIs, AI consultation, backend containerization, and full Docker Compose integration.
- Use Spring AI as the primary AI integration path and always implement a fallback so the demo remains functional when the API key is not configured.
- Protect admin endpoints with Spring Security authentication and authorization rather than ad hoc checks in Controllers.
- Make the product seed deterministic so that 100 products are reproducibly registered after Docker Compose starts.
- Add relevant unit or integration tests in each phase, with a final coverage target of at least 80%.
- If specification changes are required, update `backend-design.md` and this plan before implementation.
- The final deliverables must allow `frontend`, `backend`, and `db` to start together through `docker-compose.yml` and must include a reproducible `README.md` for users.

## 2.1 Common Completion Gate

In addition to each phase completion checklist, verify the following every time.

- [ ] The deliverables for this phase do not conflict with the corresponding sections of `backend-design.md`.
- [ ] The implementation complies with the Spring Boot rules in `docs/agents/java/AGENTS.md`.
- [ ] Production code contains no TODO, FIXME, temporary implementation, disconnected API, fixed response, or `Not implemented` marker.
- [ ] Source code contains no secrets, fixed plaintext passwords, API keys, or Bearer tokens.
- [ ] Added public classes, public methods, and important domain logic have sufficient Javadoc or comments.
- [ ] Existing tests and tests added in this phase pass.
- [ ] Build, static analysis, format, and coverage tasks pass when available.
- [ ] API error responses required for failure-state UX are frontend-friendly.
- [ ] The camelCase JSON defined by the frontend integration contract remains intact.

## 3. Phase Overview

| Phase | Name | Primary Deliverables |
| ---: | --- | --- |
| 1 | Backend Foundation, Dependencies, and Configuration | Spring Boot project, configuration, Actuator, common errors |
| 2 | DB Schema, Entity, Repository, and Seed | PostgreSQL schema, JPA entity, repository, 100-record seed |
| 3 | Product API, Search, and DTO Contract | Product list, product search, DTOs, validation, search specification |
| 4 | Zero Hit Recording Domain | Keyword normalization, zero-result search upsert, opportunity loss, priority |
| 5 | Admin Authentication and Spring Security | Login, token, `/api/auth/me`, admin endpoint protection, CORS |
| 6 | Zero Hit Radar Admin API | List, period filter, sort, limit, summary, authorization integration |
| 7 | AI Consultation API and Spring AI Fallback | Prompt, Spring AI adapter, fallback/error, AI API |
| 8 | Backend Container and Operational Configuration | Backend Dockerfile, backend env mapping, logging, health |
| 9 | Backend Integration Testing and OSS Acceptance | Core backend journeys, coverage, specification verification |
| 10 | Full Docker Compose and README | Combined `frontend`, `backend`, and `db` startup, README, reproduction steps |

## 3.1 Specification Traceability Matrix

| Phase | Corresponding Sections in `backend-design.md` |
| ---: | --- |
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

## 4. Phase 1: Backend Foundation, Dependencies, and Configuration

### Phase 1 Scope

- Spring Boot backend project
- Java 21 build configuration
- `application.yml`
- common package structure
- global exception handling
- health endpoint
- base test setup

### Phase 1 Implementation Tasks

1. Create a Java 21 / Spring Boot backend project.
2. Add Spring Web MVC, Spring Validation, Spring Data JPA, PostgreSQL driver, Spring Security, Actuator, Flyway, Spring AI, and test dependencies.
3. Standardize the package root on a clear lowercase package such as `com.codexskishop`.
4. Create Controller, service, domain, repository, entity, dto, config, and exception packages.
5. Define external configuration keys for the datasource, JPA, Flyway, Actuator, CORS, admin, and AI in `application.yml`.
6. Map environment variables to `SPRING_DATASOURCE_*`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AI_API_KEY`, `AI_MODEL`, and `CORS_ALLOWED_ORIGINS`.
7. Verify that Jackson camelCase JSON matches the DTO records.
8. Implement a common error response using `ProblemDetail` or a custom error object.
9. Implement `@ControllerAdvice` that returns frontend-friendly validation errors, authentication failures, and unexpected errors.
10. Make `/actuator/health` available as a public health endpoint.
11. Add a smoke test and context load test.

### Phase 1 Completion Checklist

- [ ] The backend project builds with Java 21.
- [ ] Spring Boot dependencies match the technology stack in `backend-design.md`.
- [ ] The package structure corresponds to layered architecture responsibilities.
- [ ] Required environment variable mappings are defined in `application.yml`.
- [ ] Secrets for the datasource, admin credentials, AI, and CORS are not hard-coded.
- [ ] `/actuator/health` returns `200` after startup.
- [ ] Validation errors return `400` with a clear JSON payload.
- [ ] Unexpected errors return a JSON payload that contains no secrets.
- [ ] `./mvnw test` or `./gradlew test` passes.
- [ ] Verified against sections 1, 2, 10, 11, 13, and 16 of `backend-design.md`.

## 5. Phase 2: DB Schema, Entity, Repository, and Seed

### Phase 2 Scope

- Flyway migration
- `Product` entity
- `ZeroHitSearch` entity
- `Priority` enum
- `ProductRepository`
- `ZeroHitSearchRepository`
- product seed data
- repository tests

### Phase 2 Implementation Tasks

1. Create the `products` table migration.
2. Create the `zero_hit_searches` table migration.
3. Define the `normalized_keyword` unique constraint.
4. Define `idx_products_name_lower`, `idx_products_manufacturer_lower`, and `idx_products_category`.
5. Define `idx_zero_hit_hit_count` and `idx_zero_hit_last_searched_at`.
6. Implement UUID, manufacturer, name, category, description, price, stockStatus, imageUrl, createdAt, and updatedAt in the `Product` entity.
7. Implement UUID, keyword, normalizedKeyword, hitCount, priority, estimatedOpportunityLoss, firstSearchedAt, and lastSearchedAt in the `ZeroHitSearch` entity.
8. Represent `stockStatus` and `priority` with enums or safe value constraints.
9. Implement the created/updated timestamp assignment mechanism.
10. Implement methods in `ProductRepository` to retrieve the initial list, search results, average price, distinct categories, and distinct manufacturers.
11. Implement queries in `ZeroHitSearchRepository` for normalized keyword lookup, persistence, radar items, and summaries.
12. Create a deterministic seed of 100 products based on real manufacturers and real product names.
13. Ensure the seed data includes category, description, price, stock status, and an image placeholder.
14. Verify the schema, constraints, and primary queries with Repository tests.

### Phase 2 Completion Checklist

- [ ] The `products` table satisfies the columns, types, and constraints in section 4.2.
- [ ] The `zero_hit_searches` table satisfies the columns, types, and constraints in section 4.2.
- [ ] The `normalized_keyword` unique constraint prevents duplicates.
- [ ] The indexes in section 4.3 are defined.
- [ ] The product seed registers 100 records.
- [ ] Seed data categories cover skis, ski boots, bindings, goggles, helmets, wear, gloves, poles, wax, and tuning goods.
- [ ] Manufacturer, name, category, description, price, and stock status are never NULL.
- [ ] The average price query returns a value suitable for opportunity loss calculations.
- [ ] Distinct categories and distinct manufacturers are available for AI context.
- [ ] Repository tests pass.
- [ ] Verified against sections 3, 4, and 7.4 of `backend-design.md`.

## 6. Phase 3: Product API, Search, and DTO Contract

### Phase 3 Scope

- Product DTO records
- `ProductController`
- `ProductQueryService`
- `ProductSearchService`
- product mapping
- product/search API tests

### Phase 3 Implementation Tasks

1. Implement `ProductDto`, `ProductListResponse`, and `ProductSearchResponse` as Java records.
2. Implement Entity-to-DTO mapping.
3. Implement `GET /api/products`.
4. Implement `GET /api/products/search`.
5. Validate the `limit`, `category`, and `sort` query parameters.
6. Trim `q` and handle blank values according to the specification.
7. Search manufacturer, name, category, and description fields.
8. Connect the category filter and sort behavior to the repository/service.
9. In this phase, make `ProductSearchResponse.zeroHitRecorded` always false or define explicit behavior before Zero Hit service integration; complete it in Phase 4.
10. Add tests that allow Phase 5 to reconfirm that the endpoints remain publicly accessible without security credentials.
11. Use API integration tests to verify listing, matching searches, blank searches, and invalid parameters.

### Phase 3 Completion Checklist

- [ ] `GET /api/products` returns the camelCase JSON defined by `ProductListResponse`.
- [ ] `GET /api/products` can return up to 20 records for the initial display.
- [ ] A search such as `GET /api/products/search?q=Atomic` returns matching products.
- [ ] Search targets include manufacturer, name, category, and description.
- [ ] A blank keyword is excluded from Zero Hit recording.
- [ ] The upper bound and invalid values for `limit` are validated.
- [ ] The `category` filter applies to both product listing and search.
- [ ] A `sort` value outside the allowed set returns `400`.
- [ ] DTO fields match section 6.1.
- [ ] API tests pass.
- [ ] Verified against sections 5.1, 6.1, 7.1, 7.2, 10, 11, and 12.1 of `backend-design.md`.

## 7. Phase 4: Zero Hit Recording Domain

### Phase 4 Scope

- `KeywordNormalizer`
- `OpportunityLossCalculator`
- `ZeroHitRecordingService`
- Product search integration
- zero-hit upsert tests

### Phase 4 Implementation Tasks

1. Implement `KeywordNormalizer.normalize()`.
2. Define normalization rules as trim, lower-case, and repeated whitespace collapse.
3. Implement `OpportunityLossCalculator.calculate()`.
4. Decide whether to obtain the average product price from a fixed value or a repository query, and implement it consistently with the specification.
5. Implement `ZeroHitRecordingService.record(keyword)`.
6. When the normalized keyword does not exist, insert it with `hitCount=1`, `firstSearchedAt=now`, and `lastSearchedAt=now`.
7. When the normalized keyword exists, increment `hitCount` and update `lastSearchedAt`.
8. Recalculate `estimatedOpportunityLoss` on insert/update.
9. Recalculate `priority` as `HIGH`, `MEDIUM`, or `LOW` on insert/update.
10. Explicitly document the MVP threshold based on the example in `backend-design.md`.
11. Call `record(keyword)` from `ProductSearchService` only when the search returns 0 results and is a valid non-empty search.
12. Use the unique constraint and a transaction to prevent duplicate rows during concurrent updates.
13. Use unit and integration tests to verify normalization, opportunity loss, initial recording, repeated increments, and blank-value exclusion.

### Phase 4 Completion Checklist

- [ ] `KeywordNormalizer` performs trim, lower-case conversion, and whitespace collapse.
- [ ] Zero Hits are not recorded for anything other than a valid non-empty search.
- [ ] A search with at least 1 result does not record a Zero Hit.
- [ ] A search with 0 results returns `zeroHitRecorded=true`.
- [ ] The initial Zero Hit inserts exactly 1 row.
- [ ] Repeating a search for the same normalized keyword increments `hitCount` without adding a row.
- [ ] `firstSearchedAt` retains the initial timestamp, and `lastSearchedAt` updates on repeated searches.
- [ ] `estimatedOpportunityLoss` is updated based on `hitCount × averageProductPrice`.
- [ ] `priority` is updated according to the defined hitCount, recency, or opportunity loss rule.
- [ ] The upsert operation runs within a transaction boundary.
- [ ] Zero Hit tests pass.
- [ ] Verified against sections 3.2, 4.2, 7.2, 7.3, and 12.1 of `backend-design.md`.

## 8. Phase 5: Admin Authentication and Spring Security

### Phase 5 Scope

- Auth DTO records
- `AdminAuthService`
- token issuing and validation
- `AuthController`
- `SecurityConfig`
- bearer token filter
- CORS config
- security tests

### Phase 5 Implementation Tasks

1. Implement `LoginRequest`, `LoginResponse`, `AdminUserDto`, and `AuthMeResponse` as Java records.
2. Load `ADMIN_USERNAME` and `ADMIN_PASSWORD` as configuration properties.
3. Implement `AdminAuthService.login()`.
4. Validate the password against the environment variable value rather than hard-coding it in source code.
5. Choose either a signed JWT or an opaque in-memory token with expiry, and document the rationale in a comment or configuration.
6. Implement token expiry and treat expired tokens as invalid.
7. Implement `AdminAuthService.validateToken()`.
8. Create a Spring Security `Authentication` with `ROLE_ADMIN` authority from a valid token.
9. Implement the bearer token filter as a `OncePerRequestFilter` or equivalent Spring Security filter.
10. Implement `POST /api/auth/login`.
11. As a rule, login failure returns `401 Unauthorized` with an error payload. If the MVP uses `LoginResponse.success=false`, document in the README or API contract that the frontend must not store a token.
12. Implement `GET /api/auth/me`.
13. Ensure the frontend can handle a response where `user` is `null` or omitted from JSON when `authenticated=false`.
14. Define policies for public and protected endpoints in `SecurityConfig`.
15. Make `/api/products`, `/api/products/search`, `/api/auth/login`, and `/actuator/health` public.
16. Require a bearer token for `/api/auth/me`.
17. Require `ROLE_ADMIN` for `/api/admin/**`.
18. Use `AuthenticationEntryPoint` to return `401` with a controlled error for missing/invalid tokens.
19. Use `AccessDeniedHandler` to return `403` with a controlled error when the role is insufficient.
20. Disable CSRF appropriately for API endpoints.
21. Allow origins such as `http://localhost:3000` from `CORS_ALLOWED_ORIGINS`.
22. Use security tests to verify public access, successful/failed login, successful/failed me requests, expired tokens, and rejection of unauthenticated admin endpoint requests.

### Phase 5 Completion Checklist

- [ ] Admin credentials are loaded from environment variables.
- [ ] Source code contains no admin password, token secret, or token value.
- [ ] A valid login returns a token and admin user.
- [ ] An invalid login returns `401` with an error payload.
- [ ] Tokens have an expiry, and expired tokens return `401`.
- [ ] `GET /api/auth/me` returns `authenticated=true` with a valid token.
- [ ] `GET /api/auth/me` returns `401` for a missing/invalid token.
- [ ] The unauthenticated state of `AuthMeResponse` does not conflict with the frontend contract.
- [ ] `/api/admin/**` is rejected without `ROLE_ADMIN`.
- [ ] `/api/admin/**` is accessible with a valid admin token.
- [ ] Product APIs and the health endpoint remain public.
- [ ] CORS permits API calls from the frontend origin.
- [ ] Security tests pass.
- [ ] Verified against sections 5.2, 6.2, 7.2, 8, 10.2, 11, and 13 of `backend-design.md`.

## 9. Phase 6: Zero Hit Radar Admin API

### Phase 6 Scope

- Zero Hit DTO records
- `ZeroHitQueryService`
- `AdminZeroHitController`
- radar query and summary
- admin API tests

### Phase 6 Implementation Tasks

1. Implement `ZeroHitItemDto`, `ZeroHitSummaryDto`, and `ZeroHitListResponse` as Java records.
2. Align the `Priority` enum with the API DTO and domain/entity contracts.
3. Implement `GET /api/admin/zero-hits`.
4. Implement the `days` query parameter as a period filter supporting values such as 7, 30, and 90.
5. Implement the `sort` query parameter with allowed values such as hit count descending and last searched descending.
6. Implement the default, upper bound, and invalid-value validation for the `limit` query parameter.
7. Implement `ZeroHitQueryService.listZeroHits(days, sort, limit)`.
8. Apply the period filter based on `lastSearchedAt`.
9. Calculate `zeroHitKeywordCount`, `searchVolume`, and `estimatedOpportunityLoss` for the summary.
10. Return an empty list and zero-valued summary naturally when no Zero Hits exist.
11. Verify that Spring Security `ROLE_ADMIN` authorization protects the endpoint.
12. Use integration tests to verify rejection without a token, success with a token, sort, days, limit, summary, and the empty state.

### Phase 6 Completion Checklist

- [ ] `GET /api/admin/zero-hits` returns the camelCase JSON defined by `ZeroHitListResponse`.
- [ ] A request without a token returns `401`.
- [ ] A valid admin token can retrieve the list.
- [ ] The `days` filter returns only Zero Hits from the recent period.
- [ ] The equivalent of `sort=hitCount` orders records by strongest demand.
- [ ] The equivalent of `sort=lastSearchedAt` orders records from newest to oldest.
- [ ] `limit` is applied, and an invalid value returns `400`.
- [ ] The summary keyword count, search volume, and estimated opportunity loss are consistent with the items.
- [ ] When no Zero Hits exist, the response still returns empty items and a zero-valued summary.
- [ ] DTO fields match section 6.3.
- [ ] Admin API tests pass.
- [ ] Verified against sections 5.3, 6.3, 7.1, 7.2, 7.4, 10.2, and 12.2 of `backend-design.md`.

## 10. Phase 7: AI Consultation API and Spring AI Fallback

### Phase 7 Scope

- AI DTO records
- `ProviderStatus` enum
- `AiPromptBuilder`
- Spring AI adapter
- `AiConsultationService`
- `AiConsultController`
- AI fallback tests

### Phase 7 Implementation Tasks

1. Implement `AiConsultRequest`, `AiConsultResponse`, and `ProviderStatus` as Java records / enums.
2. Add `@NotBlank` validation to `AiConsultRequest.question`.
3. Implement `AiPromptBuilder`.
4. Include the keyword, hit count, last searched time, existing categories, and existing manufacturers in the prompt.
5. Write the prompt in Japanese and request a conclusion, rationale, procurement candidates, cautions, and next actions.
6. Implement an adapter that uses Spring AI `ChatClient`.
7. Inject Spring AI provider configuration from environment variables.
8. When `AI_API_KEY` is not configured, return a useful demo fallback answer with `ProviderStatus.FALLBACK`.
9. When an AI provider error occurs, prevent the service from crashing and return a controlled fallback or `ProviderStatus.ERROR`.
10. In `AiConsultationService.consult()`, orchestrate prompt creation, product context retrieval, AI adapter invocation, and fallback behavior.
11. Implement `POST /api/admin/ai-consult`.
12. Protect the endpoint with `ROLE_ADMIN` under `/api/admin/**`.
13. Prevent secrets, raw bearer tokens, and API keys from entering AI responses or prompts.
14. Use unit tests to verify prompt content, fallback behavior, and provider errors.
15. Use integration tests to verify rejection without a token, successful fallback with a valid token, and validation errors.

### Phase 7 Completion Checklist

- [ ] `POST /api/admin/ai-consult` returns the camelCase JSON defined by `AiConsultResponse`.
- [ ] A request without a token returns `401`.
- [ ] A blank `question` returns `400`.
- [ ] The prompt includes the keyword, hit count, and last searched time.
- [ ] The prompt includes context for existing categories and manufacturers.
- [ ] The prompt requests demand potential, candidate brands/product types, inventory considerations, procurement risks, seasonality, alternative products, and next actions.
- [ ] When the AI API key is not configured, the response contains `ProviderStatus.FALLBACK` and a practical answer in Japanese.
- [ ] A provider error returns a controlled response instead of causing the backend to fail with 500.
- [ ] Spring AI abstraction is the primary path, and provider-specific HTTP code is not scattered across the codebase.
- [ ] AI secrets, passwords, and bearer tokens do not appear in logs or responses.
- [ ] AI tests pass.
- [ ] Verified against sections 5.3, 6.4, 7.2, 7.3, 9, 12.3, and 13 of `backend-design.md`.

## 11. Phase 8: Backend Container and Operational Configuration

### Phase 8 Scope

- backend Dockerfile
- `.dockerignore`
- docker profile/application config
- logging
- health/readiness behavior
- backend container smoke verification

### Phase 8 Implementation Tasks

1. Create a multi-stage backend Dockerfile.
2. Use JDK 21 and Maven or Gradle in the build stage.
3. Run the jar with a JRE 21-equivalent runtime stage.
4. Configure `.dockerignore` to exclude build artifacts, IDE files, and secret files.
5. Verify that the backend container accepts datasource, admin credentials, AI configuration, and CORS origins through environment variables.
6. Provide a profile/configuration that allows the backend to connect to PostgreSQL through the Compose service name `db`.
7. Verify that `/actuator/health` reflects DB connectivity.
8. Design AI provider health so it does not block base readiness.
9. Safely log the request path, status, duration, Zero Hit event, AI provider status, and authentication failure with SLF4J.
10. Do not log passwords, API keys, or raw bearer tokens.
11. Verify reproducible build and smoke verification steps for the backend container by itself.

### Phase 8 Completion Checklist

- [ ] The backend Dockerfile uses a multi-stage build.
- [ ] The container starts with the equivalent of `java -jar app.jar`.
- [ ] The backend container accepts datasource, admin, AI, and CORS configuration exclusively through environment variables.
- [ ] The backend container supports configuration that uses the PostgreSQL host `db`.
- [ ] The configuration makes `http://localhost:8080/actuator/health` accessible from the host.
- [ ] Migrations and seed data are applied when the container starts.
- [ ] `GET /api/products` returns seeded products in the container environment.
- [ ] The backend starts and AI fallback remains available when the AI API key is empty.
- [ ] Logs contain no passwords, API keys, or raw bearer tokens.
- [ ] The backend container build and smoke verification are reproducible.
- [ ] Verified against sections 13, 14, and 16 of `backend-design.md`.

## 12. Phase 9: Backend Integration Testing and OSS Acceptance

### Phase 9 Scope

- full backend integration tests
- frontend-backend contract verification
- coverage report
- backend manual verification checklist
- backend final specification traceability

### Phase 9 Implementation Tasks

1. Inventory whether all unit tests in section 15.1 of `backend-design.md` have been implemented.
2. Inventory whether all integration tests in section 15.2 of `backend-design.md` have been implemented, and add any that are missing.
3. Verify the core journeys for product listing, product search, Zero Hit recording, admin login, Zero Hit Radar, and AI fallback in a sequence of integration tests.
4. Use contract tests or manual verification to confirm that frontend DTO and backend JSON response field names, types, and endpoints match.
5. Manually verify the backend API using the backend container and PostgreSQL.
6. Verify the empty-state response when no Zero Hits exist, API validation errors, authentication failures, AI fallback, and DB connection health.
7. Measure test coverage, target at least 80%, and add tests for insufficiently covered areas.
8. If coverage does not reach 80%, document the reason and the tests that should be added.
9. Verify that public APIs, important domain logic, and configuration have the required Javadoc/comments.
10. Before OSS publication, verify that no secrets, personal information, code with unknown licensing, or unnecessary artifacts are present.
11. Review the backend source using the perspectives in `docs/orchest-code-review*.agent.md`.
12. Finally, verify traceability against every section of `backend-design.md`; if anything is missing, return to the corresponding Phase and correct it.

### Phase 9 Completion Checklist

- [ ] Unit tests exist for `KeywordNormalizer`, `OpportunityLossCalculator`, `AiPromptBuilder`, `AdminAuthService`, and AI fallback.
- [ ] Integration tests exist for the Product API, search Zero Hits, repeated Zero Hit increments, admin authentication, Zero Hit Radar, and AI fallback.
- [ ] `GET /api/products` returns seeded products.
- [ ] `GET /api/products/search?q=Atomic` returns matching products.
- [ ] `GET /api/products/search?q=non-existing-keyword` returns empty items and `zeroHitRecorded=true`.
- [ ] Repeating a search for the same Zero Hit keyword increments `hitCount`.
- [ ] `GET /api/admin/zero-hits` is rejected without a token.
- [ ] `GET /api/admin/zero-hits` succeeds with an admin login token.
- [ ] The AI endpoint returns fallback behavior when `AI_API_KEY` is not configured.
- [ ] `/actuator/health` returns a healthy result that includes DB connectivity.
- [ ] API smoke verification with the backend container and PostgreSQL succeeds.
- [ ] Endpoints, field names, HTTP statuses, and error payloads in the frontend contract match backend responses.
- [ ] Build, static analysis, test, and coverage tasks pass.
- [ ] Coverage is at least 80%, or the reason for the shortfall and the tests to add are documented.
- [ ] Production code contains no TODO, FIXME, temporary implementation, disconnected UI/API, or nonfunctional primary button integration.
- [ ] No secrets, personal information, or copied code with unknown licensing are included.
- [ ] Every section of `backend-design.md` has been verified against every Phase of this plan.

## 13. Phase 10: Full Docker Compose and README

### Phase 10 Scope

- root `docker-compose.yml`
- root `.env.example` or documented env defaults
- frontend compose integration
- backend compose integration
- db compose integration
- full-stack manual verification
- root `README.md`

### Phase 10 Implementation Tasks

1. Create or update `docker-compose.yml` at the repository root.
2. Define `db`, `backend`, and `frontend` as Compose services.
3. Use PostgreSQL for the `db` service and define the database, username, password, volume, and healthcheck.
4. Build the `backend` service from the backend Dockerfile, make it depend on `db`, and publish host port `8080`.
5. Configure `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/skishop`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AI_API_KEY`, `AI_MODEL`, and `CORS_ALLOWED_ORIGINS=http://localhost:3000` in the `backend` service environment.
6. Build the `frontend` service from the frontend Dockerfile, make it depend on `backend`, and publish host port `3000`.
7. Configure `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` for browser-side API access.
8. Configure `INTERNAL_API_BASE_URL=http://backend:8080` as the container-internal URL only when using server-side route handlers or a proxy.
9. Verify that the frontend does not connect directly to PostgreSQL or the AI provider.
10. Verify that backend migrations and the 100-record product seed are applied automatically after Compose starts.
11. Verify that `docker compose up --build` starts `frontend`, `backend`, and `db` together.
12. Verify that the frontend is available at `http://localhost:3000` and backend health is available at `http://localhost:8080/actuator/health`.
13. Verify the general user journey: initial product display on the home page, existing product search, zero-result search, and Zero Hit recording.
14. Verify the administrator journey: login, admin dashboard, Zero Hit Radar display, and AI fallback consultation.
15. Use a browser to verify that no CORS errors occur when the full stack starts.
16. Create or update the root `README.md` and document the project purpose.
17. Document the primary directory structure in `README.md`.
18. Document the technology stack and service architecture in `README.md`.
19. Document prerequisite tools, environment variables, and handling of `.env` or Compose environment values in `README.md`.
20. Document local backend build/test/run steps in `README.md`.
21. Document local frontend build/test/run steps in `README.md`.
22. Document the full startup procedure using `docker compose up --build` in `README.md`.
23. Document the primary URLs, initial admin login configuration, and fallback behavior when the AI key is not configured in `README.md`.
24. Document the primary API endpoints, Zero Hit Radar behavior overview, troubleshooting, and test/coverage verification steps in `README.md`.
25. Document the prohibition against committing secrets and the OSS publication checks in `README.md`.

### Phase 10 Completion Checklist

- [ ] The root `docker-compose.yml` defines `db`, `backend`, and `frontend` services.
- [ ] The `db` service has a PostgreSQL database, user, password, volume, and healthcheck.
- [ ] The `backend` service connects to `db` and exposes host port `8080`.
- [ ] The `frontend` service exposes host port `3000`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` is set to the browser-resolvable `http://localhost:8080`.
- [ ] `INTERNAL_API_BASE_URL=http://backend:8080` is used only when a container-internal backend URL is required.
- [ ] `CORS_ALLOWED_ORIGINS` permits `http://localhost:3000`.
- [ ] The frontend does not connect directly to PostgreSQL or the AI provider.
- [ ] `docker compose up --build` starts `frontend`, `backend`, and `db` together.
- [ ] The 100-record product seed is registered after Compose starts.
- [ ] The home page is displayed at `http://localhost:3000`.
- [ ] `http://localhost:8080/actuator/health` returns a healthy result.
- [ ] Product cards appear when searching for existing products.
- [ ] A zero-result search displays the no-results state and records a Zero Hit.
- [ ] The Zero Hit Radar dashboard appears after admin login.
- [ ] AI consultation returns a fallback answer even when the AI key is not configured.
- [ ] No CORS errors appear in the browser console or network tab.
- [ ] `README.md` documents the project purpose.
- [ ] `README.md` documents the primary directory structure.
- [ ] `README.md` documents build, test, local run, and Docker Compose run procedures.
- [ ] `README.md` documents environment variables, initial admin credential configuration, AI fallback, and primary URLs.
- [ ] `README.md` documents the primary API endpoints and an overview of Zero Hit Radar behavior.
- [ ] `README.md` documents troubleshooting and pre-publication secret checks for OSS release.
- [ ] Verified against sections 14.2 and 15.3 of `backend-design.md` and sections 6.3 and 11.2 of `front-design.md`.

## 14. Final Acceptance Criteria

After all Phases are complete, the backend implementation is complete when the following criteria are satisfied.

- [ ] The Java 21 / Spring Boot backend starts both locally and with Docker Compose.
- [ ] PostgreSQL migrations and the 100-record product seed are reproducible.
- [ ] Product APIs respond according to the frontend contract.
- [ ] A Zero Hit is recorded only for a valid non-empty search with a result count of 0.
- [ ] The normalized keyword and DB constraint prevent duplicate demand records.
- [ ] Admin login, token validation, and admin authorization are implemented with Spring Security.
- [ ] The Zero Hit Radar API returns items and summary data correctly.
- [ ] The AI consultation API uses Spring AI as its primary path and remains available through fallback when the API key is not configured.
- [ ] Error responses, empty-state responses, authentication failures, and AI failures can be handled naturally.
- [ ] `/actuator/health` is publicly accessible and includes DB health.
- [ ] The root `docker-compose.yml` starts `frontend`, `backend`, and `db` together.
- [ ] The basic demo works without additional configuration after `docker compose up --build`.
- [ ] `README.md` documents the purpose, primary directory structure, environment variables, build, test, local execution, Docker Compose execution, primary URLs, and troubleshooting.
- [ ] Core user journeys have been verified through unit/integration/E2E tests or manual verification.
- [ ] Coverage targets at least 80%; if not achieved, the reason and an additional test plan are documented.
- [ ] Quality, structure, naming, comments, and secret management are suitable for OSS publication.
