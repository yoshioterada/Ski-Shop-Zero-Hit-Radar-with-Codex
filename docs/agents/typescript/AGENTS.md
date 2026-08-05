# TypeScript AGENTS.md

This file provides instructions for AI coding agents that implement or modify TypeScript code.

## Core Principles

- Write TypeScript with strict mode as a prerequisite.
- Treat types as contracts that prevent bugs, not merely as descriptions of the implementation.
- Define explicit types for API DTOs, domain models, component props, form state, and error state.
- Do not fall back to `any`; use unknown, union, generic, and type guard appropriately.
- Prioritize naming and file organization that make the code easy for readers to reason about.
- Use the stable TypeScript version available when the project is created, and apply the latest type-system features where they do not reduce readability.

## Type Design

- Define API responses and requests as dedicated `type` or `interface` declarations.
- Do not trust values from external APIs or backend APIs; perform runtime validation when necessary.
- Prefer discriminated union over a proliferation of boolean values for state transitions.
- Do not confuse an optional property with a nullable value.
- Use `Record<string, unknown>`, `unknown`, and type guards to handle unvalidated data safely.
- Do not omit element types for arrays or maps.
- Explicitly declare the parameter and return types of public functions so readers can understand them.
- Use literal unions, `as const`, and `satisfies` to improve type safety for state values and configuration values.
- When backend DTOs and frontend DTOs must differ, define explicit conversion functions and avoid implicit dependencies on object shape.
- When adding a library for runtime validation, explain the reason for introducing it, its bundle impact, and the alternatives considered.

## Coding Conventions

- Use camelCase for variables and functions, and PascalCase for types, interfaces, and React components.
- Give boolean values descriptive names such as `isLoading`, `hasError`, `canSubmit`, and `shouldRedirect`.
- Limit each function to one responsibility, and extract excessively long operations into pure functions.
- Separate formatting operations for values such as dates, prices, and counts into utilities.
- Separate error messages intended for the UI from those intended for logs, and do not expose internal implementation details to users.
- Use `const` by default, and use `let` only when reassignment is necessary.
- Keep imports organized and do not create circular dependencies.
- Prefer standard APIs such as `Intl.NumberFormat` and `Intl.DateTimeFormat` for formatting prices and date-time values.
- Make the return `Promise` type and error handling explicit for async operations.

## tsconfig and Lint

- Maintain `strict: true`.
- Enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride` where possible.
- Prefer an ESLint configuration that supports type-aware rules.
- Do not separate type errors from the build; ensure they can be detected in CI or during routine quality checks.

## Comments and Documentation

- Add JSDoc where necessary to exported functions, hooks, types, and important utilities.
- Use JSDoc to describe the behavior a function guarantees, rather than merely listing its parameters.
- Add brief comments for complex type guards, discriminated unions, and API error normalization.
- Do not add excessive explanatory comments to self-evident variables or JSX.

## Prohibitions

- Do not casually use `any`, `as any`, or double assertions.
- Do not casually use the non-null assertion `!`.
- Do not leave `// @ts-ignore` or `// @ts-expect-error` unexplained. When one is necessary, document the reason.
- Do not leave TODO, FIXME, HACK, placeholder, or dummy code in production code.
- Do not leave `console.log` statements used for debugging.
- Do not leave floating promises. If a promise is intentionally not awaited, make the reason explicit.
- Do not pass an unvalidated response shape from an API client to the UI.
- Do not scatter string-literal state values; centralize them in a union type or enum-like const.
- Do not hide inconsistencies in actual data with excessive assertions used only to satisfy the type system.

## Testing

- Write unit tests for utilities, API clients, formatting functions, type guards, and state reducers.
- For logic related to UI state, validate error, empty, and loading states in addition to the successful path.
- Target coverage of at least 80%.
- Where practical, add runtime tests for important contracts that are otherwise enforced only by types.
- Account for branch coverage by testing every union state and API error branch.

## Pre-Completion Checklist

- Ensure `tsc --noEmit` or an equivalent typecheck succeeds.
- Ensure lint and tests succeed.
- Verify that no `any` or unsafe assertions remain.
- Ensure publicly used types and functions have understandable names and comments.
- Do not avoid problems by weakening tsconfig.
