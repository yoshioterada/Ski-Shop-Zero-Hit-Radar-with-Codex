import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  ApiClientError,
  buildApiUrl,
  getApiErrorUiBehavior,
  normalizeApiError,
} from "@/lib/api/client";
import { consultAi } from "@/lib/api/aiConsult";
import { getMe, login } from "@/lib/api/auth";
import { listProducts, searchProducts } from "@/lib/api/products";
import { listZeroHits } from "@/lib/api/zeroHits";
import {
  parseAiConsultResponse,
  parseProductListResponse,
  parseProductSearchResponse,
  parseZeroHitListResponse,
} from "@/lib/api/validators";

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

describe("api client URL and error handling", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  });

  afterAll(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }
  });

  it("builds browser-resolvable API URLs and omits empty query values", () => {
    const url = buildApiUrl("/api/products", {
      limit: 20,
      category: "skis",
      sort: "createdAt,desc",
      ignored: "",
    });

    expect(url).toBe(
      "http://localhost:8080/api/products?limit=20&category=skis&sort=createdAt%2Cdesc",
    );
  });

  it("rejects docker-internal backend host for the public browser base URL", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://backend:8080";

    expect(() => buildApiUrl("/api/products")).toThrow(
      "NEXT_PUBLIC_API_BASE_URL must be browser-resolvable",
    );
  });

  it("normalizes Spring ProblemDetail fields in user-facing priority order", () => {
    expect(
      normalizeApiError(400, {
        detail: "キーワードを入力してください。",
        title: "Bad Request",
        message: "Invalid",
        code: "VALIDATION_ERROR",
      }),
    ).toEqual({
      status: 400,
      message: "キーワードを入力してください。",
      code: "VALIDATION_ERROR",
    });

    expect(normalizeApiError(403, { title: "Forbidden" }).message).toBe(
      "Forbidden",
    );
    expect(normalizeApiError(500, { message: "Service unavailable" }).message)
      .toBe("Service unavailable");
  });

  it("maps HTTP status codes to the expected UI behavior", () => {
    expect(getApiErrorUiBehavior({ status: 400, message: "invalid" })).toEqual({
      kind: "validation",
      placement: "form",
    });
    expect(getApiErrorUiBehavior({ status: 401, message: "unauthorized" }))
      .toEqual({
        kind: "unauthorized",
        clearToken: true,
        redirectTo: "/login",
      });
    expect(getApiErrorUiBehavior({ status: 403, message: "forbidden" }))
      .toEqual({ kind: "accessDenied" });
    expect(
      getApiErrorUiBehavior(
        { status: 404, message: "not found" },
        { notFoundDisplay: "emptyState" },
      ),
    ).toEqual({ kind: "notFound", displayAs: "emptyState" });
    expect(getApiErrorUiBehavior({ status: 500, message: "error" })).toEqual({
      kind: "serviceError",
      retryable: true,
    });
    expect(getApiErrorUiBehavior({ status: 418, message: "teapot" })).toEqual({
      kind: "unknown",
      retryable: false,
    });
  });

  it("falls back to safe messages for empty, non-json, and status-only failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await expect(apiRequest<Record<string, unknown>>("/api/no-content"))
      .resolves.toEqual({});

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("not json", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
    await expect(apiRequest("/api/broken")).rejects.toMatchObject({
      status: 500,
      message: "サービスで問題が発生しました。時間をおいて再試行してください。",
    });

    expect(normalizeApiError(404, null)).toEqual({
      status: 404,
      message: "対象のデータが見つかりません。",
    });
    expect(normalizeApiError(401, {})).toEqual({
      status: 401,
      message: "ログインが必要です。",
    });
  });
});

describe("endpoint modules", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  });

  it("uses the product endpoint contract", async () => {
    const requests = stubFetchSequence([
      { items: [], totalCount: 0 },
      { items: [], totalCount: 0, zeroHitRecorded: true },
    ]);

    await listProducts({
      limit: 20,
      category: "skis",
      sort: "createdAt,desc",
    });
    await searchProducts({
      q: "powder ski",
      category: "skis",
      sort: "price,asc",
    });

    expect(requests[0]?.url).toBe(
      "http://localhost:8080/api/products?limit=20&category=skis&sort=createdAt%2Cdesc",
    );
    expect(requests[1]?.url).toBe(
      "http://localhost:8080/api/products/search?q=powder+ski&category=skis&sort=price%2Casc",
    );
  });

  it("uses the auth endpoint contract and attaches bearer tokens", async () => {
    const requests = stubFetchSequence([
      {
        success: true,
        token: "token-123",
        user: { username: "admin", role: "ADMIN" },
      },
      { authenticated: true, user: { username: "admin", role: "ADMIN" } },
    ]);

    await login({ username: "admin", password: "password" });
    await getMe("token-123");

    expect(requests[0]?.url).toBe("http://localhost:8080/api/auth/login");
    expect(requests[0]?.method).toBe("POST");
    expect(requests[0]?.headers.get("Content-Type")).toBe("application/json");
    expect(await requests[0]?.text()).toBe(
      JSON.stringify({ username: "admin", password: "password" }),
    );
    expect(requests[1]?.url).toBe("http://localhost:8080/api/auth/me");
    expect(requests[1]?.headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("uses protected admin endpoint contracts with bearer tokens", async () => {
    const requests = stubFetchSequence([
      {
        items: [],
        summary: {
          zeroHitKeywordCount: 0,
          searchVolume: 0,
          estimatedOpportunityLoss: 0,
        },
      },
      { answer: "確認しました。", providerStatus: "FALLBACK" },
    ]);

    await listZeroHits("token-123", {
      days: 30,
      sort: "hitCount,desc",
      limit: 50,
    });
    await consultAi("token-123", {
      keyword: "wide ski boots",
      question: "仕入れるべきですか？",
      hitCount: 8,
      lastSearchedAt: "2026-06-04T12:00:00Z",
    });

    expect(requests[0]?.url).toBe(
      "http://localhost:8080/api/admin/zero-hits?days=30&sort=hitCount%2Cdesc&limit=50",
    );
    expect(requests[0]?.headers.get("Authorization")).toBe("Bearer token-123");
    expect(requests[1]?.url).toBe(
      "http://localhost:8080/api/admin/ai-consult",
    );
    expect(requests[1]?.method).toBe("POST");
    expect(requests[1]?.headers.get("Authorization")).toBe("Bearer token-123");
  });
});

describe("API response validators", () => {
  it("accepts optional and nullable product image URLs", () => {
    expect(
      parseProductListResponse({
        items: [
          {
            id: "product-1",
            manufacturer: "Atomic",
            name: "Bent 100",
            category: "skis",
            description: "Ski",
            price: 98000,
            stockStatus: "IN_STOCK",
            imageUrl: null,
            createdAt: "2026-06-04T00:00:00Z",
            updatedAt: "2026-06-04T00:00:00Z",
          },
        ],
        totalCount: 1,
      }).items[0]?.imageUrl,
    ).toBeNull();
  });

  it("rejects invalid API response shapes", () => {
    expect(() => parseProductListResponse({ items: {}, totalCount: 0 }))
      .toThrow(ApiClientError);
    expect(() =>
      parseProductSearchResponse({
        items: [],
        totalCount: 0,
        zeroHitRecorded: "true",
      }),
    ).toThrow("ProductSearchResponse.zeroHitRecorded must be a boolean");
    expect(() =>
      parseZeroHitListResponse({
        items: [
          {
            id: "zero-hit-1",
            keyword: "wide ski boots",
            normalizedKeyword: "wide ski boots",
            hitCount: Number.NaN,
            priority: "URGENT",
            estimatedOpportunityLoss: 1000,
            firstSearchedAt: "2026-06-01T00:00:00Z",
            lastSearchedAt: "2026-06-04T00:00:00Z",
          },
        ],
        summary: {
          zeroHitKeywordCount: 1,
          searchVolume: 1,
          estimatedOpportunityLoss: 1000,
        },
      }),
    ).toThrow("ZeroHitItemDto.hitCount must be a finite number");
    expect(() =>
      parseAiConsultResponse({ answer: "ok", providerStatus: "BROKEN" }),
    ).toThrow("AiConsultResponse.providerStatus must be LIVE");
  });
});

function stubFetchSequence(payloads: unknown[]): Request[] {
  const requests: Request[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      const payload = payloads.shift() ?? {};

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );

  return requests;
}
