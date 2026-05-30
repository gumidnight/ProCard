"use client";

import { Eye, Heart, MessageSquare, MousePointerClick } from "lucide-react";
import type { ProfileAnalytics } from "@/lib/db/engagement";

interface AnalyticsCardProps {
  analytics: ProfileAnalytics;
}

const STATS = [
  { key: "views", label: "Views", Icon: Eye },
  { key: "likes", label: "Likes", Icon: Heart },
  { key: "comments", label: "Comments", Icon: MessageSquare },
  { key: "socialClicks", label: "Clicks", Icon: MousePointerClick },
] as const;

/**
 * Minimal analytics strip — a single slim row of headline numbers.
 * Sits inline in the dashboard editor stack.
 */
export function AnalyticsCard({ analytics }: AnalyticsCardProps) {
  return (
    <section className="grid grid-cols-4 divide-x divide-border-subtle rounded-[10px] border border-border-subtle bg-surface-1">
      {STATS.map(({ key, label, Icon }) => (
        <div key={key} className="flex flex-col items-center gap-1 px-2 py-4">
          <Icon className="size-3.5 text-text-muted" aria-hidden />
          <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
            {analytics[key].toLocaleString()}
          </span>
          <span className="text-[11px] uppercase tracking-[0.1em] text-text-muted">
            {label}
          </span>
        </div>
      ))}
    </section>
  );
}
