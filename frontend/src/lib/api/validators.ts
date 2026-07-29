import { ApiClientError } from "@/lib/api/client";
import type {
  AdminUser,
  AiConsultResponse,
  AuthMeResponse,
  LoginResponse,
  ProductDto,
  ProductListResponse,
  ProductSearchResponse,
  ZeroHitItemDto,
  ZeroHitListResponse,
  ZeroHitPriority,
  ZeroHitSummaryDto,
} from "@/types/api";

export function parseProductListResponse(value: unknown): ProductListResponse {
  const payload = expectRecord(value, "ProductListResponse");

  return {
    items: expectArray(payload.items, "ProductListResponse.items").map(
      parseProductDto,
    ),
    totalCount: expectNumber(
      payload.totalCount,
      "ProductListResponse.totalCount",
    ),
  };
}

export function parseProductSearchResponse(
  value: unknown,
): ProductSearchResponse {
  const payload = expectRecord(value, "ProductSearchResponse");

  return {
    items: expectArray(payload.items, "ProductSearchResponse.items").map(
      parseProductDto,
    ),
    totalCount: expectNumber(
      payload.totalCount,
      "ProductSearchResponse.totalCount",
    ),
    zeroHitRecorded: expectBoolean(
      payload.zeroHitRecorded,
      "ProductSearchResponse.zeroHitRecorded",
    ),
  };
}

export function parseLoginResponse(value: unknown): LoginResponse {
  const payload = expectRecord(value, "LoginResponse");

  return {
    success: expectBoolean(payload.success, "LoginResponse.success"),
    token: expectString(payload.token, "LoginResponse.token"),
    user: parseAdminUser(payload.user, "LoginResponse.user"),
  };
}

export function parseAuthMeResponse(value: unknown): AuthMeResponse {
  const payload = expectRecord(value, "AuthMeResponse");
  const authenticated = expectBoolean(
    payload.authenticated,
    "AuthMeResponse.authenticated",
  );

  if (payload.user === undefined) {
    return { authenticated };
  }

  return {
    authenticated,
    user: parseAdminUser(payload.user, "AuthMeResponse.user"),
  };
}

export function parseZeroHitListResponse(value: unknown): ZeroHitListResponse {
  const payload = expectRecord(value, "ZeroHitListResponse");

  return {
    items: expectArray(payload.items, "ZeroHitListResponse.items").map(
      parseZeroHitItemDto,
    ),
    summary: parseZeroHitSummaryDto(payload.summary),
  };
}

export function parseAiConsultResponse(value: unknown): AiConsultResponse {
  const payload = expectRecord(value, "AiConsultResponse");

  return {
    answer: expectString(payload.answer, "AiConsultResponse.answer"),
    providerStatus: parseAiProviderStatus(payload.providerStatus),
  };
}

function parseProductDto(value: unknown): ProductDto {
  const payload = expectRecord(value, "ProductDto");
  const product: ProductDto = {
    id: expectString(payload.id, "ProductDto.id"),
    manufacturer: expectString(payload.manufacturer, "ProductDto.manufacturer"),
    name: expectString(payload.name, "ProductDto.name"),
    category: expectString(payload.category, "ProductDto.category"),
    description: expectString(payload.description, "ProductDto.description"),
    price: expectNumber(payload.price, "ProductDto.price"),
    stockStatus: expectString(payload.stockStatus, "ProductDto.stockStatus"),
    createdAt: expectString(payload.createdAt, "ProductDto.createdAt"),
    updatedAt: expectString(payload.updatedAt, "ProductDto.updatedAt"),
  };

  if (payload.imageUrl !== undefined) {
    product.imageUrl = expectNullableString(payload.imageUrl, "ProductDto.imageUrl");
  }

  return product;
}

function parseAdminUser(value: unknown, label: string): AdminUser {
  const payload = expectRecord(value, label);
  const role = expectString(payload.role, `${label}.role`);

  if (role !== "ADMIN") {
    throwInvalidResponse(`${label}.role must be ADMIN`);
  }

  return {
    username: expectString(payload.username, `${label}.username`),
    role,
  };
}

function parseZeroHitItemDto(value: unknown): ZeroHitItemDto {
  const payload = expectRecord(value, "ZeroHitItemDto");

  return {
    id: expectString(payload.id, "ZeroHitItemDto.id"),
    keyword: expectString(payload.keyword, "ZeroHitItemDto.keyword"),
    normalizedKeyword: expectString(
      payload.normalizedKeyword,
      "ZeroHitItemDto.normalizedKeyword",
    ),
    hitCount: expectNumber(payload.hitCount, "ZeroHitItemDto.hitCount"),
    priority: parseZeroHitPriority(payload.priority),
    estimatedOpportunityLoss: expectNumber(
      payload.estimatedOpportunityLoss,
      "ZeroHitItemDto.estimatedOpportunityLoss",
    ),
    firstSearchedAt: expectString(
      payload.firstSearchedAt,
      "ZeroHitItemDto.firstSearchedAt",
    ),
    lastSearchedAt: expectString(
      payload.lastSearchedAt,
      "ZeroHitItemDto.lastSearchedAt",
    ),
  };
}

function parseZeroHitSummaryDto(value: unknown): ZeroHitSummaryDto {
  const payload = expectRecord(value, "ZeroHitSummaryDto");

  return {
    zeroHitKeywordCount: expectNumber(
      payload.zeroHitKeywordCount,
      "ZeroHitSummaryDto.zeroHitKeywordCount",
    ),
    searchVolume: expectNumber(
      payload.searchVolume,
      "ZeroHitSummaryDto.searchVolume",
    ),
    estimatedOpportunityLoss: expectNumber(
      payload.estimatedOpportunityLoss,
      "ZeroHitSummaryDto.estimatedOpportunityLoss",
    ),
  };
}

function parseZeroHitPriority(value: unknown): ZeroHitPriority {
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") {
    return value;
  }

  throwInvalidResponse("ZeroHitItemDto.priority must be HIGH, MEDIUM, or LOW");
}

function parseAiProviderStatus(
  value: unknown,
): AiConsultResponse["providerStatus"] {
  if (value === "LIVE" || value === "FALLBACK" || value === "ERROR") {
    return value;
  }

  throwInvalidResponse(
    "AiConsultResponse.providerStatus must be LIVE, FALLBACK, or ERROR",
  );
}

function expectRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throwInvalidResponse(`${label} must be an object`);
}

function expectArray(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  throwInvalidResponse(`${label} must be an array`);
}

function expectString(value: unknown, label: string): string {
  if (typeof value === "string") {
    return value;
  }

  throwInvalidResponse(`${label} must be a string`);
}

function expectNullableString(value: unknown, label: string): string | null {
  if (value === null || typeof value === "string") {
    return value;
  }

  throwInvalidResponse(`${label} must be a string or null`);
}

function expectNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throwInvalidResponse(`${label} must be a finite number`);
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throwInvalidResponse(`${label} must be a boolean`);
}

function throwInvalidResponse(message: string): never {
  throw new ApiClientError({
    status: 0,
    message: `Backend response shape is invalid: ${message}.`,
    code: "INVALID_API_RESPONSE",
  });
}
