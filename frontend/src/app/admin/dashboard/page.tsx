import type { Metadata } from "next";
import { AdminDashboardGuard } from "./AdminDashboardGuard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Codex Ski Shop",
  description: "Protected Zero Hit Radar dashboard.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardGuard />;
}
