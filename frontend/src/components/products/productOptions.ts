import type { ProductSort } from "@/lib/api/products";

export type ProductCategoryValue =
  | "all"
  | "skis"
  | "boots"
  | "wear"
  | "accessories"
  | "poles"
  | "goggles";

export type ProductCategoryOption = {
  value: ProductCategoryValue;
  label: string;
};

export type ProductSortOption = {
  value: ProductSort;
  label: string;
};

export const productCategoryOptions = [
  { value: "all", label: "All" },
  { value: "skis", label: "Skis" },
  { value: "boots", label: "Boots" },
  { value: "wear", label: "Wear" },
  { value: "accessories", label: "Accessories" },
  { value: "poles", label: "Poles" },
  { value: "goggles", label: "Goggles" },
] as const satisfies ProductCategoryOption[];

export const productSortOptions = [
  { value: "createdAt,desc", label: "Newest" },
  { value: "price,asc", label: "Price low to high" },
  { value: "price,desc", label: "Price high to low" },
] as const satisfies ProductSortOption[];

export const defaultProductSort = "createdAt,desc" satisfies ProductSort;

export function getCategoryQueryValue(
  category: ProductCategoryValue,
): string | undefined {
  return category === "all" ? undefined : category;
}
