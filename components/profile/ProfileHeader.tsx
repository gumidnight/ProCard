"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { getCountryFlag } from "@/lib/utils/country";
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
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Avatar */}
      <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border-subtle bg-bg-elevated">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-text-muted">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + tagline */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wider">
          {profile.display_name}
        </h1>
        {profile.tagline && (
          <p className="mt-0.5 font-mono text-sm text-text-secondary">
            {profile.tagline}
          </p>
        )}
      </div>

      {/* Country + roles + status */}
      <div className="flex flex-wrap items-center justify-center gap-2">
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
        <p className="max-w-md text-sm text-text-secondary">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
