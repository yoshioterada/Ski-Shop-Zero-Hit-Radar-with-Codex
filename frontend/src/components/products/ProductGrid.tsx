import { ProductCard } from "@/components/products/ProductCard";
import { EmptyState, LoadingState } from "@/components/ui/PageState";
import type { ProductDto } from "@/types/api";
import styles from "./ProductGrid.module.css";

type ProductGridProps = {
  products: ProductDto[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

/** Responsive grid that keeps product browsing stable across loading and empty states. */
export function ProductGrid({
  products,
  loading = false,
  emptyTitle = "商品が見つかりません",
  emptyDescription = "キーワードやカテゴリを変えてもう一度検索してください。",
}: ProductGridProps) {
  if (loading) {
    return (
      <LoadingState
        title="商品を読み込んでいます"
        description="最新の商品一覧を取得しています。"
      />
    );
  }

  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
