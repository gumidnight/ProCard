"use client";

import { ArrowRight } from "lucide-react";

interface OpenLoginButtonProps {
  children?: React.ReactNode;
  variant?: "primary" | "ghost";
  withArrow?: boolean;
  className?: string;
}

/**
 * Dispatches the global `procard:open-login` event picked up by MarketingNav,
 * so any CTA on the landing page can open the inline login dialog.
 */
export function OpenLoginButton({
  children = "Create your card",
  variant = "primary",
  withArrow = true,
  className,
}: OpenLoginButtonProps) {
  const open = () => window.dispatchEvent(new CustomEvent("procard:open-login"));

  const base =
    "group inline-flex items-center gap-2 rounded-[var(--radius-md)] text-[14px] font-semibold transition-all";
  const styles =
    variant === "primary"
      ? "bg-accent px-5 py-3 text-[var(--accent-on)] shadow-[0_8px_24px_-12px_rgba(255,92,0,0.6)] hover:bg-accent-hover hover:shadow-[0_12px_32px_-12px_rgba(255,92,0,0.8)]"
      : "border border-border-default px-5 py-3 text-text-secondary hover:bg-surface-2 hover:text-text-primary";

  return (
    <button
      type="button"
      onClick={open}
      className={`${base} ${styles} ${className ?? ""}`}
    >
      {children}
      {withArrow && (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}
