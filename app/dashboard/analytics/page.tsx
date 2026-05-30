import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { findGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { getProfileAnalytics } from "@/lib/db/engagement";
import { AnalyticsClient } from "@/components/dashboard/AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = findProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const analytics = getProfileAnalytics(profile.id);

  // Data for the shared live preview on the right.
  const gameConnections = findGameConnectionsByProfileId(profile.id);
  const socialLinks = findSocialLinksByProfileId(profile.id);
  const teamHistory = findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = findRolesPlayedByProfileId(profile.id);

  return (
    <AnalyticsClient
      user={{ username: user.username, avatarUrl: user.avatar_url }}
      slug={profile.slug}
      baseUrl={process.env.NEXT_PUBLIC_BASE_URL ?? "https://procard.gg"}
      analytics={analytics}
      profile={profile}
      gameConnections={gameConnections}
      socialLinks={socialLinks}
      teamHistory={teamHistory}
      rolesPlayed={rolesPlayed}
    />
  );
}
