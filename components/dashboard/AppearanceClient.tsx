"use client";

import { AppearanceCard } from "./AppearanceCard";
import { DashboardShell } from "./DashboardShell";
import { useDashboardData } from "./useDashboardData";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface AppearanceUser {
  username: string;
  avatarUrl: string | null;
}

interface AppearanceClientProps {
  user: AppearanceUser;
  initialProfile: ProfileRow;
  initialGameConnections: GameConnectionRow[];
  initialSocialLinks: SocialLinkRow[];
  initialTeamHistory: TeamHistoryRow[];
  initialRolesPlayed: RolePlayedRow[];
  baseUrl: string;
}

export function AppearanceClient({
  user,
  initialProfile,
  initialGameConnections,
  initialSocialLinks,
  initialTeamHistory,
  initialRolesPlayed,
  baseUrl,
}: AppearanceClientProps) {
  const data = useDashboardData({
    profile: initialProfile,
    gameConnections: initialGameConnections,
    socialLinks: initialSocialLinks,
    teamHistory: initialTeamHistory,
    rolesPlayed: initialRolesPlayed,
    discordAvatarUrl: user.avatarUrl,
  });

  return (
    <DashboardShell
      active="appearance"
      username={user.username}
      topbarAvatarUrl={user.avatarUrl}
      slug={data.profile.slug}
      baseUrl={baseUrl}
      profile={data.profile}
      gameConnections={data.gameConnections}
      socialLinks={data.socialLinks}
      teamHistory={data.teamHistory}
      rolesPlayed={data.rolesPlayed}
      avatarUrl={data.avatarUrl}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[0.03em] text-text-primary">
            Appearance
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Banner, background and the look of your card. Changes save automatically and
            preview live.
          </p>
        </div>

        <AppearanceCard profile={data.profile} onUpdate={data.setProfile} />
      </div>
    </DashboardShell>
  );
}
