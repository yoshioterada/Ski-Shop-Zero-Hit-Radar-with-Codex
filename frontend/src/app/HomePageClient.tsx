"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { ErrorState } from "@/components/ui/PageState";
import { listProducts, searchProducts } from "@/lib/api";
import type { ProductDto } from "@/types/api";
import styles from "./page.module.css";

type HomeViewState =
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

const initialState: HomeViewState = {
  status: "loading",
  products: [],
  totalCount: 0,
};

export function HomePageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [state, setState] = useState<HomeViewState>(initialState);

  const isLoading = state.status === "loading";

  const loadProducts = useCallback(async () => {
    setState((current) => ({
      status: "loading",
      products: current.products,
      totalCount: current.totalCount,
    }));

    try {
      if (submittedKeyword.trim() !== "") {
        const response = await searchProducts({
          q: submittedKeyword,
          sort: "createdAt,desc",
        });

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

      const response = await listProducts({
        limit: 20,
        sort: "createdAt,desc",
      });

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
              products: response.items.slice(0, 20),
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
            : "商品プレビューを取得できませんでした。",
      }));
    }
  }, [submittedKeyword]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function handleSearch(keyword: string): void {
    if (isLoading) {
      return;
    }

    setSubmittedKeyword(keyword);
  }

  const resultLabel =
    submittedKeyword.trim() === ""
      ? `新着商品 ${Math.min(state.products.length, 20).toLocaleString("ja-JP")} 件`
      : `検索結果 ${state.totalCount.toLocaleString("ja-JP")} 件`;
  const emptyDescription =
    state.status === "empty" && state.zeroHitRecorded
      ? "該当商品はありませんでした。この検索は Zero Hit として backend に記録されています。"
      : "キーワードを変えてもう一度検索するか、商品一覧でカテゴリから探してください。";

  return (
    <AppLayout>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Zero Hit Radar</p>
          <h1>Codex Ski Shop</h1>
          <p>
            雪山で必要なギアをすばやく探し、見つからない検索も需要の手がかり
            として逃さないスキーショップ体験です。
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryLink} href="/products">
              <Search aria-hidden="true" size={18} />
              商品を見る
            </Link>
            <span className={styles.heroNote}>Search demand meets ski retail.</span>
          </div>
        </div>
        <div className={styles.heroSearch}>
          <SearchBar
            id="home-search-keyword"
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearch}
            loading={isLoading}
            label="トップページ検索"
            placeholder="例: powder ski, junior boots, helmet"
          />
        </div>
      </section>

      <section className={styles.previewHeader}>
        <div>
          <p className={styles.eyebrow}>Product preview</p>
          <h2>{submittedKeyword.trim() === "" ? "新着商品" : "検索結果"}</h2>
        </div>
        <div className={styles.previewMeta}>
          <span aria-live="polite">{resultLabel}</span>
          <Link href="/products">
            Products
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <section className={styles.preview} aria-label="Product preview">
        {state.status === "error" ? (
          <ErrorState
            title="商品プレビューを取得できません"
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
