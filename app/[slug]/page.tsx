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
import {
  getOrCreateVisitorId,
  makeSignedVisitorCookieValue,
  visitorCookieOptions,
} from "@/lib/auth/visitor";
import { getSessionUser } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
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
  const profile = (await findProfileBySlug(slug)) ?? findDemoBundle(slug)?.profile;
  if (!profile) return { title: "Profile Not Found — ProCard" };
  return {
    title: `${profile.display_name} — ProCard`,
    description:
      profile.bio ?? `${profile.display_name}'s competitive gaming profile on ProCard.`,
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const profile = await findProfileBySlug(slug);

  if (!profile) {
    const demo = findDemoBundle(slug);
    if (!demo) notFound();
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

  const [gameConnections, socialLinks, teamHistory, rolesPlayed, user] =
    await Promise.all([
      findVisibleGameConnectionsByProfileId(profile.id),
      findSocialLinksByProfileId(profile.id),
      findTeamHistoryByProfileId(profile.id),
      findRolesPlayedByProfileId(profile.id),
      findUserById(profile.user_id),
    ]);

  const avatarUrl = profile.avatar_key
    ? getStorage().publicUrl(profile.avatar_key)
    : (user?.avatar_url ?? null);

  const { id: visitorId, isNew } = await getOrCreateVisitorId();
  const viewer = await getSessionUser();

  const [initialViews, initialLikes, initialLiked, initialComments] = await Promise.all([
    countProfileViews(profile.id),
    countProfileLikes(profile.id),
    hasVisitorLiked(profile.id, visitorId),
    findCommentsByProfileId(profile.id),
  ]);

  const page = (
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

  // Set the signed visitor cookie if this is a new visitor
  if (isNew) {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const opts = visitorCookieOptions();
    store.set(opts.name, makeSignedVisitorCookieValue(visitorId), opts);
  }

  return page;
}
