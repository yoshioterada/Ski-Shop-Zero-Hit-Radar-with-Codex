"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./SearchBar.module.css";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  id?: string;
  loading?: boolean;
  label?: string;
  placeholder?: string;
};

/** Search form used by product pages and the top-page hero search. */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  id = "product-search-keyword",
  loading = false,
  label = "商品キーワード",
  placeholder = "スキー板、ブーツ、ゴーグルを検索",
}: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const keyword = value.trim();

    if (loading || keyword === "") {
      return;
    }

    onSubmit(keyword);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.controls}>
        <input
          id={id}
          className={styles.input}
          type="search"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          disabled={loading}
          aria-label={label}
        />
        <Button type="submit" isLoading={loading} disabled={value.trim() === ""}>
          <Search aria-hidden="true" size={18} />
          検索
        </Button>
      </div>
    </form>
  );
}
