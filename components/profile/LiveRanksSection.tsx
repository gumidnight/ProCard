"use client";

import {
  getRankColour,
  getRankHex,
  formatRankDisplay,
  formatLpRr,
  formatLastRefreshed,
  getFaceitLabel,
} from "@/lib/utils/rank";
import type { GameConnectionRow } from "@/types/db";

const GAME_LABELS: Record<string, string> = {
  lol: "League of Legends",
  valorant: "Valorant",
  cs2: "Counter-Strike 2",
};

const GAME_SHORT: Record<string, string> = {
  lol: "LoL",
  valorant: "VAL",
  cs2: "CS2",
};

interface RankCardProps {
  connection: GameConnectionRow;
}

export function RankCard({ connection }: RankCardProps) {
  const colour = connection.game === "cs2"
    ? getRankColour(
        connection.skill_level
          ? `FACEIT_${connection.skill_level}`
          : null,
      )
    : getRankColour(connection.rank_tier);

  const hex = connection.game === "cs2"
    ? getRankHex(
        connection.skill_level
          ? `FACEIT_${connection.skill_level}`
          : null,
      )
    : getRankHex(connection.rank_tier);

  const displayRank =
    connection.game === "cs2"
      ? getFaceitLabel(connection.skill_level)
      : formatRankDisplay(
          connection.rank_tier,
          connection.rank_division,
        );

  const lpDisplay = formatLpRr(connection.lp_rr, connection.game);

  return (
    <div
      className="group rounded-[10px] border p-4 transition-colors duration-[180ms] hover:border-border-default"
      style={{
        background: `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.05)`,
        borderColor: `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.18)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-border-subtle bg-bg-elevated">
            <span className="font-display text-[11px] font-bold tracking-wide text-text-secondary">
              {GAME_SHORT[connection.game] ?? "—"}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {GAME_LABELS[connection.game] ?? connection.game}
            </p>
            <p
              className="font-display text-lg font-bold tracking-[0.02em]"
              style={{ color: colour }}
            >
              {displayRank}
            </p>
          </div>
        </div>

        {lpDisplay && (
          <span
            className="rounded-md border px-2 py-0.5 font-mono text-xs"
            style={{
              color: colour,
              borderColor: `${hex}33`,
            }}
          >
            {lpDisplay}
          </span>
        )}
      </div>

      {/* Account name + queue */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
        <span className="font-mono">
          {connection.account_name ?? connection.faceit_nickname ?? ""}
        </span>
        <span>{formatLastRefreshed(connection.last_refreshed_at)}</span>
      </div>
    </div>
  );
}

interface LiveRanksSectionProps {
  connections: GameConnectionRow[];
}

export function LiveRanksSection({
  connections,
}: LiveRanksSectionProps) {
  if (connections.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        LIVE RANKS
      </p>
      <div className="flex flex-col gap-2">
        {connections.map((conn) => (
          <RankCard key={conn.id} connection={conn} />
        ))}
      </div>
    </section>
  );
}
