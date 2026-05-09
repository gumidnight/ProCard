"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { getCountryFlag } from "@/lib/utils/country";
import { ESPORTS_ROLES } from "@/lib/constants/esports-roles";
import type { ProfileRow, RolePlayedRow } from "@/types/db";

interface ProfileHeaderProps {
  profile: ProfileRow;
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
}

export function ProfileHeader({
  profile,
  rolesPlayed,
  avatarUrl,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* Avatar */}
      <div className="h-20 w-20 overflow-hidden rounded-full border border-border-default bg-bg-elevated">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-text-muted">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + tagline */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[0.04em] text-text-primary md:text-4xl">
          {profile.display_name}
        </h1>
        {profile.tagline && (
          <p className="mt-1 font-mono text-[12px] text-text-secondary">
            {profile.tagline}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {profile.esports_role && (
          <Badge>
            {ESPORTS_ROLES.find((r) => r.value === profile.esports_role)?.label ?? profile.esports_role}
          </Badge>
        )}

        {profile.country && (
          <Badge>
            {getCountryFlag(profile.country)} {profile.country}
          </Badge>
        )}

        {rolesPlayed
          .filter((r) => r.is_main)
          .map((r) => (
            <Badge key={`${r.game}-${r.role}`}>{r.role}</Badge>
          ))}

        <StatusBadge status={profile.status} />
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="max-w-sm text-[13px] leading-relaxed text-text-secondary">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
