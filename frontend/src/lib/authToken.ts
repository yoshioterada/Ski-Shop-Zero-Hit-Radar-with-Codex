const ADMIN_TOKEN_STORAGE_KEY = "codex-ski-shop-admin-token";
const ADMIN_TOKEN_CHANGE_EVENT = "codex-ski-shop-admin-token-change";

/** Stores the admin token for the current browser session only. */
export function saveAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  dispatchAdminTokenChange();
}

/** Reads the admin token used by protected dashboard API calls. */
export function readAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

/** Clears admin auth state after logout or a 401 response. */
export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  dispatchAdminTokenChange();
}

export function subscribeAdminTokenChange(listener: () => void): () => void {
  window.addEventListener(ADMIN_TOKEN_CHANGE_EVENT, listener);

  return () => window.removeEventListener(ADMIN_TOKEN_CHANGE_EVENT, listener);
}

function dispatchAdminTokenChange(): void {
  window.dispatchEvent(new Event(ADMIN_TOKEN_CHANGE_EVENT));
}
