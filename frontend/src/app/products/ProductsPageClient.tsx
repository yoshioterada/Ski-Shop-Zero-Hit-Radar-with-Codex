"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import {
  defaultProductSort,
  getCategoryQueryValue,
  productCategoryOptions,
  productSortOptions,
  type ProductCategoryValue,
} from "@/components/products/productOptions";
import { SearchBar } from "@/components/search/SearchBar";
import { ErrorState } from "@/components/ui/PageState";
import {
  listProducts,
  searchProducts,
  type ProductListParams,
  type ProductSearchParams,
  type ProductSort,
} from "@/lib/api";
import type { ProductDto } from "@/types/api";
import styles from "./products.module.css";

type ProductViewState =
  | { status: "loading"; products: ProductDto[]; totalCount: number }
  | { status: "success"; products: ProductDto[]; totalCount: number }
  | {
      status: "empty";
      products: ProductDto[];
      totalCount: number;
      zeroHitRecorded: boolean;
    }
  | {
      status: "error";
      products: ProductDto[];
      totalCount: number;
      message: string;
    };

const initialState: ProductViewState = {
  status: "loading",
  products: [],
  totalCount: 0,
};

export function ProductsPageClient() {
  const [category, setCategory] = useState<ProductCategoryValue>("all");
  const [sort, setSort] = useState<ProductSort>(defaultProductSort);
  const [searchInput, setSearchInput] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [state, setState] = useState<ProductViewState>(initialState);

  const isLoading = state.status === "loading";
  const categoryQuery = useMemo(
    () => getCategoryQueryValue(category),
    [category],
  );

  const loadProducts = useCallback(async () => {
    setState((current) => ({
      status: "loading",
      products: current.products,
      totalCount: current.totalCount,
    }));

    try {
      if (submittedKeyword.trim() !== "") {
        const searchParams: ProductSearchParams = {
          q: submittedKeyword,
          sort,
        };

        if (categoryQuery !== undefined) {
          searchParams.category = categoryQuery;
        }

        const response = await searchProducts(searchParams);

        setState(
          response.items.length === 0
            ? {
                status: "empty",
                products: [],
                totalCount: response.totalCount,
                zeroHitRecorded: response.zeroHitRecorded,
              }
            : {
                status: "success",
                products: response.items,
                totalCount: response.totalCount,
              },
        );
        return;
      }

      const listParams: ProductListParams = {
        limit: 24,
        sort,
      };

      if (categoryQuery !== undefined) {
        listParams.category = categoryQuery;
      }

      const response = await listProducts(listParams);

      setState(
        response.items.length === 0
          ? {
              status: "empty",
              products: [],
              totalCount: response.totalCount,
              zeroHitRecorded: false,
            }
          : {
              status: "success",
              products: response.items,
              totalCount: response.totalCount,
            },
      );
    } catch (error) {
      setState((current) => ({
        status: "error",
        products: current.products,
        totalCount: current.totalCount,
        message:
          error instanceof Error
            ? error.message
            : "商品一覧を取得できませんでした。",
      }));
    }
  }, [categoryQuery, sort, submittedKeyword]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function handleSearch(keyword: string): void {
    if (isLoading) {
      return;
    }

    setSubmittedKeyword(keyword);
  }

  function handleCategoryChange(nextCategory: ProductCategoryValue): void {
    if (isLoading) {
      return;
    }

    setCategory(nextCategory);
  }

  function handleSortChange(nextSort: ProductSort): void {
    setSort(nextSort);
  }

  const resultLabel =
    submittedKeyword.trim() === ""
      ? `総件数 ${state.totalCount.toLocaleString("ja-JP")} 件`
      : `検索結果 ${state.totalCount.toLocaleString("ja-JP")} 件`;
  const emptyDescription =
    state.status === "empty" && state.zeroHitRecorded
      ? "該当商品はありませんでした。この検索は Zero Hit として backend に記録されています。"
      : "カテゴリ、並び順、キーワードを変えてもう一度検索してください。";

  return (
    <AppLayout>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Products</p>
          <h1>商品一覧</h1>
        </div>
        <p className={styles.count} aria-live="polite">
          {resultLabel}
        </p>
      </div>

      <section className={styles.toolbar} aria-label="Product search and filters">
        <SearchBar
          id="products-search-keyword"
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearch}
          loading={isLoading}
          label="商品検索"
          placeholder="例: powder ski, boots, goggles"
        />

        <div className={styles.filterRow}>
          <fieldset className={styles.categoryGroup}>
            <legend>Category</legend>
            <div className={styles.categoryChips}>
              {productCategoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    option.value === category
                      ? styles.categoryChipActive
                      : styles.categoryChip
                  }
                  disabled={isLoading}
                  aria-pressed={option.value === category}
                  onClick={() => handleCategoryChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.sortLabel}>
            <span>Sort</span>
            <select
              value={sort}
              disabled={isLoading}
              onChange={(event) =>
                handleSortChange(event.currentTarget.value as ProductSort)
              }
            >
              {productSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.results} aria-label="Product results">
        {state.status === "error" ? (
          <ErrorState
            title="商品一覧を取得できません"
            description={state.message}
            onRetry={loadProducts}
          />
        ) : (
          <ProductGrid
            products={state.products}
            loading={isLoading}
            emptyTitle="検索条件に一致する商品がありません"
            emptyDescription={emptyDescription}
          />
        )}
      </section>
    </AppLayout>
  );
}
