import { expect, test } from "@playwright/test";

const products = [
  {
    id: "product-1",
    manufacturer: "Atomic",
    name: "Bent 100",
    category: "skis",
    description: "All mountain ski",
    price: 98000,
    stockStatus: "IN_STOCK",
    imageUrl: null,
    createdAt: "2026-06-04T00:00:00Z",
    updatedAt: "2026-06-04T00:00:00Z",
  },
  {
    id: "product-2",
    manufacturer: "Salomon",
    name: "S/Pro Alpha",
    category: "boots",
    description: "Ski boot",
    price: 72000,
    stockStatus: "LOW_STOCK",
    imageUrl: null,
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z",
  },
];

const zeroHitItem = {
  id: "zero-hit-1",
  keyword: "wide ski boots",
  normalizedKeyword: "wide ski boots",
  hitCount: 12,
  priority: "HIGH",
  estimatedOpportunityLoss: 240000,
  firstSearchedAt: "2026-06-01T09:00:00+09:00",
  lastSearchedAt: "2026-06-04T10:00:00+09:00",
};

test.beforeEach(async ({ page }) => {
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/products/search") {
      const query = url.searchParams.get("q") ?? "";
      if (query.includes("missing")) {
        await route.fulfill({
          json: { items: [], totalCount: 0, zeroHitRecorded: true },
        });
        return;
      }

      await route.fulfill({
        json: {
          items: products,
          totalCount: products.length,
          zeroHitRecorded: false,
        },
      });
      return;
    }

    if (url.pathname === "/api/products") {
      await route.fulfill({ json: { items: products, totalCount: products.length } });
      return;
    }

    if (url.pathname === "/api/auth/login") {
      const body = await request.postDataJSON();
      if (body.username === "admin" && body.password === "password") {
        await route.fulfill({
          json: {
            success: true,
            token: "token-123",
            user: { username: "admin", role: "ADMIN" },
          },
        });
        return;
      }

      await route.fulfill({
        status: 401,
        json: { detail: "ログイン情報が正しくありません。" },
      });
      return;
    }

    if (url.pathname === "/api/auth/me") {
      const authorization = request.headers().authorization;
      await route.fulfill({
        status: authorization === "Bearer token-123" ? 200 : 401,
        json:
          authorization === "Bearer token-123"
            ? { authenticated: true, user: { username: "admin", role: "ADMIN" } }
            : { detail: "Unauthorized" },
      });
      return;
    }

    if (url.pathname === "/api/admin/zero-hits") {
      await route.fulfill({
        json: {
          items: [zeroHitItem],
          summary: {
            zeroHitKeywordCount: 1,
            searchVolume: 12,
            estimatedOpportunityLoss: 240000,
          },
        },
      });
      return;
    }

    if (url.pathname === "/api/admin/ai-consult") {
      await route.fulfill({
        json: {
          answer: "仕入れ候補として検討できます。\n優先度は高めです。",
          providerStatus: "FALLBACK",
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { detail: "Not found" } });
  });
});

test("top page search and zero-hit state work", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Codex Ski Shop" })).toBeVisible();
  await expect(page.getByText("Bent 100")).toBeVisible();

  await page.getByLabel("トップページ検索").fill("missing ski");
  await page.getByRole("button", { name: "検索" }).click();

  await expect(page.getByText("検索条件に一致する商品がありません")).toBeVisible();
  await expect(page.getByText("検索結果 0 件")).toBeVisible();
});

test("products page filters, search, and cards render", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "商品一覧" })).toBeVisible();
  await expect(page.getByText("Bent 100")).toBeVisible();

  await page.getByRole("button", { name: "Skis" }).click();
  await page.getByLabel("Sort").selectOption("price,asc");
  await page.getByLabel("商品検索").fill("powder ski");
  await page.getByRole("button", { name: "検索" }).click();

  await expect(page.getByText("検索結果 2 件")).toBeVisible();
});

test("login, dashboard, and AI consultation flow work", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: "Zero Hit Radar" })).toBeVisible();
  await expect(page.getByText("wide ski boots")).toBeVisible();

  await page.getByRole("button", { name: "AI 相談" }).click();
  await page.getByLabel("質問").fill("仕入れるべきですか？");
  await page.getByRole("button", { name: "送信" }).click();

  await expect(page.getByText("Fallback")).toBeVisible();
  await expect(page.getByText("仕入れ候補として検討できます。")).toBeVisible();
});
