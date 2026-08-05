# Next.js AGENTS.md

This file provides instructions for AI agents that implement or modify the Next.js frontend.

## Core Principles

- Implement screens, routing, data fetching, and UX states using the Next.js App Router.
- Prioritize a UI that helps `Codex Ski Shop` users find products and helps administrators understand Zero Hit Radar.
- Do not leave disconnected components that provide only a visual facade.
- Always design loading, empty, error, expired-authentication, submitting, and success states.
- Implement primary screens according to `spec-design/front-design.md` and the reference images in `images/`.
- Use stable Next.js, React, and TypeScript versions available when the project is created, and do not adopt legacy routing APIs in new code.

## UX and Screen Quality

- Make the first screen a genuinely usable experience. Do not make it an informational landing page only.
- Connect the primary navigation flows among the home page, product listing, login, and administration dashboard naturally.
- When a search returns 0 results, provide a UI that makes the user's next action clear.
- In the administration interface, make the Zero Hit count, search count, estimated opportunity loss, and last search time easy to compare quickly.
- Provide disabled, focus, and submitting states for buttons, inputs, and selection controls.
- Apply responsive constraints so text does not overflow buttons or cards.
- Check for broken layouts on both mobile and desktop.
- Do not leave placeholders, dummy cards, or nonfunctional links that make the product appear unfinished.
- Verify keyboard operation, focus rings, labels, `aria` attributes, and color contrast, and meet basic accessibility requirements.
- Format prices, dates and times, and counts naturally for the English UI.

## Next.js Implementation Rules

- Define clear responsibilities for Server Components and Client Components.
- Use `use client` only where browser events, state management, form interactions, `localStorage`, or similar client-side capabilities are required.
- Centralize API communication in a typed API client; do not scatter `fetch` logic across screen components.
- Give environment variables clear names such as `NEXT_PUBLIC_API_BASE_URL`, and define fallback behavior when they are unset.
- Prefer HttpOnly cookies for authentication tokens. If `localStorage` or `sessionStorage` is used, clearly document the MVP rationale and do not increase XSS risk.
- Enforce route protection at the entry point to admin routes, and redirect unauthenticated users to `/login`.
- Do not suppress API errors; display them as natural error states in the UI.
- Use images appropriate to their actual purpose and provide alt text.
- Prefer standard Next.js features such as `next/link` and `next/image`.
- Configure appropriate metadata for primary pages to support SEO and high-quality sharing previews.
- Avoid unnecessary growth in the client bundle, and justify adding heavy dependencies or UI libraries.

## Component Design

- Give each component a single responsibility and define explicit types for its props.
- Split components such as `Header`, `SearchBar`, `ProductGrid`, `ProductCard`, `LoginForm`, `ZeroHitSummaryCards`, `ZeroHitTable`, and `AiConsultPanel` according to the responsibilities defined in the design documents.
- Separate reusable UI from page-specific orchestration.
- Avoid nesting another large card inside a card, and prioritize visual clarity.
- When an existing icon library such as `lucide-react` is available, use appropriate icons in buttons and interactive UI.

## Comments and Documentation

- Add comments that explain the purpose of publicly reusable components, hooks, and API client functions.
- Add brief explanatory comments for complex authentication decisions, API fallback behavior, and Zero Hit display logic.
- Do not display excessive implementation details or shortcut instructions in the UI.
- Keep user-facing copy consistent, using natural English or the exact wording specified in the design documents.

## Prohibitions

- Do not leave TODOs, FIXMEs, placeholder copy, Lorem ipsum, or dummy data in the production UI.
- Do not implement primary buttons with only `alert()` or only `console.log()`.
- Do not type API responses as `any`.
- Do not add unnecessary Client Components.
- Do not hard-code authentication tokens or secrets.
- Do not leave hydration errors or console errors unresolved.
- Do not consider a screen complete when it is visually polished but not connected to real data.
- Do not overuse `<a>` for internal navigation; use `Link` for internal Next.js navigation.
- Do not leave form submission, Enter-key handling, or duplicate-submission prevention unimplemented.

## Testing

- Validate primary user journeys with Playwright.
- When possible, test components, hooks, and utilities with Vitest or Testing Library.
- Target at least 80% test coverage.
- At minimum, test home-page rendering, product search, a search with 0 results, successful login, failed login, administration-screen rendering, and the failure UX for AI consultation.
- For responsive verification, capture screenshots or run E2E checks at desktop and mobile viewport sizes.
- Add tests for keyboard operation and form validation.

## Pre-Completion Checklist

- Ensure all available quality checks, such as `npm run build`, `npm test`, and `npm run lint`, pass.
- If `npm run typecheck` exists, ensure it passes.
- Inspect primary screens in a browser and verify that there are no broken layouts or disconnected interactions.
- Ensure the screen remains functional when the backend API is not running or fails.
- Ensure the application is reproducible with Docker or a local startup procedure.
- Verify primary screens at both desktop and mobile sizes with Playwright or an equivalent tool.
