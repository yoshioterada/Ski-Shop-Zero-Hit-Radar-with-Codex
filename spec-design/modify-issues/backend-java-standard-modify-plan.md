# Java Standards Remediation Plan

Created: 2026-06-04

Source report: `review-reports/manual-backend-java-standards/backend/check-report-1.md`

## 1. Purpose

This plan translates the issues identified during the Java standards review of the backend into concrete, implementation-ready remediation tasks.

The primary scope is `backend/`. However, some changes affect seed-data image URLs and the frontend API contract. Therefore, `frontend/`, root-level documentation, and design documents must also be updated when required.

## 2. Remediation Summary

| # | Finding | Recommended Action | API Compatibility Risk |
| ---: | --- | --- | --- |
| 1 | Placeholder and sample artifacts | Rewrite DTO comments as actual contract documentation and replace seed image paths with OSS-safe production assets | Low |
| 2 | Spring Boot 3.5.8 does not match the 3.2.x baseline | First verify whether alignment with 3.2.x is feasible. If it is not, document an approved standards exception | Medium |
| 3 | Packages use `com.codexskishop` | Rename the Java package namespace and Maven `groupId` to `com.skishop` | Low |
| 4 | Missing interfaces for dependency-injected services | Introduce use-case interfaces at controller and filter boundaries | Low |
| 5 | Missing nullability contract annotations | Add `@Nullable` to nullable request and helper parameters, and establish a non-null policy where appropriate | Low |
| 6 | Boolean DTO component naming | Add boolean prefixes to Java record component names while preserving existing JSON field names with `@JsonProperty` | Medium |

## 3. Prerequisites and Decision Gates

### 3.1 Spring Boot Version

The review baseline requires Spring Boot 3.2.x. The backend currently uses Spring Boot `3.5.8` and Spring AI `1.1.7`, so a direct downgrade may cause compatibility problems involving Spring AI, Spring Framework, or test dependencies.

Use the following decision process during implementation:

1. Prepare a candidate change that updates the parent version in `backend/pom.xml` to a Spring Boot 3.2.x release.
   - For example, use `3.2.12` or the latest available patch release in the 3.2 line.
2. Run `./mvnw -U -DskipTests compile`.
3. If compilation succeeds, continue with `./mvnw verify`.
4. If the build fails because of Spring AI or other dependency incompatibilities, choose one of the following options:
   - Downgrade the Spring AI BOM and starter to versions compatible with Spring Boot 3.2.x.
   - Retain Spring Boot 3.5.8 as an intentional architectural choice, document a standards exception, and update the review baseline.

The preferred approach in this plan is to align with 3.2.x and satisfy the review baseline. If compatibility validation proves that approach impractical, an approved and documented exception is considered a valid remediation.

### 3.2 Package Namespace

The review baseline requires `com.skishop`. Although `backend-design.md` uses `com.codexskishop` in examples, this remediation will rename the implementation to `com.skishop` to satisfy the Java standards review.

This change affects Java packages and the Maven `groupId`. It must not alter HTTP API paths or JSON contracts.

## 4. Finding 1: Placeholder and Sample Artifacts

### 4.1 Scope

- `backend/src/main/java/com/codexskishop/dto/ProductDto.java`
- `backend/src/main/resources/db/migration/V2__seed_products.sql`
- `frontend/public/images/products/`, if required
- README and design documents, if required

### 4.2 Problem

The Javadoc in `ProductDto` contains phrases such as `sample price` and `placeholder image URL`, which make the production API appear incomplete.

In addition, seed-data values in `image_url` repeatedly reference files named `*-placeholder.png`. The review classifies these as placeholder artifacts in production source code.

### 4.3 Required Changes

1. Rewrite the `ProductDto` Javadoc as an actual API contract.
   - Change `JPY sample price` to `price in JPY`.
   - Change `optional placeholder image URL` to `optional product image URL`.
2. Replace placeholder file names in seed-data image URLs with OSS-safe production asset names.
   - Examples:
     - `/images/products/skis-placeholder.png` -> `/images/products/skis.png`
     - `/images/products/ski-boots-placeholder.png` -> `/images/products/ski-boots.png`
     - `/images/products/bindings-placeholder.png` -> `/images/products/bindings.png`
3. Add OSS-safe image assets to `frontend/public/images/products/` that match every seed-data category.
   - Required categories:
     - `skis`
     - `ski-boots`
     - `bindings`
     - `goggles`
     - `helmets`
     - `wear`
     - `gloves`
     - `poles`
     - `wax`
     - `tuning-goods`
   - Do not use external images with unknown or unclear licenses.
   - Use only original SVGs, generated bitmap images, or images with clearly identified OSS-compatible licenses.
4. If frontend image fallback logic assumes placeholder file names, update it to use the production asset names.
5. The README may explain that the seed data is a demonstration catalog, but that explanation must not be used to justify retaining placeholder artifacts.

### 4.4 Validation

- Run `rg -n "sample|placeholder" backend/src/main backend/src/main/resources`.
- Run `./mvnw verify`.
- Run `docker compose --env-file .env.example up --build -d`.
- Verify that `imageUrl` values returned by `GET /api/products?limit=3` do not contain `placeholder`.
- Verify that product card images or category visuals render correctly in the frontend.

## 5. Finding 2: Spring Boot 3.2.x Baseline

### 5.1 Scope

- `backend/pom.xml`
- Spring AI BOM version, if required
- `backend/README.md`
- Root `README.md`
- Standards exception document, if required

### 5.2 Problem

The current parent version is Spring Boot `3.5.8`, while the Java standards review baseline requires Spring Boot `3.2.x`.

### 5.3 Preferred Approach: Align with 3.2.x

1. Change the parent version in `backend/pom.xml` to a 3.2.x release.
2. Verify compatibility with Spring AI BOM `1.1.7`.
3. If dependency resolution, compilation, or tests fail, identify and configure a compatible Spring AI BOM and starter version.
4. Inspect `./mvnw dependency:tree` and verify that Spring Framework, Spring Security, and Spring Data versions are not unintentionally mixed across release lines.
5. Ensure that `./mvnw verify` succeeds.
6. Verify the Docker build.

### 5.4 Alternative: Approve Spring Boot 3.5.8 as a Standards Exception

If alignment with 3.2.x introduces excessive downgrade risk for Spring AI or the existing Next.js/backend contract, create the following document:

- `docs/standards-exceptions/java-standard-exceptions.md`

Document all of the following:

- The reason for selecting Spring Boot 3.5.8.
- Compatibility considerations for Java 21, Spring Security, and Spring AI.
- Differences from the Spring Boot 3.2.x review baseline.
- Completed validation evidence:
  - `./mvnw verify`
  - Docker Compose smoke test
  - Full-stack browser journey

If this alternative is selected, treat the document as the maintainer decision for the escalation item in the check report.

### 5.5 Validation

- Run `./mvnw -U -DskipTests compile`.
- Run `./mvnw verify`.
- Run `docker compose --env-file .env.example up --build -d`.
- Verify `/actuator/health`.
- Verify the AI fallback endpoint.

## 6. Finding 3: Package Namespace

### 6.1 Scope

- `backend/pom.xml`
- `backend/src/main/java/com/codexskishop/**`
- `backend/src/test/java/com/codexskishop/**`
- Java imports in all backend tests
- README and design references that name the implementation package

### 6.2 Problem

The review baseline requires `com.skishop`, but the current base package is `com.codexskishop`.

### 6.3 Required Changes

1. Change the Maven `groupId`:
   - `com.codexskishop` -> `com.skishop`
2. Move the main package directory:
   - `backend/src/main/java/com/codexskishop` -> `backend/src/main/java/com/skishop`
3. Move the test package directory:
   - `backend/src/test/java/com/codexskishop` -> `backend/src/test/java/com/skishop`
4. Replace package declarations in every Java file:
   - `package com.codexskishop...` -> `package com.skishop...`
5. Replace all imports:
   - `import com.codexskishop...` -> `import com.skishop...`
6. Ensure that the Spring Boot main class starts successfully from the new package.
7. Verify that component scanning in `@SpringBootTest` still works.
8. Update package references in README files and phase acceptance documents, if present.

### 6.4 Implementation Constraints

- Do not change HTTP endpoints.
- Do not change JSON field names.
- Do not change the database schema or migration file names.
- Because this rename affects many files mechanically, do not combine it with unrelated refactoring.

### 6.5 Validation

- Run `rg -n "com\\.codexskishop" backend`.
- Run `./mvnw verify`.
- Run `docker compose --env-file .env.example up --build -d`.

## 7. Finding 4: Interfaces for Dependency-Injected Services

### 7.1 Scope

Services injected at controller or filter boundaries:

- `ProductQueryService`
- `ProductSearchService`
- `AdminAuthService`
- `ZeroHitQueryService`
- `AiConsultationService`

Existing interface:

- Retain `AiProviderClient`; it already defines the appropriate boundary.

### 7.2 Problem

Controllers and the security filter depend directly on concrete service classes. The review baseline requires interfaces for dependency-injected services and requires boundary components to depend on those interfaces.

### 7.3 Required Changes

Add the following use-case interfaces:

1. `ProductQueryUseCase`
   - Method:
     - `ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort);`
   - Implemented by `ProductQueryService`.
   - Injected into `ProductController`.
2. `ProductSearchUseCase`
   - Method:
     - `ProductSearchResponse search(@Nullable String q, @Nullable Integer limit, @Nullable String category, @Nullable String sort);`
   - Implemented by `ProductSearchService`.
   - Injected into `ProductController`.
3. `AdminAuthUseCase`
   - Methods:
     - `LoginResponse login(String username, String password);`
     - `Optional<AdminUserDto> validateToken(@Nullable String token);`
   - Implemented by `AdminAuthService`.
   - Injected into `AuthController` and `BearerTokenAuthenticationFilter`.
4. `ZeroHitQueryUseCase`
   - Method:
     - `ZeroHitListResponse listZeroHits(@Nullable Integer days, @Nullable String sort, @Nullable Integer limit);`
   - Implemented by `ZeroHitQueryService`.
   - Injected into `AdminZeroHitController`.
5. `AiConsultUseCase`
   - Method:
     - `AiConsultResponse consult(AiConsultRequest request);`
   - Implemented by `AiConsultationService`.
   - Injected into `AiConsultController`.

### 7.4 Implementation Example

```java
public interface ProductQueryUseCase {
   ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort);
}

@Service
public class ProductQueryService implements ProductQueryUseCase {
   @Override
   @Transactional(readOnly = true)
   public ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort) {
      ...
   }
}
```

### 7.5 Implementation Constraints

- Each interface must represent a use-case contract. Do not expose a collection of low-level, repository-like operations.
- Existing service implementation class names may remain unchanged.
- Do not create interfaces for internal collaborators without a concrete boundary or substitution requirement.
  - Examples: `ProductMapper`, `ZeroHitMapper`, `AiPromptBuilder`, and `OpportunityLossCalculator`.
- `AiProviderClient` is already an appropriate interface for the external provider boundary; do not introduce another interface for the same responsibility.

### 7.6 Validation

- Verify that controllers and the filter use constructor injection with interfaces rather than concrete service classes.
- Run `./mvnw verify`.
- Run the Spring context load test.

## 8. Finding 5: Null-Safety Annotations

### 8.1 Scope

Nullable request parameters and helper methods:

- `ProductRequestOptions.toPageable(Integer limit, String sort)`
- `ProductRequestOptions.toSort(String sort)`
- `ProductRequestOptions.normalizeCategories(String category)`
- `ProductQueryService.listProducts(...)`
- `ProductSearchService.search(...)`
- `ZeroHitQueryService.listZeroHits(...)`
- Controller parameters annotated with `@RequestParam(required = false)`
- `AdminAuthService.validateToken(String token)`
- Token extraction in `BearerTokenAuthenticationFilter`
- Optional AI request fields, which are nullable by DTO design

### 8.2 Problem

The code accepts nullable values implicitly. Public contracts and helper methods do not communicate which arguments may be `null`.

### 8.3 Required Changes

1. Use Spring nullability annotations:
   - `org.springframework.lang.Nullable`
   - Add `org.springframework.lang.NonNullApi` at package level where appropriate.
2. Add `@Nullable` to Java parameters corresponding to `@RequestParam(required = false)`.
3. Add `@Nullable` to nullable helper-method parameters.
4. Keep nullability annotations consistent between interface methods and their implementations.
5. For methods that never return `null`, either omit a method-level annotation or enforce the default through package-level `@NonNullApi`.
6. Clarify optional DTO record components through Javadoc and validation annotations.

### 8.4 Proposed Package-Level Annotation

Create `package-info.java` in relevant packages if package-level defaults are appropriate:

```java
@NonNullApi
package com.skishop.service;

import org.springframework.lang.NonNullApi;
```

Because this change is coordinated with the package rename, add these files only after migration to the `com.skishop` namespace.

### 8.5 Validation

- Run `rg -n "required = false" backend/src/main/java`.
- Verify that all nullable request parameters have `@Nullable`.
- Run `./mvnw verify`.
- Verify that IDE or static-analysis nullability warnings do not increase.

## 9. Finding 6: Boolean DTO Naming

### 9.1 Scope

- `LoginResponse`
- `AuthMeResponse`
- `ProductSearchResponse`
- Backend tests that invoke record accessors
- Frontend contract tests
- `frontend/src/types/api.ts`
- Frontend API validators and tests if JSON names change

### 9.2 Problem

The Java record components for boolean values do not use boolean prefixes.

Current names:

- `LoginResponse.success`
- `AuthMeResponse.authenticated`
- `ProductSearchResponse.zeroHitRecorded`

Recommended Java names:

- `isSuccess`
- `isAuthenticated`
- `hasZeroHitRecorded`

The frontend contract expects the JSON fields `success`, `authenticated`, and `zeroHitRecorded`. Changing those JSON field names would break `frontend-design.md` and the Phase 9 contract tests. Rename only the Java record components and preserve the existing JSON field names with `@JsonProperty`.

### 9.3 Required Changes

1. Update `LoginResponse`:

```java
public record LoginResponse(
   @JsonProperty("success") boolean isSuccess,
   String token,
   AdminUserDto user
) {
}
```

1. Update `AuthMeResponse`:

```java
public record AuthMeResponse(
   @JsonProperty("authenticated") boolean isAuthenticated,
   AdminUserDto user
) {
}
```

1. Update `ProductSearchResponse`:

```java
public record ProductSearchResponse(
   List<ProductDto> items,
   long totalCount,
   @JsonProperty("zeroHitRecorded") boolean hasZeroHitRecorded
) {
}
```

1. Update Java test calls to record accessors:
   - `success()` -> `isSuccess()`
   - `authenticated()` -> `isAuthenticated()`
   - `zeroHitRecorded()` -> `hasZeroHitRecorded()`
1. Verify through JSON contract tests that the existing field names remain unchanged:
   - `$.success`
   - `$.authenticated`
   - `$.zeroHitRecorded`
1. Do not change the frontend TypeScript DTOs.

### 9.4 Validation

- Run `./mvnw verify`.
- Verify that `FrontendContractIntegrationTests` succeeds.
- Run `npm run typecheck`.
- Run `npm test`.

## 10. Implementation Order

### Step 1: Replace Placeholder and Seed-Image Artifacts

Reason: This is a Critical finding with minimal API contract impact.

Tasks:

- Update the `ProductDto` Javadoc.
- Update seed-data `image_url` values.
- Add frontend public image assets or rename existing assets.
- Update affected product component tests.

Validation:

- Run `rg -n "sample|placeholder" backend/src/main backend/src/main/resources`.
- Run backend verification.
- Run the frontend build.

### Step 2: Correct Boolean DTO Naming

Reason: This change requires care to avoid breaking the JSON contract.

Tasks:

- Use `@JsonProperty` to separate Java component names from JSON field names.
- Update test accessor calls.
- Confirm that the frontend contract remains unchanged.

Validation:

- Run `./mvnw verify`.
- Run `npm run typecheck`.
- Run `npm test`.

### Step 3: Add Nullability Annotations

Reason: The same annotations can be incorporated into method signatures when introducing interfaces.

Tasks:

- Add `@Nullable` to nullable parameters.
- Add package-level `@NonNullApi` if appropriate.

Validation:

- Compile the backend.
- Run backend verification.

### Step 4: Introduce Service Use-Case Interfaces

Reason: This step aligns nullability annotations and method contracts while clarifying application boundaries.

Tasks:

- Add use-case interfaces.
- Make service classes implement those interfaces.
- Inject interfaces into controllers and the security filter.

Validation:

- Run the Spring context load test.
- Run all controller integration tests.

### Step 5: Rename the Package Namespace

Reason: This is a large mechanical change. Performing it separately later in the sequence makes failures easier to isolate.

Tasks:

- Update the Maven `groupId` and Java package declarations.
- Move package directories.
- Update imports.
- Update documentation references.

Validation:

- Run `rg -n "com\\.codexskishop" backend`.
- Run `./mvnw verify`.
- Run the Docker build.

### Step 6: Align with the Spring Boot Baseline

Reason: This step has the highest compatibility risk. Complete the unambiguous code-quality changes first, then validate dependency changes in isolation.

Tasks:

- Change the parent version to Spring Boot 3.2.x.
- Check dependency compatibility.
- Adjust the Spring AI version if required.
- If alignment is unsuccessful, create the standards exception document.

Validation:

- Resolve dependencies.
- Compile the backend.
- Run backend verification.
- Run the Docker Compose smoke test.

## 11. Test Plan

Backend:

```bash
cd backend
./mvnw verify
```

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Full stack:

```bash
docker compose --env-file .env.example up --build -d
curl http://localhost:8080/actuator/health
curl "http://localhost:8080/api/products?limit=3"
docker compose --env-file .env.example down -v
```

Manual browser validation:

- Open `http://localhost:3000`.
- Search for an existing product.
- Perform a search that returns zero results.
- Log in as an administrator.
- Open the Zero Hit Radar dashboard.
- Submit an AI fallback consultation.
- Check the browser console and network panel for CORS errors.

## 12. Completion Criteria

The remediation is complete when all of the following conditions are met:

- All Critical, High, and Medium findings in the check report are resolved.
- `rg -n "sample|placeholder" backend/src/main backend/src/main/resources` finds no incomplete artifacts.
- `rg -n "com\\.codexskishop" backend` returns no matches, or an approved standards exception document exists.
- Controllers and the security filter depend on service interfaces.
- Nullable public and helper contracts have explicit annotations.
- Java boolean DTO components use prefixes while JSON fields preserve the frontend contract.
- Backend `./mvnw verify` succeeds.
- Frontend linting, type checking, tests, build, and E2E tests succeed.
- The full stack starts with Docker Compose and all primary user journeys work.
- Alignment with Spring Boot 3.2.x succeeds, or the standards exception for retaining 3.5.8 is approved and documented.

## 13. Risks and Important Considerations

- Downgrading to Spring Boot 3.2.x introduces dependency compatibility risk and must be performed last as an isolated change.
- Renaming boolean record components changes Java accessor names. Carefully update all references in Java tests and service code.
- Do not change JSON field names. Always use `@JsonProperty` to preserve the frontend contract.
- The package rename affects many files mechanically. Do not mix unrelated refactoring into that change.
- Validate seed image path changes together with the frontend static assets.
- Do not add real secrets. Clearly identify demo credentials as sample values in `.env.example` and the README.
