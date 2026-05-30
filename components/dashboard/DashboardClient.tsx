"use client";

import { ProfileEditCard } from "./ProfileEditCard";
import { StatusEditCard } from "./StatusEditCard";
import { ConnectionsCard } from "./ConnectionsCard";
import { SocialsCard } from "./SocialsCard";
import { TeamHistoryCard } from "./TeamHistoryCard";
import { DashboardShell } from "./DashboardShell";
import { useDashboardData } from "./useDashboardData";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface DashboardUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface DashboardClientProps {
  user: DashboardUser;
  initialProfile: ProfileRow;
  initialGameConnections: GameConnectionRow[];
  initialSocialLinks: SocialLinkRow[];
  initialTeamHistory: TeamHistoryRow[];
  initialRolesPlayed: RolePlayedRow[];
  baseUrl: string;
}

export function DashboardClient({
  user,
  initialProfile,
  initialGameConnections,
  initialSocialLinks,
  initialTeamHistory,
  initialRolesPlayed,
  baseUrl,
}: DashboardClientProps) {
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
      active="editor"
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
            Build your card
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Live preview updates as you edit. Changes save automatically.
          </p>
        </div>

        <ProfileEditCard
          profile={data.profile}
          onUpdate={data.setProfile}
          discordAvatarUrl={user.avatarUrl}
        />

        <StatusEditCard profile={data.profile} onUpdate={data.setProfile} />

        <ConnectionsCard
          connections={data.gameConnections}
          onUpdate={data.setGameConnections}
        />

        <TeamHistoryCard entries={data.teamHistory} onUpdate={data.setTeamHistory} />

        <SocialsCard socials={data.socialLinks} onUpdate={data.setSocialLinks} />
      </div>
    </DashboardShell>
  );
}
