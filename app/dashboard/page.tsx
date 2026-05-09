import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { findGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = findProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const gameConnections = findGameConnectionsByProfileId(profile.id);
  const socialLinks = findSocialLinksByProfileId(profile.id);
  const teamHistory = findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = findRolesPlayedByProfileId(profile.id);

  return (
    <DashboardClient
      user={{
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
      }}
      initialProfile={profile}
      initialGameConnections={gameConnections}
      initialSocialLinks={socialLinks}
      initialTeamHistory={teamHistory}
      initialRolesPlayed={rolesPlayed}
    />
  );
}
