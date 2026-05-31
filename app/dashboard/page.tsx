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

  const profile = await findProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const gameConnections = await findGameConnectionsByProfileId(profile.id);
  const socialLinks = await findSocialLinksByProfileId(profile.id);
  const teamHistory = await findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = await findRolesPlayedByProfileId(profile.id);

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
      baseUrl={process.env.NEXT_PUBLIC_BASE_URL ?? "https://procard.gg"}
    />
  );
}
