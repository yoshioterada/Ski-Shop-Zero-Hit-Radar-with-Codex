"use client";

import { FormEvent, ReactNode, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatAdminDateTime } from "@/lib/format";
import type { AiConsultResponse, ZeroHitItemDto } from "@/types/api";
import styles from "./AiConsultPanel.module.css";

type AiConsultPanelProps = {
  selectedKeyword?: ZeroHitItemDto;
  answer?: AiConsultResponse;
  loading?: boolean;
  error?: string;
  onSubmit: (question: string) => void;
};

const providerStatusLabels = {
  LIVE: "Live AI",
  FALLBACK: "Fallback",
  ERROR: "Provider error",
} as const satisfies Record<AiConsultResponse["providerStatus"], string>;

/** AI sourcing consultation panel for a selected Zero Hit keyword. */
export function AiConsultPanel({
  selectedKeyword,
  answer,
  loading = false,
  error,
  onSubmit,
}: AiConsultPanelProps) {
  const [question, setQuestion] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (selectedKeyword === undefined || loading || trimmedQuestion === "") {
      return;
    }

    onSubmit(trimmedQuestion);
  }

  const canSubmit =
    selectedKeyword !== undefined && question.trim() !== "" && !loading;

  return (
    <aside className={styles.panel} aria-label="AI consultation panel">
      <div className={styles.titleRow}>
        <Sparkles aria-hidden="true" size={20} />
        <h2>AI 相談</h2>
      </div>

      {selectedKeyword ? (
        <div className={styles.selected}>
          <span>相談対象</span>
          <strong>{selectedKeyword.keyword}</strong>
          <small>
            検索回数 {selectedKeyword.hitCount.toLocaleString("ja-JP")} 回 / 最終検索{" "}
            {formatAdminDateTime(selectedKeyword.lastSearchedAt)}
          </small>
        </div>
      ) : (
        <p className={styles.helper}>
          Zero Hit keyword を選択すると、AI 相談対象としてここに表示されます。
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="ai-consult-question">質問</label>
        <textarea
          id="ai-consult-question"
          value={question}
          rows={5}
          disabled={selectedKeyword === undefined || loading}
          placeholder="例: この商品を仕入れるべきですか？代替カテゴリはありますか？"
          onChange={(event) => setQuestion(event.currentTarget.value)}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          isLoading={loading}
          disabled={!canSubmit}
          icon={<Send aria-hidden="true" size={17} />}
        >
          送信
        </Button>
      </form>

      {answer ? (
        <div className={styles.answer} aria-live="polite">
          <div className={styles.statusRow}>
            <span className={styles[answer.providerStatus]}>
              {providerStatusLabels[answer.providerStatus]}
            </span>
          </div>
          <div className={styles.answerBody}>{renderMarkdownAnswer(answer.answer)}</div>
        </div>
      ) : null}
    </aside>
  );
}

function renderMarkdownAnswer(answer: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];

  function flushParagraph(): void {
    if (paragraphLines.length === 0) {
      return;
    }

    const text = paragraphLines.join(" ").trim();
    if (text !== "") {
      nodes.push(<p key={`p-${nodes.length}`}>{renderInlineMarkdown(text)}</p>);
    }
    paragraphLines.length = 0;
  }

  function flushList(): void {
    if (listItems.length === 0) {
      return;
    }

    const items = listItems;
    listItems = [];
    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
  }

  for (const rawLine of answer.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushParagraph();
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} />);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading !== null) {
      flushParagraph();
      flushList();
      const [, marker = "", headingText = ""] = heading;
      const level = marker.length;
      const text = headingText.trim();
      nodes.push(
        level === 1 ? (
          <h3 key={`h-${nodes.length}`}>{renderInlineMarkdown(text)}</h3>
        ) : (
          <h4 key={`h-${nodes.length}`}>{renderInlineMarkdown(text)}</h4>
        ),
      );
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem !== null) {
      flushParagraph();
      const [, itemText = ""] = listItem;
      listItems.push(itemText.trim());
      continue;
    }

    flushList();
    flushParagraph();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return nodes;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}
