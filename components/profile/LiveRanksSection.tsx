"use client";

import {
  getRankColour,
  formatRankDisplay,
  formatLpRr,
  formatLastRefreshed,
  getFaceitLabel,
} from "@/lib/utils/rank";
import type { GameConnectionRow } from "@/types/db";

const GAME_LABELS: Record<string, string> = {
  lol: "League of Legends",
  valorant: "Valorant",
  cs2: "CS2",
};

const GAME_ICONS: Record<string, string> = {
  lol: "🎮",
  valorant: "🎯",
  cs2: "🔫",
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

  const displayRank =
    connection.game === "cs2"
      ? getFaceitLabel(connection.skill_level)
      : formatRankDisplay(
          connection.rank_tier,
          connection.rank_division,
        );

  const lpDisplay = formatLpRr(connection.lp_rr, connection.game);

  return (
    <div className="group rounded-xl border border-border-subtle bg-bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {GAME_ICONS[connection.game] ?? "🎮"}
          </span>
          <div>
            <p className="text-xs text-text-muted">
              {GAME_LABELS[connection.game] ?? connection.game}
            </p>
            <p
              className="font-display text-lg font-bold tracking-wide"
              style={{ color: colour }}
            >
              {displayRank}
            </p>
          </div>
        </div>

        {lpDisplay && (
          <span
            className="rounded-md border px-2 py-0.5 text-xs font-medium"
            style={{
              color: colour,
              borderColor: `${colour}33`,
            }}
          >
            {lpDisplay}
          </span>
        )}
      </div>

      {/* Account name + queue */}
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span>
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
      <h2 className="font-display text-lg font-semibold tracking-wide text-text-secondary">
        Live Ranks
      </h2>
      <div className="flex flex-col gap-2">
        {connections.map((conn) => (
          <RankCard key={conn.id} connection={conn} />
        ))}
      </div>
    </section>
  );
}
