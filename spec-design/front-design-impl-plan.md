# Codex Ski Shop Frontend Implementation Plan

## 1. Purpose

This implementation plan defines how to implement the Next.js frontend described in [front-design.md](/Users/yoterada/Documents/Ski-Shop-Zero-Hit-Radar/spec-design/front-design.md) incrementally and without omissions.

The implementation is divided into a maximum of 9 phases. Complete the completion checklist at the end of each phase and verify alignment with the design before proceeding to the next phase.

## 2. Implementation Principles

- Finalize the type definitions and API client first to reduce integration errors during page implementation
- Implement loading, empty, success, and failure states for every page
- Use `NEXT_PUBLIC_API_BASE_URL` for backend connections
- For browser API calls, use a browser-resolvable URL such as `http://localhost:8080`; do not use `http://backend:8080` directly
- Replace every `Azure SkiShop` label in the reference images with `Codex Ski Shop`
- Do not implement the cart, checkout, user registration, or product CRUD features because they are outside the MVP scope

## Phase 1. Project Foundation

### Phase 1 Implementation Scope

- Create the Next.js project or verify the existing structure
- Configure TypeScript
- Configure the App Router
- Create the base directories
- Create the environment variable template
- Verify the lint / format / build commands
- Install UI dependencies specified in the design, such as lucide-react

### Primary Structure to Create or Verify

```text
frontend
├── src
│   ├── app
│   ├── components
│   ├── lib
│   │   └── api
│   └── types
├── package.json
├── Dockerfile
└── .env.example
```

### Phase 1 Completion Checklist

- [ ] The Next.js application starts from the `frontend` directory
- [ ] TypeScript is enabled
- [ ] The project uses an App Router structure based on `src/app`
- [ ] `src/components`, `src/lib/api`, and `src/types` exist
- [ ] `.env.example` contains `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
- [ ] When needed, `.env.example` contains `INTERNAL_API_BASE_URL=http://backend:8080` as an optional entry
- [ ] lucide-react is installed and icon buttons can be implemented
- [ ] `npm run build`, or the build command for the selected package manager, runs successfully
- [ ] `npm run lint`, or the selected lint command, runs successfully
- [ ] The policy to use `Codex Ski Shop` instead of `Azure SkiShop` in the visible UI is confirmed

## Phase 2. Shared Types and API Client

### Phase 2 Implementation Scope

- Implement the DTOs from `front-design.md` in `src/types/api.ts`
- Implement a shared fetch wrapper
- Normalize API errors
- Read the API base URL from environment variables
- Create each API module

### DTOs to Implement

- `ProductDto`
- `ProductListResponse`
- `ProductSearchResponse`
- `LoginRequest`
- `LoginResponse`
- `AuthMeResponse`
- `ZeroHitItemDto`
- `ZeroHitSummaryDto`
- `ZeroHitListResponse`
- `AiConsultRequest`
- `AiConsultResponse`
- `ApiError`

### API Functions to Implement

- `listProducts`
- `searchProducts`
- `login`
- `getMe`
- `listZeroHits`
- `consultAi`

### Phase 2 Completion Checklist

- [ ] `ProductDto` includes `manufacturer`, `name`, `category`, `price`, `stockStatus`, and `imageUrl`
- [ ] `ProductSearchResponse` includes `zeroHitRecorded`
- [ ] `ZeroHitItemDto` includes `priority`, `estimatedOpportunityLoss`, `firstSearchedAt`, and `lastSearchedAt`
- [ ] `AiConsultRequest` supports `keyword`, `question`, `hitCount`, and `lastSearchedAt`
- [ ] `AiConsultResponse` supports `providerStatus: "LIVE" | "FALLBACK" | "ERROR"`
- [ ] The API client uses `NEXT_PUBLIC_API_BASE_URL`
- [ ] The browser-side API base URL does not use `http://backend:8080`
- [ ] The admin API can include `Authorization: Bearer ${token}`
- [ ] Spring `ProblemDetail` fields `detail`, `title`, and `message` can be converted into a user-facing message
- [ ] A 400 response can be handled as a validation message near the form
- [ ] A 401 response can be used to clear the token and redirect to `/login`
- [ ] A 403 response can be converted into an access denied message
- [ ] A 404 response can be converted into a not found or empty state according to the route
- [ ] A 500 response can be converted into a retryable service error message
- [ ] API client URL construction can be verified independently
- [ ] `listProducts`, `searchProducts`, `login`, `getMe`, `listZeroHits`, and `consultAi` use the same paths as the Endpoint Contract

## Phase 3. Shared UI, Layout, and Formatting Utilities

### Phase 3 Implementation Scope

- `AppLayout`
- `Header`
- `SearchBar`
- loading / error / empty state components
- currency formatter
- date formatter
- stock status label mapper
- priority label mapper
- responsive base styling
- lucide-react icons
- Shared conventions for accessible form labels / aria-labels / disabled states

### UI Principles

- The header displays the `Codex Ski Shop` brand
- The primary navigation includes `Home`, `Products`, and `Login`
- After an administrator logs in, display a navigation path to the Admin dashboard
- Map `stockStatus` values `IN_STOCK`, `LOW_STOCK`, and `OUT_OF_STOCK` to `In stock`, `Low stock`, and `Out of stock`
- Display `priority` values `HIGH`, `MEDIUM`, and `LOW` with clear labels or badges

### Phase 3 Completion Checklist

- [ ] `Header` displays `Codex Ski Shop`
- [ ] `Header` provides navigation to `/`, `/products`, and `/login`
- [ ] In the authenticated state, `Header` provides navigation to the admin dashboard
- [ ] `SearchBar` supports input, submission, and a disabled loading state
- [ ] `SearchBar` has a label or aria-label
- [ ] Prices use Japanese yen formatting such as `¥98,000`
- [ ] Date and time values are formatted legibly for the admin page
- [ ] Localized `stockStatus` labels are implemented
- [ ] `priority` labels are implemented
- [ ] Shared loading, empty, and error displays are available
- [ ] Button loading / disabled states are clear both visually and to assistive technologies
- [ ] Primary links, inputs, and buttons are reachable by keyboard
- [ ] Header and button text does not overflow at mobile widths

## Phase 4. Product Components and Public Product Experience

### Phase 4 Implementation Scope

- `ProductCard`
- `ProductGrid`
- `/products` page
- Product list API integration
- Product search API integration
- Page title display
- total count display
- Category filter
- Sorting
- Search result count display
- no-results state for searches returning 0 results

### Phase 4 APIs to Use

- `GET /api/products?limit=&category=&sort=`
- `GET /api/products/search?q=&category=&sort=`

### Phase 4 Completion Checklist

- [ ] `/products` is accessible
- [ ] The page title and total count are displayed
- [ ] The initial view retrieves and displays the product list
- [ ] Each product card displays `manufacturer`, `name`, `price`, and `stockStatus`
- [ ] Each product card displays `category` or a category badge
- [ ] Each product card displays a product image or category placeholder
- [ ] The product card layout follows the visual direction of `images/products-list.png`
- [ ] The category filter provides options equivalent to all, skis, boots, wear, accessories, poles, and goggles
- [ ] The category filter changes the API query `category`
- [ ] Sorting provides options equivalent to newest, price low to high, and price high to low
- [ ] Sorting changes the API query `sort`
- [ ] The search result count is displayed
- [ ] Searching for an existing product keyword displays matching results
- [ ] Searching for a nonexistent keyword displays a 0-result state
- [ ] For a 0-result search, the frontend calls only the search API and does not separately call a Zero Hit registration API
- [ ] Duplicate submissions are prevented while searching
- [ ] An API error does not break the entire page

## Phase 5. Top Page Experience

### Phase 5 Implementation Scope

- `/` top page
- Hero area
- Display a 20-item product preview
- Top-page search
- Conditional rendering for each search state
- Navigation to `/products`
- Visual adjustments based on the reference image

### Phase 5 APIs to Use

- `GET /api/products?limit=20&sort=createdAt,desc`
- `GET /api/products/search?q=&category=&sort=`

### Phase 5 Completion Checklist

- [ ] `/` is accessible
- [ ] `Codex Ski Shop` is clearly visible in the first viewport
- [ ] The page reflects the blue palette, header, and hero direction in `images/Top-page-after-login.png`
- [ ] The initial view displays a preview of up to 20 products
- [ ] Products can be searched from the top page
- [ ] Duplicate submissions are prevented while searching from the top page
- [ ] Product cards are displayed when search results exist
- [ ] A natural 0-result state is displayed when no search results exist
- [ ] For an API error, the top page remains functional and displays a retryable state
- [ ] A `View products` action, or an equivalent navigation path, opens `/products`
- [ ] No `Azure SkiShop` label remains
- [ ] The hero, search field, and product cards do not overlap on desktop or mobile

## Phase 6. Authentication and Login

### Phase 6 Implementation Scope

- `/login` page
- `LoginForm`
- `authToken` utility
- `POST /api/auth/login` integration
- `GET /api/auth/me` integration
- admin route guard
- Reflect authentication state in `Header`
- Clear the token and redirect after a 401 response

### Authentication Policy

For the MVP, the token may be stored in `sessionStorage`. For a more secure architecture, use a Next.js route handler and an HttpOnly cookie.

### Phase 6 Completion Checklist

- [ ] `/login` is accessible
- [ ] The login page follows the visual direction of `images/login-screen.png`
- [ ] The page is clearly identified as the `Codex Ski Shop` administrator login
- [ ] The user can enter a username and password
- [ ] The token can be stored after a successful login API response
- [ ] The token is handled consistently through `sessionStorage` or an HttpOnly cookie, according to the MVP policy
- [ ] A successful login API response navigates to `/admin/dashboard`
- [ ] A failed login API response displays an error message
- [ ] `success=false` or `401 Unauthorized` is treated as a failure
- [ ] Before displaying `/admin/dashboard`, authentication is verified with `GET /api/auth/me`
- [ ] An unauthenticated request to `/admin/dashboard` redirects to `/login`
- [ ] A 401 response removes the token
- [ ] In the authenticated state, Header displays a navigation path to the admin dashboard
- [ ] After logout or token clearing, the admin dashboard navigation path disappears or the user is treated as unauthenticated

## Phase 7. Admin Dashboard and Zero Hit Radar

### Phase 7 Implementation Scope

- `/admin/dashboard`
- `AdminLayout`
- `ZeroHitSummaryCards`
- `ZeroHitTable`
- 7 / 30 / 90-day period filter
- Default sort / limit query values
- refresh action
- empty state
- Zero Hit keyword selection

### Phase 7 APIs to Use

- `GET /api/auth/me`
- `GET /api/admin/zero-hits?days=&sort=&limit=`

### Display Fields

- zero hit keyword count
- search volume
- estimated opportunity loss
- keyword
- hit count
- priority
- first searched at
- last searched at
- estimated opportunity loss

### Phase 7 Completion Checklist

- [ ] `/admin/dashboard` is visible only to authenticated administrators
- [ ] The admin page follows the visual direction of `images/admin-dash-board-zero-hit.png`
- [ ] Zero Hit summary cards are displayed
- [ ] The Zero Hit table/list is displayed
- [ ] `keyword` is displayed
- [ ] `hitCount` is displayed
- [ ] `priority` is displayed
- [ ] `estimatedOpportunityLoss` is displayed in Japanese yen
- [ ] `firstSearchedAt` and `lastSearchedAt` are displayed as legible date and time values
- [ ] The 7 / 30 / 90-day period filter updates the API query `days`
- [ ] The initial `sort` and `limit` values produce a valid API query
- [ ] The refresh action retrieves the latest data
- [ ] A natural empty state is displayed when there are no Zero Hits
- [ ] An API error does not break the entire admin page
- [ ] Selecting a keyword passes it to the AI consultation panel

## Phase 8. AI Consultation Panel

### Phase 8 Implementation Scope

- `AiConsultPanel`
- selected keyword display
- free-form question input
- `POST /api/admin/ai-consult` integration
- AI sending / success / failure states
- provider status display

### API to Use

- `POST /api/admin/ai-consult`

### Data to Send

- `keyword`
- `question`
- `hitCount`
- `lastSearchedAt`

### Phase 8 Completion Checklist

- [ ] Selecting a Zero Hit keyword displays it as the AI consultation subject
- [ ] The user can enter any question
- [ ] The question is not submitted when it is empty
- [ ] The send button is disabled during submission
- [ ] The request body includes `keyword`, `question`, `hitCount`, and `lastSearchedAt`
- [ ] On success, `answer` is displayed legibly
- [ ] The UI remains functional for every `providerStatus` value: `LIVE`, `FALLBACK`, and `ERROR`
- [ ] On failure, the question remains available and can be resubmitted
- [ ] A 401 response removes the token and navigates to `/login`
- [ ] When AI is not configured, the fallback or error state appears natural

## Phase 9. Docker, Verification, and Polish

### Phase 9 Implementation Scope

- frontend Dockerfile
- Docker multi-stage build
- Verify the docker compose connection
- Verify environment variables
- Responsive adjustments
- Accessibility verification
- Playwright E2E verification
- unit tests or, at minimum, utility tests
- Final design polish

### Docker / Compose Key Points

- frontend is accessible on host port `3000`
- backend is accessible on host port `8080`
- The browser-side frontend uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
- Use `INTERNAL_API_BASE_URL=http://backend:8080` only when a container-to-container call is required
- CORS on the backend must allow `http://localhost:3000`

### Phase 9 Completion Checklist

- [ ] `docker compose up --build` starts frontend / backend / db
- [ ] The frontend Dockerfile uses a multi-stage build equivalent to `deps`, `builder`, and `runner`
- [ ] The top page is displayed at `http://localhost:3000`
- [ ] The frontend connects to the backend API without CORS errors
- [ ] Browser-side code does not use `http://backend:8080`
- [ ] The top page displays `Codex Ski Shop`
- [ ] 20 products are displayed
- [ ] Searching for an existing product displays product cards
- [ ] Searching for a nonexistent product displays a 0-result state and is reflected in Zero Hit Radar
- [ ] After administrator login, the application navigates to `/admin/dashboard`
- [ ] Zero Hit Radar displays keyword, hit count, priority, and estimated opportunity loss
- [ ] The page remains functional whether AI consultation succeeds, falls back, or returns an error
- [ ] The top page, product list, login page, and admin page remain functional at desktop widths
- [ ] The top page, product list, login page, and admin page remain functional at mobile widths
- [ ] Text does not overflow buttons, inputs, tables, or cards
- [ ] No `Azure SkiShop` label remains
- [ ] Loading, empty, and error states can be verified on the primary pages
- [ ] Playwright can verify the primary scenarios for the top page, product search, login, admin page, and AI consultation
- [ ] A unit test or manual verification exists for at least one of currency formatting, date formatting, the auth token utility, or API client URL construction
- [ ] Each input has a label or aria-label
- [ ] Primary actions can be completed by keyboard
- [ ] Error and status displays do not rely on color alone

## 3. Final Acceptance Checklist

After all phases are complete, verify the following.

- [ ] The 4 pages listed under Page Ownership in `front-design.md` are implemented
- [ ] The DTOs in `front-design.md` match the implemented TypeScript types
- [ ] Every API function listed in the Endpoint Contract in `front-design.md` is implemented
- [ ] The primary components listed under Component Responsibilities in `front-design.md` are implemented
- [ ] Handling for 400 / 401 / 403 / 404 / 500, as specified in the Error Contract in `front-design.md`, is implemented
- [ ] The frontend does not call PostgreSQL or the AI provider directly
- [ ] Zero Hit registration is delegated to the backend search API, not performed by the frontend
- [ ] A Bearer token is included with administrator API requests
- [ ] The admin dashboard cannot be displayed in an unauthenticated state
- [ ] The intent of all 4 reference images is reflected in the respective pages
- [ ] The visual presentation consistently uses `Codex Ski Shop`
- [ ] Operation can be verified with Docker compose
- [ ] Primary navigation paths are verified with Playwright or equivalent manual E2E scenarios
- [ ] Minimum accessibility and responsive behavior verification is complete
- [ ] The UX does not appear incomplete when published as OSS
