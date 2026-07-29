import type { Metadata } from "next";
import { ProductsPageClient } from "./ProductsPageClient";

export const metadata: Metadata = {
  title: "Products | Codex Ski Shop",
  description: "Search and browse Codex Ski Shop products.",
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
