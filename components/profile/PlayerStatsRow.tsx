import {
  getRankColour,
  formatRankDisplay,
  formatLpRr,
  getFaceitLabel,
} from "@/lib/utils/rank";
import { RankEmblem } from "@/components/ui/RankEmblem";
import type { GameConnectionRow, ProfileRow, RolePlayedRow } from "@/types/db";

interface PlayerStatsRowProps {
  connections: GameConnectionRow[];
  rolesPlayed: RolePlayedRow[];
  profile: ProfileRow;
}

/** "euw1" → "EUW", "na1" → "NA", "kr" → "KR". */
function formatRegion(region: string | null): string | null {
  if (!region) return null;
  const cleaned = region.trim().toUpperCase().replace(/\d+$/, "");
  return cleaned || null;
}

function pickPrimaryConnection(
  connections: GameConnectionRow[],
): GameConnectionRow | null {
  if (connections.length === 0) return null;
  return connections.find((c) => c.is_visible) ?? connections[0];
}

function resolveRole(
  rolesPlayed: RolePlayedRow[],
  profile: ProfileRow,
  game: string | null,
): string | null {
  const forGame = game ? rolesPlayed.filter((r) => r.game === game) : rolesPlayed;
  const pool = forGame.length > 0 ? forGame : rolesPlayed;
  const main = pool.find((r) => r.is_main) ?? pool[0];
  return main?.role ?? profile.current_role ?? null;
}

/**
 * Compact headline stats strip: RANK · PEAK · ROLE (· REGION) for the player's
 * primary connected game. Degrades gracefully to role-only / "Unranked" when
 * there are no connections.
 */
export function PlayerStatsRow({
  connections,
  rolesPlayed,
  profile,
}: PlayerStatsRowProps) {
  const primary = pickPrimaryConnection(connections);
  const isCs2 = primary?.game === "cs2";

  const rankValue = primary
    ? isCs2
      ? getFaceitLabel(primary.skill_level)
      : formatRankDisplay(primary.rank_tier, primary.rank_division)
    : "Unranked";

  const rankKey =
    isCs2 && primary?.skill_level
      ? `FACEIT_${primary.skill_level}`
      : (primary?.rank_tier ?? null);
  const rankColour = getRankColour(rankKey);
  const lp = primary ? formatLpRr(primary.lp_rr, primary.game) : "";

  const peakValue =
    primary && primary.peak_rank_tier
      ? formatRankDisplay(primary.peak_rank_tier, primary.peak_rank_division)
      : null;

  const role = resolveRole(rolesPlayed, profile, primary?.game ?? null);
  const region = formatRegion(primary?.region ?? null);

  // Nothing meaningful to show at all → render a minimal "Unranked" strip.
  return (
    <div className="flex items-stretch overflow-hidden rounded-[8px] border border-border-subtle bg-surface-2/40">
      {/* RANK */}
      <div className="flex min-w-0 flex-[1.5] items-center gap-2.5 px-3 py-2.5">
        {primary && (
          <RankEmblem
            tier={primary.rank_tier}
            skillLevel={primary.skill_level}
            game={primary.game}
            size={34}
            className="shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Rank
          </p>
          <p
            className="truncate font-display text-[15px] font-bold leading-tight tracking-[0.02em]"
            style={{ color: rankColour }}
          >
            {rankValue}
          </p>
          {lp && (
            <p className="truncate font-mono text-[10px] leading-tight text-text-muted">
              {lp}
            </p>
          )}
        </div>
      </div>

      {peakValue && (
        <StatCell label="Peak">
          <span className="font-display text-[15px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            {peakValue}
          </span>
        </StatCell>
      )}

      {role && (
        <StatCell label="Role">
          <span className="font-display text-[15px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            {role}
          </span>
        </StatCell>
      )}

      {region && (
        <StatCell label="Region">
          <span className="font-mono text-[13px] font-medium leading-tight tracking-[0.04em] text-text-secondary">
            {region}
          </span>
        </StatCell>
      )}
    </div>
  );
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-l border-border-subtle px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <span className="truncate">{children}</span>
    </div>
  );
}
