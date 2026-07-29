import type { Metadata } from "next";
import { LoginPageClient } from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Admin Login | Codex Ski Shop",
  description: "Administrator login for Codex Ski Shop Zero Hit Radar.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
