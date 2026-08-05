# AGENTS.md

AI agents working in this repository must prioritize implementing `Codex Ski Shop Zero Hit Radar` to a quality standard suitable for release as open-source software (OSS).

## General Quality Standards

- Verify that the UX remains intact by manually checking the primary screens or running E2E tests.
- Do not consider the work complete until the application starts successfully and its primary user journeys function correctly.
- Do not leave TODOs, FIXMEs, provisional or dummy implementations, disconnected UI elements, or nonfunctional primary buttons.
- Maintain a readable, understandable structure with clear naming and comments.
- Ensure the repository is suitable for OSS publication by excluding secrets, personal information, and copied code with an unknown license.
- Target at least 80% for both line coverage and branch coverage. If either target is not met, document the reason and identify the additional tests required.
- Treat `spec-design/zero-hit-radar-requirment.md`, `spec-design/backend-design.md`, and `spec-design/front-design.md` as the authoritative specifications.
- Refer to `docs/orchest-code-review*.agent.md` for code review criteria.
- When changing an API, database schema, authentication specification, or screen transition, update the related design documents, type definitions, and tests at the same time.
- Before adding a dependency, determine whether the requirement can be met with standard functionality or an existing dependency.
- Any process that uses generative AI or an external API must provide a fallback so the overall demo remains operational when a key is missing, a request times out, or the service fails.

## Technology-Specific AGENTS Files

Always read the applicable technology-specific instructions for the implementation being changed.

- Java / Spring Boot: `docs/agents/java/AGENTS.md`
- Next.js: `docs/agents/nextjs/AGENTS.md`
- TypeScript: `docs/agents/typescript/AGENTS.md`

For changes spanning multiple technologies, apply every relevant `AGENTS.md` file.

When creating implementation directories such as `backend/` or `frontend/` in the future, either copy the applicable technology-specific `AGENTS.md` into that directory or maintain an explicit reference to it from the root `AGENTS.md`.

## Security and Publication Quality

- Do not commit `.env` files, API keys, tokens, passwords, personal information, or internal information.
- Store sample configuration in files such as `.env.example`, and never include real secrets.
- Validate externally supplied values in both the frontend and backend.
- Do not expose implementation details, SQL, tokens, or stack traces in user-facing error messages.
- Keep the README, startup instructions, test procedures, and license information consistent and suitable for OSS publication.

## Completion Criteria

- The build, static analysis, and tests complete successfully.
- The primary frontend screens render correctly without layout regressions.
- The backend APIs respond as defined in the design documents.
- The application can be reproduced using Docker or the documented local startup procedure.
- Exceptions, empty states, loading states, authentication failures, and API failures provide a natural user experience.
- Add clear, understandable comments to public APIs, public methods, and important domain logic.
- If any verification step cannot be performed, document the reason and the remaining risk.
