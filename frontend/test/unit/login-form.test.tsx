// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  it("accepts username and password and submits values", () => {
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(onSubmit).toHaveBeenCalledWith({
      username: "admin",
      password: "secret",
    });
  });

  it("shows loading disabled state and error message", () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        loading
        error="ユーザー名またはパスワードが正しくありません。"
      />,
    );

    expect(screen.getByRole("button", { name: "ログイン" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "ユーザー名またはパスワードが正しくありません。",
    );
  });
});
