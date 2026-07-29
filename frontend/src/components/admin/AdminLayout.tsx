import type { ReactNode } from "react";
import { BarChart3, Radar, Sparkles } from "lucide-react";
import styles from "./AdminLayout.module.css";

type AdminLayoutProps = {
  children: ReactNode;
};

/** Dashboard shell with a compact sidebar inspired by the Zero Hit Radar reference. */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar} aria-label="Admin navigation">
        <div className={styles.sidebarBrand}>
          <Radar aria-hidden="true" size={22} />
          <span>Zero Hit Radar</span>
        </div>
        <nav className={styles.sideNav}>
          <span className={styles.sideNavActive}>
            <BarChart3 aria-hidden="true" size={18} />
            Dashboard
          </span>
          <span>
            <Sparkles aria-hidden="true" size={18} />
            AI consult
          </span>
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
