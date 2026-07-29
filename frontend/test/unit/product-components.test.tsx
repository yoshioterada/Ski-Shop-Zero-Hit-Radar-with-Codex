// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ProductDto } from "@/types/api";

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

describe("product components", () => {
  it("renders product card fields and category visual fallback", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("ATOMIC")).toBeInTheDocument();
    expect(screen.getByText("Bent 100")).toBeInTheDocument();
    expect(screen.getAllByText("skis").length).toBeGreaterThan(0);
    expect(screen.getByText("¥98,000")).toBeInTheDocument();
    expect(screen.getByText("在庫あり")).toBeInTheDocument();
    expect(screen.getByLabelText("skis image")).toBeInTheDocument();
  });

  it("renders shared loading and empty states", () => {
    const { rerender } = render(<ProductGrid products={[]} loading />);

    expect(screen.getByText("商品を読み込んでいます")).toBeInTheDocument();

    rerender(<ProductGrid products={[]} />);
    expect(screen.getByText("商品が見つかりません")).toBeInTheDocument();
  });

  it("renders a responsive grid of product cards", () => {
    render(<ProductGrid products={[product]} />);

    expect(screen.getByRole("heading", { name: "Bent 100" })).toBeInTheDocument();
  });
});
