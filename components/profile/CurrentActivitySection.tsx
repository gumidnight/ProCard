"use client";

import { Badge } from "@/components/ui/Badge";
import type { ProfileRow } from "@/types/db";

const GAME_SHORT: Record<string, string> = {
  lol: "LoL",
  valorant: "Valorant",
  cs2: "CS2",
};

interface CurrentActivitySectionProps {
  profile: ProfileRow;
}

/**
 * Shows the player's *current* situation, driven entirely by profile fields:
 * - status === "on_team" + team name → ActiveTeamCard with logo/league/role
 * - status === "open"                → FreeAgentCard with status_note
 *
 * Sits between Live Ranks and Competitive History on the public profile.
 */
export function CurrentActivitySection({ profile }: CurrentActivitySectionProps) {
  const note = profile.status_note?.trim() || null;
  const onTeam = profile.status === "on_team" && !!profile.current_team_name?.trim();

  if (!onTeam && profile.status !== "open" && !note) return null;

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        CURRENTLY
      </p>

      {onTeam ? (
        <ActiveTeamCard profile={profile} note={note} />
      ) : (
        <FreeAgentCard note={note} />
      )}
    </section>
  );
}

function ActiveTeamCard({ profile, note }: { profile: ProfileRow; note: string | null }) {
  const teamName = profile.current_team_name ?? "";
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-success/30 bg-success/5 p-4 transition-colors duration-[180ms] hover:border-success/60">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-success" />

      <div className="flex items-start gap-3">
        {profile.current_team_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.current_team_logo_url}
            alt={teamName}
            className="size-10 shrink-0 rounded-md border border-border-subtle bg-surface-2 object-contain p-0.5"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-2 font-display text-sm font-bold text-text-muted">
            {teamName.charAt(0).toUpperCase() || "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-success">
              <span
                className="size-1.5 rounded-full bg-success"
                style={{ animation: "livePulse 2s ease-in-out infinite" }}
              />
              Active
            </span>
          </div>

          <p className="mt-0.5 font-display text-sm font-semibold tracking-wide text-text-primary">
            {teamName}
          </p>

          {profile.current_league && (
            <p className="mt-0.5 text-xs text-text-secondary">{profile.current_league}</p>
          )}

          {(profile.current_role || profile.current_game) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {profile.current_role && <Badge>{profile.current_role}</Badge>}
              {profile.current_game && (
                <Badge>{GAME_SHORT[profile.current_game] ?? profile.current_game}</Badge>
              )}
            </div>
          )}

          {note && (
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FreeAgentCard({ note }: { note: string | null }) {
  return (
    <div className="rounded-[10px] border border-accent/30 bg-accent-soft p-4">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          Free Agent
        </span>
      </div>
      <p className="mt-1.5 text-sm text-text-primary">{note ?? "Open to offers"}</p>
    </div>
  );
}
