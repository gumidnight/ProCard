"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      hint,
      charCount = false,
      maxLength,
      value,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength =
      typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-text-secondary"
            >
              {label}
            </label>
            {charCount && maxLength && (
              <span className="text-xs text-text-muted">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={`rounded-lg border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors resize-none ${
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-border-subtle focus:border-border-strong"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
