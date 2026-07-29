import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./PageState.module.css";

type PageStateProps = {
  title: string;
  description?: string;
};

type ErrorStateProps = PageStateProps & {
  onRetry?: () => void;
};

export function LoadingState({
  title = "読み込み中です",
  description,
}: Partial<PageStateProps>) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <LoaderCircle className={styles.loadingIcon} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: PageStateProps) {
  return (
    <div className={styles.state}>
      <Inbox aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {onRetry ? (
          <Button className={styles.retryButton} variant="secondary" onClick={onRetry}>
            再試行
          </Button>
        ) : null}
      </div>
    </div>
  );
}
