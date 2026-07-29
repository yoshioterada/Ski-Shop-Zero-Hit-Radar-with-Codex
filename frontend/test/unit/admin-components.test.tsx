// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiConsultPanel } from "@/components/admin/AiConsultPanel";
import { ZeroHitSummaryCards } from "@/components/admin/ZeroHitSummaryCards";
import { ZeroHitTable } from "@/components/admin/ZeroHitTable";
import type { ZeroHitItemDto } from "@/types/api";

const item = {
  id: "zero-hit-1",
  keyword: "wide ski boots",
  normalizedKeyword: "wide ski boots",
  hitCount: 12,
  priority: "HIGH",
  estimatedOpportunityLoss: 240000,
  firstSearchedAt: "2026-06-01T09:00:00+09:00",
  lastSearchedAt: "2026-06-04T10:00:00+09:00",
} satisfies ZeroHitItemDto;

describe("admin dashboard components", () => {
  it("renders summary cards with yen formatting", () => {
    render(
      <ZeroHitSummaryCards
        summary={{
          zeroHitKeywordCount: 3,
          searchVolume: 42,
          estimatedOpportunityLoss: 980000,
        }}
      />,
    );

    expect(screen.getByText("Zero hit keywords")).toBeInTheDocument();
    expect(screen.getByText("Search volume")).toBeInTheDocument();
    expect(screen.getByText("¥980,000")).toBeInTheDocument();
  });

  it("renders zero-hit table fields and selection action", () => {
    const onSelectKeyword = vi.fn();

    render(<ZeroHitTable items={[item]} onSelectKeyword={onSelectKeyword} />);

    expect(screen.getByText("wide ski boots")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("高優先")).toBeInTheDocument();
    expect(screen.getByText("¥240,000")).toBeInTheDocument();
    expect(screen.getAllByText(/2026/)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "AI 相談" }));
    expect(onSelectKeyword).toHaveBeenCalledWith(item);
  });

  it("shows selected keyword and submits a non-empty AI question", () => {
    const onSubmit = vi.fn();

    render(<AiConsultPanel selectedKeyword={item} onSubmit={onSubmit} />);

    expect(screen.getByText("AI 相談")).toBeInTheDocument();
    expect(screen.getByText("wide ski boots")).toBeInTheDocument();
    expect(screen.getByText(/検索回数 12 回/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("質問"), {
      target: { value: "仕入れるべきですか？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    expect(onSubmit).toHaveBeenCalledWith("仕入れるべきですか？");
  });

  it("renders provider status and keeps the question on failure", () => {
    render(
      <AiConsultPanel
        selectedKeyword={item}
        onSubmit={vi.fn()}
        answer={{
          answer: "候補商品を確認してください。\n仕入れ優先度は高いです。",
          providerStatus: "FALLBACK",
        }}
        error="AI provider is unavailable"
      />,
    );

    fireEvent.change(screen.getByLabelText("質問"), {
      target: { value: "代替商品は？" },
    });

    expect(screen.getByText("Fallback")).toBeInTheDocument();
    expect(screen.getByText("候補商品を確認してください。")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI provider is unavailable",
    );
    expect(screen.getByLabelText("質問")).toHaveValue("代替商品は？");
  });

  it("disables send while AI consultation is loading", () => {
    render(
      <AiConsultPanel selectedKeyword={item} onSubmit={vi.fn()} loading />,
    );

    expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
  });

  it("handles all provider statuses", () => {
    const { rerender } = render(
      <AiConsultPanel
        selectedKeyword={item}
        onSubmit={vi.fn()}
        answer={{ answer: "Live answer", providerStatus: "LIVE" }}
      />,
    );
    expect(screen.getByText("Live AI")).toBeInTheDocument();

    rerender(
      <AiConsultPanel
        selectedKeyword={item}
        onSubmit={vi.fn()}
        answer={{ answer: "Error answer", providerStatus: "ERROR" }}
      />,
    );
    expect(screen.getByText("Provider error")).toBeInTheDocument();
  });

  it("renders markdown-like AI answers as readable browser content", () => {
    render(
      <AiConsultPanel
        selectedKeyword={item}
        onSubmit={vi.fn()}
        answer={{
          answer: [
            "## 結論",
            "",
            "**Bluemoris** は監視対象として扱うのが妥当です。",
            "",
            "---",
            "",
            "### 理由",
            "- **検索回数1件** のため、今すぐの売上寄与は限定的です。",
            "- コア層向けの小ロット需要になりやすいです。",
          ].join("\n"),
          providerStatus: "LIVE",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "結論" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "理由" })).toBeInTheDocument();
    expect(screen.getByText("Bluemoris")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText(/##/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });
});
