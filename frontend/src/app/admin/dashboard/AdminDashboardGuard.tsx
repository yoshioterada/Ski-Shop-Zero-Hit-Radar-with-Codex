"use client";

import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AiConsultPanel } from "@/components/admin/AiConsultPanel";
import { ZeroHitSummaryCards } from "@/components/admin/ZeroHitSummaryCards";
import { ZeroHitTable } from "@/components/admin/ZeroHitTable";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/PageState";
import {
  ApiClientError,
  consultAi,
  getMe,
  listZeroHits,
  type ZeroHitListParams,
} from "@/lib/api";
import { clearAdminToken, readAdminToken } from "@/lib/authToken";
import type {
  AdminUser,
  AiConsultResponse,
  ZeroHitItemDto,
  ZeroHitListResponse,
  ZeroHitSummaryDto,
} from "@/types/api";
import styles from "./dashboard.module.css";

type PeriodDays = 7 | 30 | 90;

type GuardState =
  | { status: "checking" }
  | { status: "authenticated"; user: AdminUser; token: string };

type ZeroHitState =
  | { status: "loading"; data?: ZeroHitListResponse }
  | { status: "success"; data: ZeroHitListResponse }
  | { status: "empty"; data: ZeroHitListResponse }
  | { status: "error"; message: string; data?: ZeroHitListResponse };

type AiConsultState =
  | { status: "idle" }
  | { status: "sending"; answer?: AiConsultResponse }
  | { status: "success"; answer: AiConsultResponse }
  | { status: "error"; message: string; answer?: AiConsultResponse };

const defaultSummary: ZeroHitSummaryDto = {
  zeroHitKeywordCount: 0,
  searchVolume: 0,
  estimatedOpportunityLoss: 0,
};

const emptyZeroHitData: ZeroHitListResponse = {
  items: [],
  summary: defaultSummary,
};

const defaultZeroHitParams = {
  days: 30,
  sort: "lastSearchedAt,desc",
  limit: 50,
} satisfies Required<ZeroHitListParams>;

export function AdminDashboardGuard() {
  const router = useRouter();
  const [guardState, setGuardState] = useState<GuardState>({ status: "checking" });

  useEffect(() => {
    let isActive = true;

    async function verifySession(): Promise<void> {
      const token = readAdminToken();

      if (token === null) {
        router.replace("/login");
        return;
      }

      try {
        const response = await getMe(token);

        if (!isActive) {
          return;
        }

        if (!response.authenticated || response.user === undefined) {
          clearAdminToken();
          router.replace("/login");
          return;
        }

        setGuardState({
          status: "authenticated",
          user: response.user,
          token,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          clearAdminToken();
          router.replace("/login");
          return;
        }

        clearAdminToken();
        router.replace("/login");
      }
    }

    void verifySession();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (guardState.status === "checking") {
    return (
      <AppLayout>
        <LoadingState
          title="認証状態を確認しています"
          description="Zero Hit Radar dashboard を表示する前に管理者権限を確認します。"
        />
      </AppLayout>
    );
  }

  return (
    <AdminDashboardContent
      token={guardState.token}
      user={guardState.user}
      onUnauthorized={() => {
        clearAdminToken();
        router.replace("/login");
      }}
      onLogout={() => {
        clearAdminToken();
        router.replace("/login");
      }}
    />
  );
}

type AdminDashboardContentProps = {
  token: string;
  user: AdminUser;
  onUnauthorized: () => void;
  onLogout: () => void;
};

export function AdminDashboardContent({
  token,
  user,
  onUnauthorized,
  onLogout,
}: AdminDashboardContentProps) {
  const [periodDays, setPeriodDays] = useState<PeriodDays>(defaultZeroHitParams.days);
  const [zeroHitState, setZeroHitState] = useState<ZeroHitState>({
    status: "loading",
  });
  const [selectedKeyword, setSelectedKeyword] = useState<ZeroHitItemDto | undefined>();
  const [aiConsultState, setAiConsultState] = useState<AiConsultState>({
    status: "idle",
  });

  async function loadZeroHits(days: PeriodDays = periodDays): Promise<void> {
    setZeroHitState((current) => ({
      status: "loading",
      ...(current.data === undefined ? {} : { data: current.data }),
    }));

    try {
      const data = await listZeroHits(token, {
        days,
        sort: defaultZeroHitParams.sort,
        limit: defaultZeroHitParams.limit,
      });

      setZeroHitState({
        status: data.items.length === 0 ? "empty" : "success",
        data,
      });
      setSelectedKeyword((current) =>
        current === undefined
          ? undefined
          : data.items.find((item) => item.id === current.id),
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        onUnauthorized();
        return;
      }

      setZeroHitState((current) => ({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Zero Hit データを取得できませんでした。",
        ...(current.data === undefined ? {} : { data: current.data }),
      }));
    }
  }

  useEffect(() => {
    void loadZeroHits(periodDays);
    // loadZeroHits intentionally reads the latest token and callbacks from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodDays]);

  const data = zeroHitState.data ?? emptyZeroHitData;
  const isLoading = zeroHitState.status === "loading";
  const aiAnswer =
    aiConsultState.status === "success" || aiConsultState.status === "error"
      ? aiConsultState.answer
      : aiConsultState.status === "sending"
        ? aiConsultState.answer
        : undefined;
  const aiError =
    aiConsultState.status === "error" ? aiConsultState.message : undefined;

  async function handleAiConsult(question: string): Promise<void> {
    if (selectedKeyword === undefined || aiConsultState.status === "sending") {
      return;
    }

    setAiConsultState((current) => ({
      status: "sending",
      ...(current.status === "success" || current.status === "error"
        ? { answer: current.answer }
        : {}),
    }));

    try {
      const answer = await consultAi(token, {
        keyword: selectedKeyword.keyword,
        question,
        hitCount: selectedKeyword.hitCount,
        lastSearchedAt: selectedKeyword.lastSearchedAt,
      });

      setAiConsultState({ status: "success", answer });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        onUnauthorized();
        return;
      }

      setAiConsultState((current) => ({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "AI 相談を送信できませんでした。",
        ...(current.status === "success" || current.status === "sending"
          ? { answer: current.answer }
          : {}),
      }));
    }
  }

  function handleSelectKeyword(item: ZeroHitItemDto): void {
    setSelectedKeyword(item);
    setAiConsultState({ status: "idle" });
  }

  return (
    <AppLayout>
      <AdminLayout>
        <section className={styles.dashboardHeader}>
          <div>
            <p className={styles.eyebrow}>Admin dashboard</p>
            <h1>Zero Hit Radar</h1>
            <p>{user.username} として認証済みです。未充足検索を確認できます。</p>
          </div>
          <Button
            variant="secondary"
            icon={<LogOut aria-hidden="true" size={18} />}
            onClick={onLogout}
          >
            ログアウト
          </Button>
        </section>

        <section className={styles.controls} aria-label="Zero Hit controls">
          <fieldset className={styles.periodGroup}>
            <legend>Period</legend>
            <div className={styles.periodButtons}>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={
                    periodDays === days
                      ? styles.periodButtonActive
                      : styles.periodButton
                  }
                  disabled={isLoading}
                  aria-pressed={periodDays === days}
                  onClick={() => setPeriodDays(days as PeriodDays)}
                >
                  {days} days
                </button>
              ))}
            </div>
          </fieldset>
          <Button
            variant="secondary"
            isLoading={isLoading}
            icon={<RefreshCw aria-hidden="true" size={18} />}
            onClick={() => void loadZeroHits(periodDays)}
          >
            更新
          </Button>
        </section>

        <ZeroHitSummaryCards summary={data.summary} />

        {zeroHitState.status === "error" ? (
          <ErrorState
            title="Zero Hit データを取得できません"
            description={zeroHitState.message}
            onRetry={() => void loadZeroHits(periodDays)}
          />
        ) : null}

        <section className={styles.dashboardGrid}>
          <div className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2>Zero Hit keywords</h2>
              <span>
                sort: {defaultZeroHitParams.sort} / limit:{" "}
                {defaultZeroHitParams.limit}
              </span>
            </div>
            {isLoading && data.items.length === 0 ? (
              <LoadingState
                title="Zero Hit を読み込んでいます"
                description="管理ダッシュボードの最新データを取得しています。"
              />
            ) : zeroHitState.status === "empty" ? (
              <EmptyState
                title="Zero Hit はまだありません"
                description="検索結果が 0 件のキーワードが記録されると、ここに表示されます。"
              />
            ) : (
              <ZeroHitTable
                items={data.items}
                onSelectKeyword={handleSelectKeyword}
                {...(selectedKeyword === undefined
                  ? {}
                  : { selectedKeywordId: selectedKeyword.id })}
              />
            )}
          </div>
          <AiConsultPanel
            key={selectedKeyword?.id ?? "no-keyword-selected"}
            loading={aiConsultState.status === "sending"}
            onSubmit={(question) => void handleAiConsult(question)}
            {...(selectedKeyword === undefined ? {} : { selectedKeyword })}
            {...(aiAnswer === undefined ? {} : { answer: aiAnswer })}
            {...(aiError === undefined ? {} : { error: aiError })}
          />
        </section>
      </AdminLayout>
    </AppLayout>
  );
}
