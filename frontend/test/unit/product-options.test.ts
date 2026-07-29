import { describe, expect, it } from "vitest";
import {
  defaultProductSort,
  getCategoryQueryValue,
  productCategoryOptions,
  productSortOptions,
} from "@/components/products/productOptions";

describe("product options", () => {
  it("contains the designed category filters", () => {
    expect(productCategoryOptions.map((option) => option.value)).toEqual([
      "all",
      "skis",
      "boots",
      "wear",
      "accessories",
      "poles",
      "goggles",
    ]);
  });

  it("omits all from the API category query and forwards concrete categories", () => {
    expect(getCategoryQueryValue("all")).toBeUndefined();
    expect(getCategoryQueryValue("skis")).toBe("skis");
  });

  it("contains the designed sort options", () => {
    expect(defaultProductSort).toBe("createdAt,desc");
    expect(productSortOptions.map((option) => option.value)).toEqual([
      "createdAt,desc",
      "price,asc",
      "price,desc",
    ]);
  });
});
