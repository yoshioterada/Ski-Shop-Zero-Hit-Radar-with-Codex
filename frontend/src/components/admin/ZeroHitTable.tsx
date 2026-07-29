import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatAdminDateTime,
  formatYen,
  getPriorityDisplay,
} from "@/lib/format";
import type { ZeroHitItemDto } from "@/types/api";
import styles from "./ZeroHitTable.module.css";

type ZeroHitTableProps = {
  items: ZeroHitItemDto[];
  selectedKeywordId?: string;
  onSelectKeyword: (item: ZeroHitItemDto) => void;
};

/** Responsive Zero Hit keyword table with an action to select an AI consult target. */
export function ZeroHitTable({
  items,
  selectedKeywordId,
  onSelectKeyword,
}: ZeroHitTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Hit count</th>
            <th>Priority</th>
            <th>First searched</th>
            <th>Last searched</th>
            <th>Opportunity loss</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={item.id === selectedKeywordId ? styles.selectedRow : undefined}
            >
              <td data-label="Keyword">
                <strong>{item.keyword}</strong>
              </td>
              <td data-label="Hit count">{item.hitCount.toLocaleString("ja-JP")}</td>
              <td data-label="Priority">
                <StatusBadge display={getPriorityDisplay(item.priority)} />
              </td>
              <td data-label="First searched">
                {formatAdminDateTime(item.firstSearchedAt)}
              </td>
              <td data-label="Last searched">
                {formatAdminDateTime(item.lastSearchedAt)}
              </td>
              <td data-label="Opportunity loss">
                {formatYen(item.estimatedOpportunityLoss)}
              </td>
              <td data-label="Action">
                <Button
                  variant="secondary"
                  icon={<Sparkles aria-hidden="true" size={16} />}
                  onClick={() => onSelectKeyword(item)}
                >
                  AI 相談
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
