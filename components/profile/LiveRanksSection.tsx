"use client";

import {
  getRankColour,
  getRankHex,
  formatRankDisplay,
  formatLpRr,
  formatLastRefreshed,
  getFaceitLabel,
} from "@/lib/utils/rank";
import { GameLogo } from "@/components/ui/GameLogo";
import { RankEmblem } from "@/components/ui/RankEmblem";
import { withAlpha } from "@/lib/utils/color";
import type { GameConnectionRow } from "@/types/db";

const GAME_LABELS: Record<string, string> = {
  lol: "League of Legends",
  valorant: "Valorant",
  cs2: "Counter-Strike 2",
};

interface RankCardProps {
  connection: GameConnectionRow;
}

export function RankCard({ connection: c }: RankCardProps) {
  const isCs2 = c.game === "cs2";
  const rankKey = isCs2 && c.skill_level ? `FACEIT_${c.skill_level}` : c.rank_tier;
  const hex = getRankHex(rankKey);
  const colour = getRankColour(rankKey);
  const display = isCs2
    ? getFaceitLabel(c.skill_level)
    : formatRankDisplay(c.rank_tier, c.rank_division);
  const lp = formatLpRr(c.lp_rr, c.game);

  return (
    <article
      className="group relative overflow-hidden rounded-[var(--radius-lg)] border bg-surface-1 transition-colors duration-200 hover:bg-surface-2"
      style={{ borderColor: withAlpha(hex, 0.22) }}
    >
      {/* Left tier rail */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: colour }}
      />

      {/* Halo behind the emblem */}
      <div
        aria-hidden
        className="absolute right-0 top-0 h-full w-1/2 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]"
        style={{
          background: `radial-gradient(circle at 80% 50%, ${withAlpha(hex, 0.35)}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center gap-3 p-4">
        <RankEmblem
          tier={c.rank_tier}
          skillLevel={c.skill_level}
          game={c.game}
          size={56}
        />

        <div className="min-w-0 flex-1">
          {/* Top row: game label  +  LIVE pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <GameLogo game={c.game} size={12} className="shrink-0 opacity-70" />
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                {GAME_LABELS[c.game] ?? c.game}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">
              <span
                className="size-1.5 rounded-full bg-success"
                style={{ animation: "livePulse 2s ease-in-out infinite" }}
              />
              Live
            </span>
          </div>

          {/* Rank value */}
          <p
            className="mt-1 truncate font-display text-[24px] font-bold leading-none tracking-[0.02em] tabular-nums"
            style={{ color: colour }}
          >
            {display ?? "Unranked"}
          </p>

          {/* Account · LP · updated */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="min-w-0 flex-1 truncate font-mono">
              {c.account_name ?? c.faceit_nickname ?? "—"}
            </span>
            {lp && (
              <>
                <span aria-hidden>·</span>
                <span
                  className="shrink-0 font-mono tabular-nums"
                  style={{ color: withAlpha(colour, 0.85) }}
                >
                  {lp}
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span className="shrink-0 font-mono text-[10px]">
              {formatLastRefreshed(c.last_refreshed_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

interface LiveRanksSectionProps {
  connections: GameConnectionRow[];
}

export function LiveRanksSection({ connections }: LiveRanksSectionProps) {
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
