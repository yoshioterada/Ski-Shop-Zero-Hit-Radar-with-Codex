# Java / Spring Boot AGENTS.md

This file provides instructions for AI coding agents that implement or modify the Java 21 / Spring Boot backend.

## Core Principles

- Implement for the Java 21 and Spring Boot ecosystem.
- Prefer official and officially supported Spring capabilities, including Spring Boot, Spring Web, Spring Data JPA, Spring Validation, Spring Security, and Spring AI.
- Adopt a third-party library only when Spring's standard capabilities cannot clearly provide an equivalent solution.
- Use code-generation libraries such as Lombok only when the project already uses them. When introducing one, explain its effects on readability, maintainability, and the build.
- Respect the separation of responsibilities established by the existing code and design documents. Do not mix Controller, Application Service, Domain Service, Repository, and Infrastructure responsibilities.
- Make the implementation appear complete even when it is an MVP. Do not leave temporary implementations, disconnected APIs, fixed responses, or TODO items.
- Use stable versions of Java, Spring Boot, Spring Security, and Spring AI that are available when the project is created. Do not newly adopt obsolete APIs.

## Coding Conventions

- Use lowercase package names consistently.
- Use PascalCase for class names, camelCase for method and variable names, and UPPER_SNAKE_CASE for constants.
- Use Java `record` types for DTOs whenever possible to make API contracts explicit.
- Prefer `enum` types and switch expressions for branching by state or category.
- Use pattern matching instead of an explicit cast after `instanceof`.
- Use text blocks for multiline SQL, JSON, and prompts.
- Methods that return collections must return empty collections rather than `null`.
- Use `Optional<T>` when a return value may be absent. Do not use `Optional` for fields, parameters, or collection elements.
- Use `Instant`, `LocalDateTime`, and `Clock` for time handling; avoid `Date` and `Calendar`.
- Use `BigDecimal` for monetary calculations. Do not represent prices or opportunity losses with `double` or `float`.

## Spring Implementation Rules

- Use constructor injection for dependency injection, and declare dependency fields as `private final`.
- Do not use field injection with `@Autowired`.
- Keep Controllers focused on HTTP input and output, Validation, status codes, and DTO conversion.
- Services must orchestrate use cases. Do not write business logic in Controllers.
- Define appropriate `@Transactional` boundaries for state-changing use cases, and use `readOnly = true` for read-only operations.
- Prefer Spring Data JPA for Repositories, and limit handwritten SQL to cases where it is necessary.
- Manage the DB schema and seed data reproducibly through migrations such as Flyway.
- Use Bean Validation for input validation.
- Use Spring Security for authentication and authorization. Minimize custom filters and custom token processing.
- Use Spring Security's `PasswordEncoder` for password verification, and avoid plaintext comparisons.
- Explicitly enforce authorization as well as authentication for admin APIs. Do not blur the boundary between public APIs and admin APIs.
- Prefer Spring AI for AI integrations, and ensure the basic demo continues to work when the API key is not configured.
- Do not incorporate unrestricted user input into AI prompts. Design input-length limits, a clearly defined purpose, and failure responses.
- Prefer current Spring APIs for HTTP clients, such as `RestClient`, `WebClient`, and Spring AI clients.
- Centralize external configuration in `application.yml` and environment variables. Do not hard-code secrets in source code.

## API and Error Design

- Keep API responses consistent with frontend DTOs. When making a breaking change, update the frontend and tests as well.
- Use a consistent error response for validation errors, authentication errors, authorization errors, not-found errors, and server errors.
- Centralize exception handling in components such as `@RestControllerAdvice`; do not duplicate it in individual Controllers.
- Match HTTP status codes to their semantics. Use `401` for authentication failures, `403` for insufficient permissions, and `400` for invalid input as the standard behavior.
- Restrict CORS to required origins only, and separate development and production configurations.

## Comments and Documentation

- Write Javadoc for public classes, public methods, and methods that are important to the domain.
- Javadoc must concisely explain what the code does, important constraints, and exceptions or side effects.
- Do not add redundant comments to self-explanatory getters, setters, or record accessors.
- Add brief comments that assist the reader when implementing complex branching, normalization, aggregation, authorization decisions, or AI prompt construction.

## Prohibited Practices

- Do not use `System.out.println`, `System.err.println`, or `printStackTrace()`. Use SLF4J for logging.
- Do not swallow exceptions with constructs such as `catch (Exception e) {}`.
- Do not use `Thread.sleep()`.
- Do not unnecessarily block request threads with `CompletableFuture.get()` or `.join()`.
- Do not instantiate `new RestTemplate()` directly. Configure it as a bean when it is required.
- Do not return JPA entities directly as API responses. Convert them to DTOs.
- Do not directly instantiate Spring-managed Services or Repositories with `new`.
- Do not place Mocks, Stubs, Fakes, or Dummies in production code.
- Do not conceal incomplete implementations with `UnsupportedOperationException` or `"Not implemented"` exceptions.
- Do not include hard-coded passwords, API keys, Bearer tokens, or personal information.

## Testing

- Use JUnit 5 and Spring Boot Test.
- Target at least 80% coverage.
- Controller tests must verify HTTP status codes, validation, and error responses.
- Service tests must verify zero-hit recording, keyword normalization, opportunity-loss calculations, authentication, and AI fallback behavior.
- Use `@DataJpaTest` for Repository tests as appropriate, and use Testcontainers when the tests depend heavily on PostgreSQL behavior.
- Give tests names that clearly describe the behavior under test.
- Verify not only successful cases, but also empty searches, searches with 0 results, authentication failures, insufficient permissions, missing AI keys, and DB constraint violations.
- Measure both line coverage and branch coverage with JaCoCo or an equivalent tool, and target at least 80% for both.

## Pre-Completion Checklist

- `./mvnw test` or `./gradlew test` must succeed.
- When static analysis, formatting, or coverage tasks exist, they must succeed.
- API contracts must match the DTOs on the Next.js side.
- Admin endpoints must be protected by Spring Security.
- Seed data and migrations must be reproducible at startup.
- The Docker build or docker compose startup must be reproducible as specified in the design documents.
