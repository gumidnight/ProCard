"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "./Input";

interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  initialSuggestion?: string;
}

export function SlugInput({
  value,
  onChange,
  initialSuggestion,
}: SlugInputProps) {
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [error, setError] = useState<string>();

  const checkSlug = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setStatus("idle");
      setError(undefined);
      return;
    }

    setStatus("checking");
    try {
      const res = await fetch(
        `/api/profile/slug?slug=${encodeURIComponent(slug)}`,
      );
      const data = await res.json();

      if (data.error) {
        setStatus("invalid");
        setError(data.error);
      } else if (data.available) {
        setStatus("available");
        setError(undefined);
      } else {
        setStatus("taken");
        setError("This slug is already taken");
      }
    } catch {
      setStatus("idle");
    }
  }, []);

  // Debounced slug check
  useEffect(() => {
    if (!value || value.length < 3) return;

    const timer = setTimeout(() => {
      checkSlug(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, checkSlug]);

  // Set initial suggestion
  useEffect(() => {
    if (initialSuggestion && !value) {
      onChange(initialSuggestion);
    }
  }, [initialSuggestion, value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    onChange(raw.slice(0, 24));
  };

  const statusIndicator =
    status === "checking"
      ? "⏳"
      : status === "available"
        ? "✅"
        : status === "taken" || status === "invalid"
          ? "❌"
          : "";

  return (
    <div className="relative">
      <Input
        label="Profile URL"
        value={value}
        onChange={handleChange}
        placeholder="your-slug"
        error={error}
        hint={
          status === "available"
            ? "This slug is available!"
            : "rankcard.gg/" + (value || "your-slug")
        }
      />
      {statusIndicator && (
        <span className="absolute right-3 top-9 text-sm">
          {statusIndicator}
        </span>
      )}
    </div>
  );
}
