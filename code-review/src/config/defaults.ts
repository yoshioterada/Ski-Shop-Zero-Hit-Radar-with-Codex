import type { AppOptions } from "../agents/agent-types.js";

export const DEFAULT_CONCURRENCY = 7;
export const DEFAULT_TIMEOUT_MS = 900_000;
export const DEFAULT_AGENTS = "full";
export const DEFAULT_FORMAT: AppOptions["format"] = "both";
export const DEFAULT_FAIL_ON: AppOptions["failOn"] = "critical";
export const DEFAULT_REASONING: NonNullable<AppOptions["modelReasoningEffort"]> = "high";
export const DEFAULT_SANDBOX: NonNullable<AppOptions["sandboxMode"]> = "read-only";
export const DEFAULT_WEB_SEARCH: NonNullable<AppOptions["webSearchMode"]> = "disabled";
