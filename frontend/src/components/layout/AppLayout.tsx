import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import styles from "./AppLayout.module.css";

type AppLayoutProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

/** Shared shell for public storefront and admin-facing pages. */
export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
  return (
    <div className={styles.shell}>
      <Header isAdmin={isAdmin} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
