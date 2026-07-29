// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/app/HomePageClient";
import { listProducts, searchProducts } from "@/lib/api";
import type { ProductDto } from "@/types/api";

vi.mock("@/lib/api", () => ({
  listProducts: vi.fn(),
  searchProducts: vi.fn(),
}));

const product = {
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
} satisfies ProductDto;

const listProductsMock = vi.mocked(listProducts);
const searchProductsMock = vi.mocked(searchProducts);

describe("HomePageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    listProductsMock.mockResolvedValue({
      items: [product],
      totalCount: 1,
    });
    searchProductsMock.mockResolvedValue({
      items: [product],
      totalCount: 1,
      zeroHitRecorded: false,
    });
  });

  it("loads up to 20 preview products on the top page", async () => {
    const products = Array.from({ length: 25 }, (_, index) => ({
      ...product,
      id: `product-${index}`,
      name: `Product ${index}`,
    }));
    listProductsMock.mockResolvedValue({ items: products, totalCount: 25 });

    render(<HomePageClient />);

    expect(screen.getByRole("heading", { name: "Codex Ski Shop" }))
      .toBeInTheDocument();
    expect(await screen.findByText("Product 0")).toBeInTheDocument();
    expect(screen.queryByText("Product 20")).not.toBeInTheDocument();
    expect(screen.getByText("新着商品 20 件")).toBeInTheDocument();
    expect(listProductsMock).toHaveBeenCalledWith({
      limit: 20,
      sort: "createdAt,desc",
    });
  });

  it("searches products from the top page and renders result cards", async () => {
    render(<HomePageClient />);
    await screen.findByText("Bent 100");

    fireEvent.change(screen.getByLabelText("トップページ検索"), {
      target: { value: "powder ski" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    await waitFor(() =>
      expect(searchProductsMock).toHaveBeenCalledWith({
        q: "powder ski",
        sort: "createdAt,desc",
      }),
    );
    expect(await screen.findByText("検索結果 1 件")).toBeInTheDocument();
  });

  it("shows a natural zero-hit empty state", async () => {
    searchProductsMock.mockResolvedValue({
      items: [],
      totalCount: 0,
      zeroHitRecorded: true,
    });

    render(<HomePageClient />);
    await screen.findByText("Bent 100");

    fireEvent.change(screen.getByLabelText("トップページ検索"), {
      target: { value: "unknown ski" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(await screen.findByText("検索条件に一致する商品がありません"))
      .toBeInTheDocument();
    expect(screen.getByText("検索結果 0 件")).toBeInTheDocument();
  });

  it("prevents duplicate top-page search submit while loading", async () => {
    let resolveSearch: (value: {
      items: ProductDto[];
      totalCount: number;
      zeroHitRecorded: boolean;
    }) => void = () => undefined;
    searchProductsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    render(<HomePageClient />);
    await screen.findByText("Bent 100");

    fireEvent.change(screen.getByLabelText("トップページ検索"), {
      target: { value: "helmet" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));
    fireEvent.submit(screen.getByRole("search"));

    expect(searchProductsMock).toHaveBeenCalledTimes(1);

    resolveSearch({ items: [product], totalCount: 1, zeroHitRecorded: false });
    expect(await screen.findByText("検索結果 1 件")).toBeInTheDocument();
  });

  it("shows a retryable API error without breaking the top page", async () => {
    listProductsMock.mockRejectedValueOnce(new Error("Backend unavailable"));

    render(<HomePageClient />);

    expect(await screen.findByText("商品プレビューを取得できません"))
      .toBeInTheDocument();
    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });
});
