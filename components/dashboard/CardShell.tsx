"use client";

import { useState, type ReactNode } from "react";

interface CardShellProps {
  title: string;
  subtitle?: string;
  icon?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export function CardShell({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
  rightSlot,
}: CardShellProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-bg-subtle/40"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <h3 className="font-display text-base font-semibold tracking-wide text-text-primary">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rightSlot}
          <span
            className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border-subtle px-5 py-5">
          {children}
        </div>
      )}
    </section>
  );
}
