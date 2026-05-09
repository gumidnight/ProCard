"use client";

import { Badge } from "@/components/ui/Badge";
import type { TeamHistoryRow } from "@/types/db";

const GAME_SHORT: Record<string, string> = {
  lol: "LoL",
  valorant: "Valorant",
  cs2: "CS2",
};

interface TeamHistoryItemProps {
  entry: TeamHistoryRow;
}

function TeamHistoryItem({ entry }: TeamHistoryItemProps) {
  const dateRange = [entry.start_date, entry.end_date ?? "Present"]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-text-primary">
            {entry.org_name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {entry.role && <Badge>{entry.role}</Badge>}
            <Badge>{GAME_SHORT[entry.game] ?? entry.game}</Badge>
          </div>
        </div>
        {dateRange && (
          <span className="text-xs text-text-muted">{dateRange}</span>
        )}
      </div>
      {entry.result_note && (
        <p className="mt-2 text-xs italic text-text-secondary">
          {entry.result_note}
        </p>
      )}
    </div>
  );
}

interface CompetitiveHistorySectionProps {
  entries: TeamHistoryRow[];
}

export function CompetitiveHistorySection({
  entries,
}: CompetitiveHistorySectionProps) {
  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold tracking-wide text-text-secondary">
        Competitive History
      </h2>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <TeamHistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
