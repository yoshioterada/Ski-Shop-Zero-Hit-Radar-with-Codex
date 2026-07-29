// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsPageClient } from "@/app/products/ProductsPageClient";
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
  stockStatus: "LOW_STOCK",
  imageUrl: null,
  createdAt: "2026-06-04T00:00:00Z",
  updatedAt: "2026-06-04T00:00:00Z",
} satisfies ProductDto;

const listProductsMock = vi.mocked(listProducts);
const searchProductsMock = vi.mocked(searchProducts);

describe("ProductsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    listProductsMock.mockResolvedValue({ items: [product], totalCount: 1 });
    searchProductsMock.mockResolvedValue({
      items: [],
      totalCount: 0,
      zeroHitRecorded: true,
    });
  });

  it("loads and displays the initial product list", async () => {
    render(<ProductsPageClient />);

    expect(screen.getByRole("heading", { name: "商品一覧" })).toBeInTheDocument();
    expect(await screen.findByText("Bent 100")).toBeInTheDocument();
    expect(screen.getByText("総件数 1 件")).toBeInTheDocument();
    expect(listProductsMock).toHaveBeenCalledWith({
      limit: 24,
      sort: "createdAt,desc",
    });
  });

  it("changes category and sort API query values", async () => {
    render(<ProductsPageClient />);
    await screen.findByText("Bent 100");

    fireEvent.click(screen.getByRole("button", { name: "Skis" }));
    await waitFor(() =>
      expect(listProductsMock).toHaveBeenLastCalledWith({
        limit: 24,
        category: "skis",
        sort: "createdAt,desc",
      }),
    );

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: { value: "price,asc" },
    });
    await waitFor(() =>
      expect(listProductsMock).toHaveBeenLastCalledWith({
        limit: 24,
        category: "skis",
        sort: "price,asc",
      }),
    );
  });

  it("uses only the search API for zero-hit searches and shows no-results state", async () => {
    render(<ProductsPageClient />);
    await screen.findByText("Bent 100");

    fireEvent.change(screen.getByLabelText("商品検索"), {
      target: { value: "not existing ski" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    await waitFor(() =>
      expect(searchProductsMock).toHaveBeenCalledWith({
        q: "not existing ski",
        sort: "createdAt,desc",
      }),
    );
    expect(await screen.findByText("検索条件に一致する商品がありません"))
      .toBeInTheDocument();
    expect(screen.getByText("検索結果 0 件")).toBeInTheDocument();
    expect(listProductsMock).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate search submit while loading", async () => {
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

    render(<ProductsPageClient />);
    await screen.findByText("Bent 100");

    fireEvent.change(screen.getByLabelText("商品検索"), {
      target: { value: "powder ski" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));
    fireEvent.submit(screen.getByRole("search"));

    expect(searchProductsMock).toHaveBeenCalledTimes(1);

    resolveSearch({ items: [product], totalCount: 1, zeroHitRecorded: false });
    expect(await screen.findByText("検索結果 1 件")).toBeInTheDocument();
  });

  it("shows a retryable error state without breaking the page", async () => {
    listProductsMock.mockRejectedValueOnce(new Error("Backend unavailable"));

    render(<ProductsPageClient />);

    expect(await screen.findByText("商品一覧を取得できません")).toBeInTheDocument();
    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });
});
