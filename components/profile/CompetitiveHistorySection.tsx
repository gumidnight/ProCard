"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { RoleIcon } from "@/components/ui/RoleIcon";
import { lolPosition } from "@/lib/utils/lol-roles";
import type { TeamHistoryRow } from "@/types/db";

const GAME_SHORT: Record<string, string> = {
  lol: "LoL",
  valorant: "Valorant",
  cs2: "CS2",
};

const INITIAL_VISIBLE = 3;

interface TeamHistoryItemProps {
  entry: TeamHistoryRow;
}

function TeamHistoryItem({ entry }: TeamHistoryItemProps) {
  const dateRange = [entry.start_date, entry.end_date ?? "Present"]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface-1 p-4 transition-colors duration-[180ms] hover:border-border-default">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          {entry.org_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.org_logo_url}
              alt={entry.org_name}
              className="size-10 shrink-0 rounded-md border border-border-subtle bg-surface-2 object-contain p-0.5"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-2 font-display text-sm font-bold text-text-muted">
              {entry.org_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold tracking-wide text-text-primary">
              {entry.org_name}
            </p>
            {entry.tournament_name && (
              <p className="mt-0.5 text-xs text-text-secondary">
                {entry.tournament_name}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {entry.role &&
                (() => {
                  const pos = entry.game === "lol" ? lolPosition(entry.role) : null;
                  return (
                    <Badge className={pos ? "gap-1.5" : ""}>
                      {pos && <RoleIcon position={pos} size={13} />}
                      {entry.role}
                    </Badge>
                  );
                })()}
              <Badge>{GAME_SHORT[entry.game] ?? entry.game}</Badge>
            </div>
          </div>
        </div>
        {dateRange && (
          <span className="shrink-0 text-xs text-text-muted">{dateRange}</span>
        )}
      </div>
      {entry.result_note && (
        <p className="mt-2 text-xs italic text-text-secondary">{entry.result_note}</p>
      )}
    </div>
  );
}

interface CompetitiveHistorySectionProps {
  entries: TeamHistoryRow[];
}

export function CompetitiveHistorySection({ entries }: CompetitiveHistorySectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  // Sort newest → oldest. Entries without a start_date sink to the bottom.
  const sorted = [...entries].sort((a, b) => {
    const aDate = a.start_date ?? "";
    const bDate = b.start_date ?? "";
    if (aDate === bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return bDate.localeCompare(aDate);
  });

  const hasOverflow = sorted.length > INITIAL_VISIBLE;
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sorted.length - INITIAL_VISIBLE;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          COMPETITIVE HISTORY
        </p>
        <span className="rounded-full bg-surface-1 px-2 py-0.5 text-[10px] text-text-muted">
          {sorted.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {visible.map((entry) => (
          <TeamHistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-center rounded-full border border-border-subtle bg-surface-1 px-4 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      )}
    </section>
  );
}
