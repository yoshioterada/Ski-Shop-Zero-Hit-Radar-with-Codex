export type ProductDto = {
  id: string;
  manufacturer: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stockStatus: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  items: ProductDto[];
  totalCount: number;
};

export type ProductSearchResponse = {
  items: ProductDto[];
  totalCount: number;
  zeroHitRecorded: boolean;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type AdminUser = {
  username: string;
  role: "ADMIN";
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: AdminUser;
};

export type AuthMeResponse = {
  authenticated: boolean;
  user?: AdminUser;
};

export type ZeroHitPriority = "HIGH" | "MEDIUM" | "LOW";

export type ZeroHitItemDto = {
  id: string;
  keyword: string;
  normalizedKeyword: string;
  hitCount: number;
  priority: ZeroHitPriority;
  estimatedOpportunityLoss: number;
  firstSearchedAt: string;
  lastSearchedAt: string;
};

export type ZeroHitSummaryDto = {
  zeroHitKeywordCount: number;
  searchVolume: number;
  estimatedOpportunityLoss: number;
};

export type ZeroHitListResponse = {
  items: ZeroHitItemDto[];
  summary: ZeroHitSummaryDto;
};

export type AiConsultRequest = {
  keyword?: string;
  question: string;
  hitCount?: number;
  lastSearchedAt?: string;
};

export type AiProviderStatus = "LIVE" | "FALLBACK" | "ERROR";

export type AiConsultResponse = {
  answer: string;
  providerStatus: AiProviderStatus;
};

export type ApiError = {
  status: number;
  message: string;
  code?: string;
};
