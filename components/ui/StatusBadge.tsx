"use client";

import type { ProfileStatus } from "@/types/db";

const STATUS_CONFIG: Record<
  ProfileStatus,
  { label: string; dotColour: string }
> = {
  open: { label: "Open to offers", dotColour: "#22c55e" },
  on_team: { label: "On a team", dotColour: "#3b82f6" },
  not_looking: { label: "Not looking", dotColour: "#64748b" },
};

export function StatusBadge({ status }: { status: ProfileStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: config.dotColour }}
      />
      {config.label}
    </span>
  );
}
