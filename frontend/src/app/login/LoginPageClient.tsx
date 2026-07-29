"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoginForm, type LoginFormValues } from "@/components/auth/LoginForm";
import { AppLayout } from "@/components/layout/AppLayout";
import { login } from "@/lib/api";
import { saveAdminToken } from "@/lib/authToken";
import styles from "./login.module.css";

export function LoginPageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleLogin(values: LoginFormValues): Promise<void> {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await login(values);

      if (!response.success) {
        setError("ユーザー名またはパスワードが正しくありません。");
        return;
      }

      saveAdminToken(response.token);
      router.push("/admin/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "ログインできませんでした。入力内容を確認してください。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppLayout>
      <section className={styles.loginShell} aria-labelledby="login-title">
        <div className={styles.brandPanel}>
          <ShieldCheck aria-hidden="true" size={34} />
          <p className={styles.eyebrow}>Zero Hit Radar</p>
          <h1 id="login-title">Codex Ski Shop 管理者ログイン</h1>
          <p>
            未充足検索を確認する管理者向けダッシュボードにアクセスします。
          </p>
        </div>
        <div className={styles.formPanel}>
          <LoginForm
            onSubmit={handleLogin}
            loading={isLoading}
            {...(error === undefined ? {} : { error })}
          />
        </div>
      </section>
    </AppLayout>
  );
}
