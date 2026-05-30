"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Flag } from "@/components/ui/Flag";
import { VerifiedBadge } from "@/components/ui/ProCardLogo";
import { getCountryName } from "@/lib/utils/country";
import { parseRoles, getRoleLabel } from "@/lib/utils/esports-roles";
import { MiniMarkdown } from "@/components/ui/MiniMarkdown";
import type { ProfileRow, RolePlayedRow } from "@/types/db";

interface ProfileHeaderProps {
  profile: ProfileRow;
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
  /** Lift the avatar up so it overlaps the banner strip above it. */
  avatarOverlap?: boolean;
}

export function ProfileHeader({
  profile,
  rolesPlayed,
  avatarUrl,
  avatarOverlap = false,
}: ProfileHeaderProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        avatarOverlap ? "-mt-14 gap-4" : "gap-5"
      }`}
    >
      {/* Avatar — overlaps the banner bottom edge when avatarOverlap is set */}
      <div
        className={`h-20 w-20 overflow-hidden rounded-full border border-border-default bg-surface-2 ${
          avatarOverlap ? "relative z-10 ring-4 ring-surface-1" : ""
        }`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={profile.display_name}
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-text-muted">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name (+ verified badge) + tagline */}
      <div>
        <h1 className="inline-flex items-center gap-2 font-display text-3xl font-bold tracking-[0.04em] text-text-primary md:text-4xl">
          {profile.display_name}
          {profile.is_verified === 1 && (
            <VerifiedBadge size={22} className="shrink-0 translate-y-[1px]" />
          )}
        </h1>
        {profile.tagline && (
          <p className="mt-1 font-mono text-[12px] text-text-secondary">
            {profile.tagline}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {parseRoles(profile.esports_role).map((role) => (
          <Badge key={role}>{getRoleLabel(role)}</Badge>
        ))}

        {profile.country && (
          <Badge>
            <span className="inline-flex items-center gap-1.5">
              <Flag code={profile.country} size={14} />
              {getCountryName(profile.country)}
            </span>
          </Badge>
        )}

        {rolesPlayed
          .filter((r) => r.is_main)
          .map((r) => (
            <Badge key={`${r.game}-${r.role}`}>{r.role}</Badge>
          ))}

        <StatusBadge status={profile.status} />
      </div>

      {/* Bio — supports a small Markdown subset (bold/italic/strike/code/links) */}
      {profile.bio && (
        <p className="max-w-sm whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary [overflow-wrap:anywhere]">
          <MiniMarkdown text={profile.bio} />
        </p>
      )}
    </div>
  );
}
