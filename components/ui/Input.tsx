"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-[7px] border bg-surface-2 px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 ${
            error
              ? "border-danger/50 focus:border-danger"
              : "border-border-subtle focus:border-accent/50"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="font-mono text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
