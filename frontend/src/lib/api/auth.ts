import { apiRequest } from "@/lib/api/client";
import { parseAuthMeResponse, parseLoginResponse } from "@/lib/api/validators";
import type { AuthMeResponse, LoginRequest, LoginResponse } from "@/types/api";

/** Authenticates an administrator and returns the backend-issued token. */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const payload = await apiRequest<unknown>("/api/auth/login", {
    method: "POST",
    body: request,
  });

  return parseLoginResponse(payload);
}

/** Verifies the current administrator token with the backend. */
export async function getMe(token: string): Promise<AuthMeResponse> {
  const payload = await apiRequest<unknown>("/api/auth/me", {
    token,
  });

  return parseAuthMeResponse(payload);
}

/** Revokes the current administrator token on the backend. */
export async function logout(token: string): Promise<void> {
  await apiRequest<Record<string, never>>("/api/auth/logout", {
    method: "POST",
    token,
  });
}
