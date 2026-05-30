"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DiscordLogo } from "@/components/ui/DiscordLogo";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Inline login dialog — keeps users on the landing page instead of routing
 * them to /login. Renders Discord OAuth as the only auth path.
 */
export function LoginDialog({ open, onClose }: LoginDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close login"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-[var(--radius-xl)] border border-border-default bg-surface-1 p-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]"
        style={{ animation: "fadeUp 240ms var(--ease-out)" }}
      >
        {/* Top accent strip */}
        <div
          aria-hidden
          className="absolute inset-x-8 top-0 h-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--accent), transparent)",
          }}
        />

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Sign in
          </p>
          <h2
            id="login-dialog-title"
            className="font-display text-2xl font-bold tracking-[0.02em] text-text-primary"
          >
            Claim your card
          </h2>
          <p className="text-[12px] text-text-muted">
            One link. Verified ranks. Built for scouts.
          </p>
        </div>

        {/* OAuth start: a real navigation to the API route, not client-side <Link>. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/discord"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-[#5865F2] px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#4752C4] active:scale-[0.98]"
        >
          <DiscordLogo size={18} />
          Continue with Discord
        </a>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-text-muted">
          We only access your username, avatar, and email.
          <br />
          No messages. No servers. No permissions.
        </p>
      </div>
    </div>
  );
}
