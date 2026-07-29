"use client";

import { FormEvent, useState } from "react";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./LoginForm.module.css";

export type LoginFormValues = {
  username: string;
  password: string;
};

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void;
  loading?: boolean;
  error?: string;
};

/** Administrator login form with validation and duplicate-submit prevention. */
export function LoginForm({ onSubmit, loading = false, error }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = username.trim() !== "" && password !== "" && !loading;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      username: username.trim(),
      password,
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="admin-username">Username</label>
        <div className={styles.inputWrap}>
          <User aria-hidden="true" size={18} />
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            disabled={loading}
            onChange={(event) => setUsername(event.currentTarget.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="admin-password">Password</label>
        <div className={styles.inputWrap}>
          <Lock aria-hidden="true" size={18} />
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={loading}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" isLoading={loading} disabled={!canSubmit}>
        ログイン
      </Button>
    </form>
  );
}
