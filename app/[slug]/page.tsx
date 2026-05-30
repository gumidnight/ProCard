import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findProfileBySlug } from "@/lib/db/profiles";
import { findVisibleGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { findUserById } from "@/lib/db/users";
import {
  countProfileLikes,
  countProfileViews,
  findCommentsByProfileId,
  hasVisitorLiked,
} from "@/lib/db/engagement";
import { getOrCreateVisitorId } from "@/lib/auth/visitor";
import { getSessionUser } from "@/lib/auth/session";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { HERO_DEMO, GALLERY_DEMOS } from "@/lib/constants/demo-profiles";

const DEMO_BUNDLES = [HERO_DEMO, ...GALLERY_DEMOS];

function findDemoBundle(slug: string) {
  return DEMO_BUNDLES.find((b) => b.profile.slug === slug) ?? null;
}

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = findProfileBySlug(slug) ?? findDemoBundle(slug)?.profile;

  if (!profile) {
    return { title: "Profile Not Found — ProCard" };
  }

  return {
    title: `${profile.display_name} — ProCard`,
    description:
      profile.bio ?? `${profile.display_name}'s competitive gaming profile on ProCard.`,
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const profile = findProfileBySlug(slug);

  if (!profile) {
    const demo = findDemoBundle(slug);
    if (!demo) {
      notFound();
    }

    const viewer = await getSessionUser();
    return (
      <ProfilePageClient
        profile={demo.profile}
        gameConnections={demo.connections}
        socialLinks={demo.socials}
        teamHistory={demo.teamHistory}
        rolesPlayed={demo.rolesPlayed}
        avatarUrl={demo.avatarUrl}
        initialViews={0}
        initialLikes={0}
        initialLiked={false}
        initialComments={[]}
        currentUserId={viewer?.id ?? null}
        isOwner={false}
      />
    );
  }

  const gameConnections = findVisibleGameConnectionsByProfileId(profile.id);
  const socialLinks = findSocialLinksByProfileId(profile.id);
  const teamHistory = findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = findRolesPlayedByProfileId(profile.id);

  // Resolve avatar URL — prefer custom upload, fall back to Discord
  const user = findUserById(profile.user_id);
  const avatarUrl = profile.avatar_key
    ? `/api/profile/avatar?key=${encodeURIComponent(profile.avatar_key)}`
    : (user?.avatar_url ?? null);

  // Engagement (SSR snapshot — client re-fetches/updates as needed)
  const { id: visitorId } = await getOrCreateVisitorId();
  const viewer = await getSessionUser();
  const initialViews = countProfileViews(profile.id);
  const initialLikes = countProfileLikes(profile.id);
  const initialLiked = hasVisitorLiked(profile.id, visitorId);
  const initialComments = findCommentsByProfileId(profile.id);

  return (
    <ProfilePageClient
      profile={profile}
      gameConnections={gameConnections}
      socialLinks={socialLinks}
      teamHistory={teamHistory}
      rolesPlayed={rolesPlayed}
      avatarUrl={avatarUrl}
      initialViews={initialViews}
      initialLikes={initialLikes}
      initialLiked={initialLiked}
      initialComments={initialComments}
      currentUserId={viewer?.id ?? null}
      isOwner={viewer?.id === profile.user_id}
    />
  );
}
