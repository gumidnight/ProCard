"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProCardMark } from "@/components/ui/ProCardLogo";

interface DashboardTopBarProps {
  username: string;
  avatarUrl: string | null;
  slug: string;
  baseUrl: string;
  active: "editor" | "appearance" | "analytics";
  /** Extra action buttons rendered before the avatar (e.g. preview toggle). */
  actions?: ReactNode;
}

const TABS = [
  { key: "editor", label: "Editor", href: "/dashboard" },
  { key: "appearance", label: "Appearance", href: "/dashboard/appearance" },
  { key: "analytics", label: "Analytics", href: "/dashboard/analytics" },
] as const;

export function DashboardTopBar({
  username,
  avatarUrl,
  slug,
  baseUrl,
  active,
  actions,
}: DashboardTopBarProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${baseUrl}/${slug}`;

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard may be blocked
    }
  }, [profileUrl]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-surface-0/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ProCardMark size={26} />
          <span className="font-display text-xl font-bold tracking-[0.06em] text-text-primary">
            PROCARD<span className="text-accent">.GG</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active === tab.key
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={copyUrl}
          className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-surface-1 px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary md:flex"
          title="Copy profile URL"
        >
          <span className="text-xs text-text-muted">{copied ? "✓" : "↗"}</span>
          <span>{copied ? "Copied!" : `procard.gg/${slug}`}</span>
        </button>

        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
        >
          View live →
        </a>

        {actions}

        {avatarUrl && (
          <Image
            src={avatarUrl}
            alt={username}
            width={32}
            height={32}
            className="rounded-full border border-border-subtle"
            unoptimized
          />
        )}

        <button
          onClick={handleLogout}
          className="text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
