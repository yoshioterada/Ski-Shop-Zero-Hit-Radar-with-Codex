import { apiRequest } from "@/lib/api/client";
import {
  parseProductListResponse,
  parseProductSearchResponse,
} from "@/lib/api/validators";
import type { ProductListResponse, ProductSearchResponse } from "@/types/api";

export type ProductSort = "createdAt,desc" | "price,asc" | "price,desc";

export type ProductListParams = {
  limit?: number;
  category?: string;
  sort?: ProductSort;
};

export type ProductSearchParams = ProductListParams & {
  q: string;
};

/** Fetches products for storefront list and preview views. */
export async function listProducts(
  params: ProductListParams = {},
): Promise<ProductListResponse> {
  const payload = await apiRequest<unknown>("/api/products", {
    query: params,
  });

  return parseProductListResponse(payload);
}

/** Searches products; zero-hit recording is owned by the backend search endpoint. */
export async function searchProducts(
  params: ProductSearchParams,
): Promise<ProductSearchResponse> {
  const payload = await apiRequest<unknown>("/api/products/search", {
    query: params,
  });

  return parseProductSearchResponse(payload);
}
