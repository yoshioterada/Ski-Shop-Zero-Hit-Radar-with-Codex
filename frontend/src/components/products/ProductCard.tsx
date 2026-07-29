import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatYen, getStockStatusDisplay } from "@/lib/format";
import type { ProductDto } from "@/types/api";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: ProductDto;
};

/** Scannable storefront card for one backend product DTO. */
export function ProductCard({ product }: ProductCardProps) {
  const stockDisplay = getStockStatusDisplay(product.stockStatus);
  const imageUrl = product.imageUrl ?? null;
  const canRenderImage = imageUrl !== null;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {canRenderImage ? (
          <Image
            src={imageUrl}
            alt={`${product.manufacturer} ${product.name}`}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 33vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.categoryVisual} aria-label={`${product.category} image`}>
            <ImageIcon aria-hidden="true" size={34} />
            <span>{product.category}</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span className={styles.manufacturer}>
            {product.manufacturer.toUpperCase()}
          </span>
          <span className={styles.category}>{product.category}</span>
        </div>
        <h2>{product.name}</h2>
        <div className={styles.footer}>
          <span className={styles.price}>{formatYen(product.price)}</span>
          <StatusBadge display={stockDisplay} />
        </div>
      </div>
    </article>
  );
}
