import type { StatusDisplay } from "@/lib/format";
import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  display: StatusDisplay;
};

export function StatusBadge({ display }: StatusBadgeProps) {
  return (
    <span className={[styles.badge, styles[display.style]].join(" ")}>
      {display.label}
    </span>
  );
}
