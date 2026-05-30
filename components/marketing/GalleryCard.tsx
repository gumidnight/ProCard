import Link from "next/link";
import { GameLogo } from "@/components/ui/GameLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Flag } from "@/components/ui/Flag";
import { formatRankDisplay, getFaceitLabel, getRankColour } from "@/lib/utils/rank";
import type { DemoProfileBundle } from "@/lib/constants/demo-profiles";

interface GalleryCardProps {
  bundle: DemoProfileBundle;
}

// Map persona role → DiceBear style so each card feels distinct
const STYLE_BY_ROLE: Record<string, string> = {
  player: "bottts-neutral",
  coach: "notionists-neutral",
  caster: "personas",
  analyst: "lorelei",
};

function avatarFor(bundle: DemoProfileBundle): string {
  if (bundle.avatarUrl) return bundle.avatarUrl;
  const style =
    STYLE_BY_ROLE[bundle.profile.esports_role ?? "player"] ?? "bottts-neutral";
  const seed = encodeURIComponent(bundle.profile.slug);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=1C2029&radius=50`;
}

export function GalleryCard({ bundle }: GalleryCardProps) {
  const top = bundle.connections[0] ?? null;
  const rankKey =
    top && top.game === "cs2" && top.skill_level
      ? `FACEIT_${top.skill_level}`
      : (top?.rank_tier ?? null);
  const colour = top ? getRankColour(rankKey) : "var(--text-muted)";
  const display = top
    ? top.game === "cs2"
      ? getFaceitLabel(top.skill_level)
      : formatRankDisplay(top.rank_tier, top.rank_division)
    : null;
  const avatarUrl = avatarFor(bundle);

  return (
    <Link
      href={`/${bundle.profile.slug}`}
      className="group relative block w-[300px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-1 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2 hover:shadow-[0_12px_32px_-16px_rgba(255,92,0,0.4)]"
    >
      {/* Top accent strip on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex items-center gap-3">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            width={44}
            height={44}
            loading="lazy"
            className="size-full object-cover"
          />
          {/* accent ring on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent/0 transition-all duration-300 group-hover:ring-accent/60"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-bold tracking-[0.02em] text-text-primary">
            {bundle.profile.display_name}
            {bundle.profile.country && (
              <span className="ml-1.5 inline-flex items-center">
                <Flag code={bundle.profile.country} size={14} />
              </span>
            )}
          </p>
          {bundle.profile.tagline && (
            <p className="truncate font-mono text-[11px] text-text-muted">
              {bundle.profile.tagline}
            </p>
          )}
        </div>
      </div>

      {top && (
        <div className="mt-3 flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle bg-surface-0 px-3 py-2">
          <div className="flex items-center gap-2">
            <GameLogo game={top.game} size={16} />
            <span
              className="font-display text-[14px] font-bold tabular-nums"
              style={{ color: colour }}
            >
              {display ?? "Unranked"}
            </span>
          </div>
          <StatusBadge status={bundle.profile.status} />
        </div>
      )}

      <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
        View →
      </p>
    </Link>
  );
}
