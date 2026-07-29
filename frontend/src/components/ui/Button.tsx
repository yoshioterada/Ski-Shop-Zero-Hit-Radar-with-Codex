import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
};

/** Accessible action button with consistent disabled and loading states. */
export function Button({
  children,
  variant = "primary",
  isLoading = false,
  icon,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      className={[styles.button, styles[variant], props.className]
        .filter(Boolean)
        .join(" ")}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}
