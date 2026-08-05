# Zero Hit Radar Requirements Specification

## 1. Purpose

This system is a web application for a ski shop website named `Codex Ski Shop`. It records keywords for which product searches return zero results and enables administrators to discover new demand through the "Zero Hit Radar."

As an MVP that can be implemented within four hours, the system will not implement every ski shop feature. It will focus on product browsing and search features for general users, and Zero Hit Radar review and AI consultation features for administrators.

## 2. Background

On an e-commerce site, keywords that users search for but cannot find can indicate latent demand and opportunities to improve inventory. This system stores keywords that returned zero search results and allows administrators to review search counts and occurrence dates, supporting product planning, purchasing decisions, and understanding customer needs.

## 3. Service Concept

`Codex Ski Shop` is provided to general users as "a shop where they can quickly find the ski equipment they want" and to administrators as "an analytics service that discovers previously overlooked demand."

Zero Hit Radar is not merely a list of zero-result search logs. It provides the following value:

- Visualize products, brands, and categories that customers searched for but could not find
- Assess demand strength and recency based on search count and last search date and time
- Obtain perspectives on purchasing candidates, alternative products, and business decisions through AI consultation
- Enable administrators to determine the next action quickly

### 3.1 Success Metrics

The following are the MVP success metrics:

- General users can use product search naturally
- Zero Hit keywords are recorded without omissions
- Administrators can determine the priority of Zero Hit keywords at a glance
- AI consultation provides specific insights that can be used to evaluate purchasing
- The basic demo works without additional configuration after Docker compose starts

## 4. Scope

### 4.1 In Scope

- Home page for general users
- Initial display of the product list
- Product search
- Recording keywords for which search results were zero
- Login page
- Navigation to the administration screen after administrator login
- Zero Hit Radar display for administrators
- AI consultation feature for administrators
- Persistence of product data and Zero Hit data in PostgreSQL
- Initial registration of 100 sample products based on real ski manufacturers and real product names
- Next.js frontend
- Java 21 Spring Boot backend
- Docker multi-stage builds
- Unified startup through docker compose

### 4.2 Out of Scope

- User registration
- Product purchases
- Shopping cart
- Payment processing
- Full inventory management implementation
- Product management CRUD
- Administrator permission management
- Full authorization controls
- Email notifications
- External e-commerce integrations
- Production monitoring and logging infrastructure
- Persistence of AI responses

## 5. Target Users

### 5.1 General Users

Visitors looking for ski equipment. They review products on the home page and search for desired products through the search form.

### 5.2 Administrators

Ski Shop operations staff. After login, they navigate to the administration screen and review keywords that returned zero search results. As needed, they consult the AI and obtain information for decisions about purchasing new products and expanding product offerings.

## 6. User Journeys

### 6.1 General User

1. Access the `Codex Ski Shop` home page
2. Look for ski equipment in the product list or search field
3. When search results exist, review the manufacturer, product name, price, and stock status on product cards
4. When no search results exist, understand that there are zero results and search with another keyword

### 6.2 Administrator

1. Log in as an administrator from the login page
2. Review demand candidates on the Zero Hit Radar dashboard
3. Determine priority based on search count, last search date and time, estimated opportunity loss, and AI recommendation level
4. Consult the AI about keywords of interest
5. Review purchasing candidates, alternative products, and cautions, and use them in subsequent evaluation

## 7. System Architecture

### 7.1 Overall Architecture

- Frontend: Next.js
- Backend: Java 21 / Spring Boot
- Database: PostgreSQL
- Runtime: Docker / docker compose

### 7.2 Container Architecture

Start the following services with docker compose:

- `frontend`: Next.js application
- `backend`: Spring Boot API server
- `db`: PostgreSQL

### 7.3 Communication

- The browser accesses the Next.js frontend
- Next.js calls the Spring Boot backend API
- Spring Boot connects to PostgreSQL and persists product data and Zero Hit data

## 8. Screen Requirements

### 8.1 Home Page

#### Home Page Purpose

Clearly identify the site to general users as the `Codex Ski Shop` ski shop and enable product browsing and search.

#### Home Page Display Elements

- A header or title that identifies the site as `Codex Ski Shop`
- Navigation to Home, All Products, and Login
- A navigation path to the administration screen after administrator login
- Product search field
- Search button
- A hero area appropriate for a ski shop
- Product list
- 20 products in the initial display
- A display that communicates the search result count or search state

#### Home Page Design References

- Use `images/Top-page-after-login.png` as a reference for the home page and the home page after login
- Use `images/products-list.png` as a reference for the product list screen
- Replace the `Azure SkiShop` text in the reference images with `Codex Ski Shop`
- Based on the character of the reference images, provide a UI with the clean appearance expected of a ski shop, sufficient whitespace for finding products, and an easy-to-use search path
- Use blue as the primary color while ensuring product cards, the search box, category filters, and navigation are easy to see
- The general-user AI advisor path shown in the reference images is optional for the MVP; the required feature is AI consultation for administrators

#### Home Page Behavior

- Display up to 20 products on initial load
- Allow users to enter a keyword in the search field and search
- Category filtering is desirable
- Sorting the product list by newest or price is desirable
- When search results exist, display the matching products
- When search results are zero, clearly indicate on the screen that no search results exist
- When search results are zero, record the keyword in the backend as a Zero Hit keyword

### 8.2 Login Page

#### Login Page Purpose

Provide an entry point for administrators to access the administration screen.

#### Login Page Display Elements

- Login ID input
- Password input
- Login button
- Error message display area

#### Login Page Design References

- Use `images/login-screen.png` as a reference for the login page
- Place a title or brand display that identifies the page as the `Codex Ski Shop` administrator login screen
- Replace the `Azure SkiShop` text in the reference image with `Codex Ski Shop`

#### Login Page Behavior

- Allow login with an administrator account
- Navigate to the administration screen after successful login
- Display an error message after failed login

#### MVP Policy

To prioritize implementation within four hours, the administrator account may be managed through environment variables or fixed values on the backend. However, credentials should not be hard-coded in plaintext in the source code.

### 8.3 Administration Screen

#### Administration Screen Purpose

Enable administrators to review Zero Hit Radar and discover latent demand.

#### Administration Screen Display Elements

- Administration screen header
- Zero Hit Radar list
- Search keyword
- Search count
- First search date and time
- Last search date and time
- Date-range filter
- Refresh button
- Estimated opportunity loss
- AI recommendation level or priority
- Candidate brands and product ideas for purchasing
- AI consultation form
- AI response display area

#### Administration Screen Design References

- Use `images/admin-dash-board-zero-hit.png` as a reference for the administration screen and Zero Hit Radar
- Provide a dashboard UI that enables administrators to understand the Zero Hit count, search count, and last search date and time immediately
- Base the side navigation, analytics cards, empty state, and AI question panel structure on the character of the reference image

#### Administration Screen Behavior

- Allow access only to authenticated administrators
- Display Zero Hit keywords in descending search-count order or descending last-search-date order
- It is desirable to use a date-range filter to review Zero Hits from the last 7, 30, or 90 days
- When there are no Zero Hits, display a natural empty-state message such as "No zero-hit opportunities were detected"
- Allow administrators to consult the AI about Zero Hit keywords
- AI consultation provides detailed information about the relevant product, purchasing guidance, potential as new demand, and business-oriented advice

## 9. Functional Requirements

### 9.1 Product List Display

- The system stores product data in PostgreSQL
- Retrieve up to 20 products for the initial home page display
- Each product must contain at least the following information:
  - Product ID
  - Manufacturer name
  - Product name
  - Category
  - Description
  - Price
  - Stock status
  - Image URL or image placeholder

### 9.2 Product Search

- Users can search for products by keyword
- Products are eligible for matching when the keyword is contained in the product name, manufacturer name, category, or description
- Case differences should not affect search results
- Support searches in Japanese, alphanumeric characters, brand names, and model numbers
- Trim leading and trailing whitespace from search keywords
- For an empty-string search, do not record a Zero Hit; display the initial product list or another natural state that does not produce an error
- When one or more search results exist, display the matching products in a list
- When search results are zero, record a Zero Hit

### 9.3 Zero Hit Recording

- Record keywords for which search results were zero
- When the same keyword produces another Zero Hit, increment the search count instead of adding a new record
- Trim leading and trailing whitespace from keywords
- Do not record empty strings as Zero Hits
- Treat case differences and unnecessary consecutive whitespace as the same keyword where practical
- Record the following fields:
  - Zero Hit ID
  - Keyword
  - Normalized keyword
  - Search count
  - Priority
  - First search date and time
  - Last search date and time
- In preparation for future analytics, consider recording an event for each search date and time if this can be implemented reasonably within the MVP

### 9.4 Zero Hit Analytics

- Display Zero Hit keywords on the administration screen in a form that supports business decisions
- Support ranking keywords with high search counts first
- Support ranking keywords with recent last-search dates first
- Estimated opportunity loss may be calculated simply as `search count × assumed average unit price`
- The assumed average unit price may use a fixed value, average category price, or average price across all products
- Priority may be displayed as `HIGH`, `MEDIUM`, `LOW`, or similar based on search count, last search date and time, and estimated opportunity loss
- For the MVP, the AI recommendation level may be displayed as a qualitative assessment within the AI response
- The primary displayed metrics are Zero Hit count, search volume, and estimated opportunity loss

### 9.5 Administrator Login

- Administrators can log in from the login page
- Navigate to the administration screen after successful login
- When an unauthenticated user accesses the administration screen, direct the user to the login page
- A simple session-based or token-based implementation is acceptable for the MVP

### 9.6 Zero Hit Radar Display

- Administrators can review the Zero Hit list
- The list displays search count, first search date and time, and last search date and time
- Keywords with high search counts must be visually prominent to administrators
- It is desirable to display estimated opportunity loss or priority for each keyword so that it can be assessed as a demand candidate
- It is desirable to populate the AI consultation form with a selected keyword
- When no data exists, display a clear empty state

### 9.7 AI Consultation Feature

- Administrators can enter a Zero Hit keyword or arbitrary consultation text and submit an inquiry to the AI
- Request AI responses from the following perspectives:
  - Potential demand indicated by the product or keyword
  - Candidate products that the ski shop should carry
  - Information for deciding whether to hold the product in inventory
  - Purchasing cautions
  - Recommendations for related or alternative products
- Where practical, provide the Zero Hit keyword, search count, last search date and time, existing product categories, and existing product brands to the AI as context
- Structure AI responses so the conclusion, rationale, purchasing candidates, cautions, and next actions are clear
- Manage secrets such as the AI API key through environment variables
- If the AI API is not configured or communication fails, the entire screen must remain functional and display a clear error message

## 10. API Requirements

### 10.1 Product API

#### `GET /api/products`

Retrieve the product list for the initial display.

Query Parameters:

- `limit`: Number of items to retrieve. Defaults to 20 when omitted.
- `category`: Optional. Category filter.
- `sort`: Optional. Examples include `createdAt,desc`, `price,asc`, and `price,desc`.

Response:

- Product list
- Total count

#### `GET /api/products/search`

Search for products by keyword.

Query Parameters:

- `q`: Search keyword
- `category`: Optional. Category filter.
- `sort`: Optional. Sort order.

Response:

- List of products in the search results
- Search result count
- Whether Zero Hit recording occurred

Notes:

- When search results are zero, record the Zero Hit on the backend

### 10.2 Authentication API

#### `POST /api/auth/login`

Perform administrator login.

Request:

- `username`
- `password`

Response:

- Whether login succeeded
- Authentication token or session information

#### `GET /api/auth/me`

Check the current login state.

Response:

- Whether the user is logged in
- Administrator user information

### 10.3 Administrator API

#### `GET /api/admin/zero-hits`

Retrieve the Zero Hit list.

Query Parameters:

- `days`: Optional. Target period. Examples include `7`, `30`, and `90`.
- `sort`: Optional. Examples include `hitCount,desc` and `lastSearchedAt,desc`.
- `limit`: Optional. Number of items to retrieve.

Response:

- Zero Hit keyword list
- Aggregate values
  - Zero Hit count
  - Search volume
  - Estimated opportunity loss

Authentication:

- The user must be authenticated as an administrator

### 10.4 AI Consultation API

#### `POST /api/admin/ai-consult`

Submit an inquiry to the AI based on a Zero Hit keyword or consultation text.

Request:

- `keyword`
- `question`
- `hitCount`
- `lastSearchedAt`

Response:

- Response from the AI
- Error message when response generation fails

Authentication:

- The user must be authenticated as an administrator

## 11. Data Requirements

### 11.1 Products Table

Table: `products`

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID or BIGSERIAL | Yes | Product ID |
| `manufacturer` | VARCHAR | Yes | Manufacturer name |
| `name` | VARCHAR | Yes | Product name |
| `category` | VARCHAR | Yes | Category |
| `description` | TEXT | Yes | Product description |
| `price` | NUMERIC | Yes | Price |
| `stock_status` | VARCHAR | Yes | Stock status |
| `image_url` | TEXT | No | Product image URL |
| `created_at` | TIMESTAMP | Yes | Creation date and time |
| `updated_at` | TIMESTAMP | Yes | Update date and time |

### 11.2 Zero Hit Table

Table: `zero_hit_searches`

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID or BIGSERIAL | Yes | Zero Hit ID |
| `keyword` | VARCHAR | Yes | Display keyword |
| `normalized_keyword` | VARCHAR | Yes | Normalized keyword used for duplicate detection |
| `hit_count` | INTEGER | Yes | Search count |
| `priority` | VARCHAR | Yes | Priority as a demand candidate |
| `estimated_opportunity_loss` | NUMERIC | No | Estimated opportunity loss |
| `first_searched_at` | TIMESTAMP | Yes | First search date and time |
| `last_searched_at` | TIMESTAMP | Yes | Last search date and time |

### 11.3 Initial Data

- Provide 100 product records by default and register them in PostgreSQL at application startup or during database initialization
- Create sample product data based on ski manufacturers and product names that actually exist in the market
- Provide data that clearly identifies product name, manufacturer name, and category; do not compose the dataset solely of fictional brands or obviously dummy product names
- Example target manufacturers include Atomic, Salomon, Rossignol, HEAD, Fischer, Volkl, K2, Elan, Nordica, Tecnica, Lange, Dalbello, Marker, Look, Tyrolia, Smith, Oakley, POC, Giro, and Swix
- Example target categories include skis, ski boots, bindings, goggles, helmets, apparel, gloves, poles, wax, and tuning supplies, as well as other categories that communicate the character of a ski shop
- Display up to 20 of these 100 records in the initial view
- Set product prices to realistic sample prices in Japanese yen
- If product image URLs are unavailable, use category-specific placeholders or local images so the screen does not appear broken

## 12. Routing Requirements

### 12.1 Frontend Routes

- `/`: Home page
- `/products`: Product list page
- `/login`: Administrator login page
- `/admin/dashboard`: Administration screen and Zero Hit Radar

### 12.2 API Routes

- Provide backend APIs under `/api`
- Allow the API base URL used by the frontend to be changed through an environment variable

## 13. Environment Variable Requirements

### 13.1 Backend

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AI_API_KEY`
- `AI_MODEL`
- `CORS_ALLOWED_ORIGINS`

### 13.2 Frontend

- `NEXT_PUBLIC_API_BASE_URL`

### 13.3 Policy

- Provide `.env.example` so the required environment variables can be reviewed
- Do not track a `.env` file containing actual secrets in Git

## 14. Non-Functional Requirements

### 14.1 UX

- General users can immediately identify the site as `Codex Ski Shop` when viewing the home page
- Search, result display, and zero-result display are intuitive
- The importance of Zero Hits is clear on the administration screen
- Create the appearance of the home page, login page, product list, and administration screen based on the reference images under the `images` directory
- Do not leave placeholder text that makes the application appear incomplete or any broken layouts
- Rendering must remain intact on both desktop and mobile
- Loading, searching, AI response generation, error, and empty states are each displayed naturally
- Buttons, inputs, cards, and tables clearly communicate when they are clickable or editable

### 14.2 Readability

- Screen text, code, and directory structure must be easy to understand
- Separate frontend and backend responsibilities
- API inputs and outputs must be clear
- Providing a README or startup instructions is desirable

### 14.3 Executability

- `docker compose up --build` starts PostgreSQL, the backend, and the frontend
- Products appear on the home page after initial data is loaded
- Keywords with zero search results can be reviewed on the administration screen
- The AI consultation feature works when its environment variables are configured

### 14.4 Quality

- Target a level of quality suitable for publication as OSS
- Do not commit secrets
- Do not include unnecessary generated artifacts or files dependent on a local environment
- The screen must not break when errors occur
- Provide at least minimal tests or manual verification procedures for core features

### 14.5 Security

- Administration screen APIs reject unauthenticated access
- Manage the administrator password and AI API key through environment variables
- Restrict CORS to required origins
- Use an ORM or parameterized queries to prevent SQL injection

### 14.6 Performance

- Search and list display must not feel slow with the initial dataset of 100 products
- Pagination is not required for the MVP Zero Hit list on the administration screen, but it is desirable for the API to accept `limit` in preparation for future expansion
- Do not block the UI excessively during AI consultation; display a submitting state

## 15. Implementation Policy

### 15.1 Frontend

- Use Next.js
- Implement the home page, login page, and administration screen
- Connect API calls to the backend REST API
- Product cards display the image, product name, category, price, and description
- Display Zero Hit Radar as a table or list UI suitable for an administration screen
- Based on the reference-image UI, provide a consistent design for navigation, the search bar, product cards, the dashboard, and the AI question panel

### 15.2 Backend

- Use Java 21 / Spring Boot
- Provide REST APIs
- Connect to PostgreSQL using Spring Data JPA or similar technology
- Implement product search and Zero Hit recording on the backend
- Allow only authenticated requests to access administrator APIs

### 15.3 Database

- Use PostgreSQL
- Load initial product data
- Implement migrations using Flyway, Liquibase, or Spring Boot initialization SQL
- It is desirable to add a unique constraint to `normalized_keyword` to prevent duplicate registration of the same Zero Hit

### 15.4 AI Consultation

- Implement the AI consultation API in the backend
- Read the AI provider API key from an environment variable
- When the AI provider is not configured, return a clear error or a fallback response for the demo
- Clearly display in-progress, success, and failure states for AI consultation on the administration screen
- Instruct the AI through its prompt to answer from a purchasing-decision perspective for a ski shop administrator

## 16. Test Requirements

### 16.1 Backend

- Verify that the product list API returns products
- Verify that the product search API returns matching products
- Verify that a Zero Hit is registered when a search returns zero results
- Verify that `hit_count` increases when the same keyword produces another zero-result search
- Verify that administrator APIs reject unauthenticated access

### 16.2 Frontend

- Verify that products appear on the home page
- Verify that result-present, no-result, loading, and error states can be displayed
- Verify navigation to the administration screen after successful login
- Verify that the Zero Hit Radar list and empty state can be displayed
- Verify that submitting, success, and failure states for AI consultation can be displayed

### 16.3 Manual Verification

- Verify that the basic demo can run without additional manual work after Docker compose starts
- Verify that core screens remain intact at desktop and mobile widths

## 17. Acceptance Criteria

### 17.1 General User Features

- Accessing the home page makes it clear that the site is `Codex Ski Shop`
- 100 sample product records based on real ski manufacturers and real product names are registered
- 20 products are displayed
- Product cards display manufacturer name, product name, price, and stock status
- Users can enter a search keyword and search for products
- When matching products exist, search results are displayed
- When no matching products exist, the screen indicates that there are zero results

### 17.2 Zero Hit Radar

- Keywords with zero search results are saved in the DB
- Searching again with the same keyword increases the search count
- After administrator login, the Zero Hit Radar screen displays keyword, search count, first search date and time, last search date and time, and estimated opportunity loss
- The visual presentation enables administrators to determine the priority of demand candidates

### 17.3 Administrator Features

- Successful administrator login navigates to the administration screen
- The administration screen cannot be displayed directly while unauthenticated
- The AI consultation form is available on the administration screen
- It is desirable to select a Zero Hit keyword and use it for AI consultation
- When AI configuration is enabled, consultation results are displayed on the screen
- When AI configuration is disabled or the request fails, a clear error is displayed

### 17.4 Docker Execution

- `docker compose up --build` starts all services
- PostgreSQL, the backend, and the frontend are connected
- The home page, login page, and administration screen are accessible from a browser

## 18. Recommended Directory Structure

```text
.
├── backend
│   ├── Dockerfile
│   ├── build.gradle or pom.xml
│   └── src
├── frontend
│   ├── Dockerfile
│   ├── package.json
│   └── src or app
├── spec-design
│   └── zero-hit-radar-requirment.md
├── docker-compose.yml
└── README.md
```

## 19. Four-Hour MVP Priorities

### Priority 1

- Docker compose startup
- PostgreSQL connection
- 100 initial product records based on real ski manufacturers and real product names
- Display 20 products on the home page
- Product search
- Zero Hit recording
- Administrator login
- Zero Hit Radar display
- Basic metrics display on the administration screen
- `.env.example` and README startup instructions

### Priority 2

- AI consultation feature
- Improved administration-screen readability
- Improved UX for zero-result searches
- Category filtering and sorting
- Manual verification procedures

### Priority 3

- Additional tests
- Enhanced product images
- Detailed analysis of Zero Hit history events
- More rigorous authentication and authorization

## 20. Manual Verification Scenario

1. Run `docker compose up --build`
2. Access the home page
3. Verify that `Codex Ski Shop` is displayed and that 20 products appear
4. Search using an existing product name or category
5. Verify that search results appear
6. Search using a keyword that does not exist
7. Verify that the screen indicates zero results
8. Perform administrator login
9. Verify navigation to the administration screen
10. Verify that the zero-result search keyword appears in Zero Hit Radar
11. Search again using the same nonexistent keyword and verify that the search count increases
12. Verify that Zero Hit Radar aggregate values, estimated opportunity loss, and the empty state or list display appear naturally
13. Submit an inquiry through the AI consultation form and verify that the response or error display appears appropriately
14. Verify that the home page, product list, login page, and administration screen remain intact at desktop and mobile widths

## 21. Success Conditions

The system success conditions are as follows:

- General users can browse and search `Codex Ski Shop` products
- 100 product records based on real ski manufacturers and real product names are registered by default
- Screens based on the reference images under the `images` directory are implemented without broken layouts
- Keywords with zero search results are recorded automatically
- Administrators can discover new demand through Zero Hit Radar
- Administrators can consult the AI about business decisions
- Developers can start the system easily through Docker compose
- The screens do not appear incomplete and meet the baseline quality required for publication as OSS
