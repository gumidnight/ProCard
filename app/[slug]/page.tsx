import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findProfileBySlug } from "@/lib/db/profiles";
import { findGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { findUserById } from "@/lib/db/users";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = findProfileBySlug(slug);

  if (!profile) {
    return { title: "Profile Not Found — RankCard" };
  }

  return {
    title: `${profile.display_name} — RankCard`,
    description:
      profile.bio ??
      `${profile.display_name}'s competitive gaming profile on RankCard.`,
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const profile = findProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const gameConnections = findGameConnectionsByProfileId(profile.id);
  const socialLinks = findSocialLinksByProfileId(profile.id);
  const teamHistory = findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = findRolesPlayedByProfileId(profile.id);

  // Resolve avatar URL
  const user = findUserById(profile.user_id);
  const avatarUrl = user?.avatar_url ?? null;

  return (
    <ProfilePageClient
      profile={profile}
      gameConnections={gameConnections}
      socialLinks={socialLinks}
      teamHistory={teamHistory}
      rolesPlayed={rolesPlayed}
      avatarUrl={avatarUrl}
    />
  );
}
