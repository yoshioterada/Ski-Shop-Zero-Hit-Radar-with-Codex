import type { ApiError } from "@/types/api";

type QueryValue = string | number | boolean | null | undefined;

export type ApiQuery = Record<string, QueryValue>;

type ApiRequestOptions = {
  method?: "GET" | "POST";
  query?: ApiQuery;
  body?: unknown;
  token?: string;
};

export type ApiErrorUiBehavior =
  | { kind: "validation"; placement: "form" }
  | { kind: "unauthorized"; clearToken: true; redirectTo: "/login" }
  | { kind: "accessDenied" }
  | { kind: "notFound"; displayAs: "notFound" | "emptyState" }
  | { kind: "serviceError"; retryable: true }
  | { kind: "unknown"; retryable: false };

export class ApiClientError extends Error implements ApiError {
  status: number;
  code?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = error.status;
    if (error.code !== undefined) {
      this.code = error.code;
    }
  }
}

/** Returns the browser-resolvable backend URL used by all public client calls. */
export function getPublicApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

  if (isInternalDockerBackendUrl(baseUrl)) {
    throw new ApiClientError({
      status: 0,
      message:
        "NEXT_PUBLIC_API_BASE_URL must be browser-resolvable. Use http://localhost:8080 instead of http://backend:8080.",
      code: "INVALID_PUBLIC_API_BASE_URL",
    });
  }

  return baseUrl;
}

/** Builds an API URL while omitting empty query values. */
export function buildApiUrl(path: string, query?: ApiQuery): string {
  const baseUrl = getPublicApiBaseUrl();
  const url = new URL(path, ensureTrailingSlash(baseUrl));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/** Calls the backend and normalizes Spring ProblemDetail-style failures. */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token !== undefined && options.token.trim() !== "") {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const requestInit: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(buildApiUrl(path, options.query), requestInit);

  const payload = await readJsonPayload(response);

  if (!response.ok) {
    throw new ApiClientError(normalizeApiError(response.status, payload));
  }

  return payload as T;
}

/** Converts backend error payloads into messages that are safe to show in the UI. */
export function normalizeApiError(status: number, payload: unknown): ApiError {
  const objectPayload = isRecord(payload) ? payload : {};
  const message =
    getString(objectPayload.detail) ??
    getString(objectPayload.title) ??
    getString(objectPayload.message) ??
    fallbackMessageForStatus(status);
  const code = getString(objectPayload.code);

  return {
    status,
    message,
    ...(code === undefined ? {} : { code }),
  };
}

/** Maps normalized HTTP failures to the UI handling expected by the design. */
export function getApiErrorUiBehavior(
  error: ApiError,
  options: { notFoundDisplay?: "notFound" | "emptyState" } = {},
): ApiErrorUiBehavior {
  if (error.status === 400) {
    return { kind: "validation", placement: "form" };
  }

  if (error.status === 401) {
    return { kind: "unauthorized", clearToken: true, redirectTo: "/login" };
  }

  if (error.status === 403) {
    return { kind: "accessDenied" };
  }

  if (error.status === 404) {
    return {
      kind: "notFound",
      displayAs: options.notFoundDisplay ?? "notFound",
    };
  }

  if (error.status >= 500) {
    return { kind: "serviceError", retryable: true };
  }

  return { kind: "unknown", retryable: false };
}

async function readJsonPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const text = await response.text();
  if (text.trim() === "") {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: fallbackMessageForStatus(response.status) };
  }
}

function ensureTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function isInternalDockerBackendUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname === "backend";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value
    : undefined;
}

function fallbackMessageForStatus(status: number): string {
  if (status === 400) {
    return "入力内容を確認してください。";
  }

  if (status === 401) {
    return "ログインが必要です。";
  }

  if (status === 403) {
    return "この操作を実行する権限がありません。";
  }

  if (status === 404) {
    return "対象のデータが見つかりません。";
  }

  if (status >= 500) {
    return "サービスで問題が発生しました。時間をおいて再試行してください。";
  }

  return "リクエストを処理できませんでした。";
}
