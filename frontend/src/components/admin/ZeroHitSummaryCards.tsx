import { CircleDollarSign, Search, Target } from "lucide-react";
import { formatYen } from "@/lib/format";
import type { ZeroHitSummaryDto } from "@/types/api";
import styles from "./ZeroHitSummaryCards.module.css";

type ZeroHitSummaryCardsProps = {
  summary: ZeroHitSummaryDto;
};

/** KPI cards for the demand signals surfaced by Zero Hit Radar. */
export function ZeroHitSummaryCards({ summary }: ZeroHitSummaryCardsProps) {
  return (
    <div className={styles.cards} aria-label="Zero Hit summary">
      <article className={styles.card}>
        <Target aria-hidden="true" />
        <span>Zero hit keywords</span>
        <strong>{summary.zeroHitKeywordCount.toLocaleString("ja-JP")}</strong>
      </article>
      <article className={styles.card}>
        <Search aria-hidden="true" />
        <span>Search volume</span>
        <strong>{summary.searchVolume.toLocaleString("ja-JP")}</strong>
      </article>
      <article className={styles.card}>
        <CircleDollarSign aria-hidden="true" />
        <span>Estimated opportunity loss</span>
        <strong>{formatYen(summary.estimatedOpportunityLoss)}</strong>
      </article>
    </div>
  );
}
