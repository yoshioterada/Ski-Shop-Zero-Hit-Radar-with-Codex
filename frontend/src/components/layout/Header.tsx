"use client";

import { useSyncExternalStore } from "react";
import { BarChart3, LogIn, LogOut, PackageSearch, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/api";
import {
  clearAdminToken,
  readAdminToken,
  subscribeAdminTokenChange,
} from "@/lib/authToken";
import styles from "./Header.module.css";

type HeaderProps = {
  isAdmin?: boolean;
};

/** Main storefront navigation with an admin dashboard link after authentication. */
export function Header({ isAdmin = false }: HeaderProps) {
  const hasAdminSession =
    useSyncExternalStore(subscribeToStorage, getAdminSnapshot, () => false) ||
    isAdmin;

  function handleLogout(): void {
    const token = readAdminToken();
    clearAdminToken();
    if (token !== null) {
      void logout(token).catch(() => {
        // Local session state is already cleared; backend failures should not trap users in the UI.
      });
    }
  }

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Codex Ski Shop home">
        <ShoppingBag aria-hidden="true" size={22} />
        <span>Codex Ski Shop</span>
      </Link>
      <nav className={styles.nav} aria-label="Primary navigation">
        <Link href="/">Home</Link>
        <Link href="/products">
          <PackageSearch aria-hidden="true" size={17} />
          <span>Products</span>
        </Link>
        {hasAdminSession ? (
          <Link href="/login" onClick={handleLogout}>
            <LogOut aria-hidden="true" size={17} />
            <span>Logout</span>
          </Link>
        ) : (
          <Link href="/login">
            <LogIn aria-hidden="true" size={17} />
            <span>Login</span>
          </Link>
        )}
        {hasAdminSession ? (
          <Link href="/admin/dashboard">
            <BarChart3 aria-hidden="true" size={17} />
            <span>Admin dashboard</span>
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

function subscribeToStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  const unsubscribeAdminTokenChange = subscribeAdminTokenChange(onStoreChange);
  queueMicrotask(onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    unsubscribeAdminTokenChange();
  };
}

function getAdminSnapshot(): boolean {
  return readAdminToken() !== null;
}
