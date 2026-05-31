import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { findGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { AppearanceClient } from "@/components/dashboard/AppearanceClient";

export default async function AppearancePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await findProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const [gameConnections, socialLinks, teamHistory, rolesPlayed] = await Promise.all([
    findGameConnectionsByProfileId(profile.id),
    findSocialLinksByProfileId(profile.id),
    findTeamHistoryByProfileId(profile.id),
    findRolesPlayedByProfileId(profile.id),
  ]);

  return (
    <AppearanceClient
      user={{ username: user.username, avatarUrl: user.avatar_url }}
      initialProfile={profile}
      initialGameConnections={gameConnections}
      initialSocialLinks={socialLinks}
      initialTeamHistory={teamHistory}
      initialRolesPlayed={rolesPlayed}
      baseUrl={process.env.NEXT_PUBLIC_BASE_URL ?? "https://procard.gg"}
    />
  );
}
