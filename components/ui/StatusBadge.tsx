"use client";

import type { ProfileStatus } from "@/types/db";

const STATUS_CONFIG: Record<
  ProfileStatus,
  { label: string; dotColour: string; classes: string }
> = {
  open: {
    label: "Open to offers",
    dotColour: "var(--color-success)",
    classes: "bg-success/10 text-success border-success/20",
  },
  on_team: {
    label: "On a team",
    dotColour: "var(--color-info)",
    classes: "bg-info/10 text-info border-info/20",
  },
  not_looking: {
    label: "Not looking",
    dotColour: "var(--text-muted)",
    classes: "bg-white/4 text-text-muted border-border-subtle",
  },
};

export function StatusBadge({ status }: { status: ProfileStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${config.classes}`}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dotColour }}
      />
      {config.label}
    </span>
  );
}
