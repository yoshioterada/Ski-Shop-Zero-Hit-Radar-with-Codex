// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboardGuard } from "@/app/admin/dashboard/AdminDashboardGuard";
import { LoginPageClient } from "@/app/login/LoginPageClient";
import {
  ApiClientError,
  consultAi,
  getMe,
  listZeroHits,
  login,
  logout,
} from "@/lib/api";
import { clearAdminToken, readAdminToken, saveAdminToken } from "@/lib/authToken";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    listZeroHits: vi.fn(),
    consultAi: vi.fn(),
  };
});

const loginMock = vi.mocked(login);
const logoutMock = vi.mocked(logout);
const getMeMock = vi.mocked(getMe);
const listZeroHitsMock = vi.mocked(listZeroHits);
const consultAiMock = vi.mocked(consultAi);

const zeroHitItem = {
  id: "zero-hit-1",
  keyword: "wide ski boots",
  normalizedKeyword: "wide ski boots",
  hitCount: 12,
  priority: "HIGH",
  estimatedOpportunityLoss: 240000,
  firstSearchedAt: "2026-06-01T09:00:00+09:00",
  lastSearchedAt: "2026-06-04T10:00:00+09:00",
} as const;

describe("auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    listZeroHitsMock.mockResolvedValue({
      items: [zeroHitItem],
      summary: {
        zeroHitKeywordCount: 1,
        searchVolume: 12,
        estimatedOpportunityLoss: 240000,
      },
    });
    consultAiMock.mockResolvedValue({
      answer: "仕入れ候補として検討できます。",
      providerStatus: "LIVE",
    });
    logoutMock.mockResolvedValue();
  });

  it("stores token and navigates to dashboard after successful login", async () => {
    loginMock.mockResolvedValue({
      success: true,
      token: "token-123",
      user: { username: "admin", role: "ADMIN" },
    });

    render(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => expect(readAdminToken()).toBe("token-123"));
    expect(pushMock).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("treats success=false as authentication failure", async () => {
    loginMock.mockResolvedValue({
      success: false,
      token: "",
      user: { username: "admin", role: "ADMIN" },
    });

    render(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText("ユーザー名またはパスワードが正しくありません。"),
    ).toBeInTheDocument();
    expect(readAdminToken()).toBeNull();
  });

  it("shows login API error messages near the form", async () => {
    loginMock.mockRejectedValue(
      new ApiClientError({
        status: 401,
        message: "ログイン情報が正しくありません。",
      }),
    );

    render(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ログイン情報が正しくありません。",
    );
  });

  it("checks getMe before displaying the admin dashboard", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    expect(await screen.findByRole("heading", { name: "Zero Hit Radar" }))
      .toBeInTheDocument();
    expect(getMeMock).toHaveBeenCalledWith("token-123");
    expect(listZeroHitsMock).toHaveBeenCalledWith("token-123", {
      days: 30,
      sort: "lastSearchedAt,desc",
      limit: 50,
    });
    expect(await screen.findByText("wide ski boots")).toBeInTheDocument();
  });

  it("redirects unauthenticated dashboard visits to login", async () => {
    render(<AdminDashboardGuard />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("clears token and redirects on dashboard 401", async () => {
    saveAdminToken("token-123");
    getMeMock.mockRejectedValue(
      new ApiClientError({ status: 401, message: "Unauthorized" }),
    );

    render(<AdminDashboardGuard />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(readAdminToken()).toBeNull();
  });

  it("changes period query and refreshes zero-hit data", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");

    fireEvent.click(screen.getByRole("button", { name: "7 days" }));
    await waitFor(() =>
      expect(listZeroHitsMock).toHaveBeenLastCalledWith("token-123", {
        days: 7,
        sort: "lastSearchedAt,desc",
        limit: 50,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "更新" }));
    await waitFor(() => expect(listZeroHitsMock).toHaveBeenCalledTimes(3));
  });

  it("shows empty and retryable error states for zero-hit data", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });
    listZeroHitsMock.mockResolvedValueOnce({
      items: [],
      summary: {
        zeroHitKeywordCount: 0,
        searchVolume: 0,
        estimatedOpportunityLoss: 0,
      },
    });

    const { unmount } = render(<AdminDashboardGuard />);

    expect(await screen.findByText("Zero Hit はまだありません")).toBeInTheDocument();
    unmount();

    listZeroHitsMock.mockRejectedValueOnce(new Error("Backend unavailable"));
    render(<AdminDashboardGuard />);

    expect(await screen.findByText("Zero Hit データを取得できません"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });

  it("passes selected zero-hit keyword to the AI consultation target panel", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    fireEvent.click(screen.getByRole("button", { name: "AI 相談" }));

    expect(screen.getByText(/検索回数 12 回/)).toBeInTheDocument();
  });

  it("sends AI consultation request body for the selected keyword", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    fireEvent.click(screen.getByRole("button", { name: "AI 相談" }));
    fireEvent.change(screen.getByLabelText("質問"), {
      target: { value: "仕入れるべきですか？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() =>
      expect(consultAiMock).toHaveBeenCalledWith("token-123", {
        keyword: "wide ski boots",
        question: "仕入れるべきですか？",
        hitCount: 12,
        lastSearchedAt: "2026-06-04T10:00:00+09:00",
      }),
    );
    expect(await screen.findByText("Live AI")).toBeInTheDocument();
    expect(screen.getByText("仕入れ候補として検討できます。")).toBeInTheDocument();
  });

  it("keeps AI question text after consultation failure and allows retry", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });
    consultAiMock.mockRejectedValueOnce(new Error("AI unavailable"));

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    fireEvent.click(screen.getByRole("button", { name: "AI 相談" }));
    fireEvent.change(screen.getByLabelText("質問"), {
      target: { value: "代替商品は？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("AI unavailable");
    expect(screen.getByLabelText("質問")).toHaveValue("代替商品は？");

    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(consultAiMock).toHaveBeenCalledTimes(2));
  });

  it("clears token and redirects on AI consultation 401", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });
    consultAiMock.mockRejectedValue(
      new ApiClientError({ status: 401, message: "Unauthorized" }),
    );

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    fireEvent.click(screen.getByRole("button", { name: "AI 相談" }));
    fireEvent.change(screen.getByLabelText("質問"), {
      target: { value: "仕入れるべきですか？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(readAdminToken()).toBeNull();
  });

  it("removes the admin dashboard header link after token clear", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    expect(
      await screen.findByRole("link", { name: /Admin dashboard/ }),
    ).toBeInTheDocument();
    clearAdminToken();
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Admin dashboard/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows logout in the header for authenticated users and clears the session", async () => {
    saveAdminToken("token-123");
    getMeMock.mockResolvedValue({
      authenticated: true,
      user: { username: "admin", role: "ADMIN" },
    });

    render(<AdminDashboardGuard />);

    await screen.findByText("wide ski boots");
    expect(screen.queryByRole("link", { name: /Login/ })).not.toBeInTheDocument();

    const logoutLink = screen.getByRole("link", { name: /Logout/ });
    expect(logoutLink).toHaveAttribute("href", "/login");
    fireEvent.click(logoutLink);

    expect(readAdminToken()).toBeNull();
    await waitFor(() => expect(logoutMock).toHaveBeenCalledWith("token-123"));
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Admin dashboard/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
