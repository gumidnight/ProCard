"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileBackground } from "@/components/profile/ProfileBackground";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { PlayerStatsRow } from "@/components/profile/PlayerStatsRow";
import { LiveRanksSection } from "@/components/profile/LiveRanksSection";
import { CurrentActivitySection } from "@/components/profile/CurrentActivitySection";
import { CompetitiveHistorySection } from "@/components/profile/CompetitiveHistorySection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { ProfileFooterCTA } from "@/components/profile/ProfileFooterCTA";
import { EngagementBar } from "@/components/profile/EngagementBar";
import { CommentsSection } from "@/components/profile/CommentsSection";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
  ProfileCommentWithAuthor,
} from "@/types/db";

interface ProfilePageClientProps {
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
  initialViews: number;
  initialLikes: number;
  initialLiked: boolean;
  initialComments: ProfileCommentWithAuthor[];
  currentUserId: string | null;
  isOwner: boolean;
}

const stagger = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.25 },
  }),
};

export function ProfilePageClient({
  profile,
  gameConnections,
  socialLinks,
  teamHistory,
  rolesPlayed,
  avatarUrl,
  initialViews,
  initialLikes,
  initialLiked,
  initialComments,
  currentUserId,
  isOwner,
}: ProfilePageClientProps) {
  const commentsRef = useRef<HTMLElement>(null);
  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen">
      {/* Resolved background (default / preset / custom) + dark scrim.
          `fixed` pins it to the viewport so it stays static while the card
          scrolls over it. */}
      <ProfileBackground profile={profile} fixed />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
        {isOwner && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-xs">
            <span className="text-text-secondary">
              <span className="font-semibold text-text-primary">This is your card.</span>{" "}
              Only you see this bar.
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 font-medium text-accent-hover transition-colors hover:bg-accent hover:text-[var(--accent-on)]"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit card
            </Link>
          </div>
        )}

        {/* Framed player card */}
        <div className="overflow-hidden rounded-[10px] border border-border-default bg-surface-1/80 backdrop-blur-sm">
          <ProfileBanner bannerKey={profile.banner_key} className="h-28 sm:h-32" />

          <div className="px-4 pb-8 sm:px-6">
            <div className="flex flex-col gap-8">
              <motion.div
                custom={0}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <ProfileHeader
                  profile={profile}
                  rolesPlayed={rolesPlayed}
                  avatarUrl={avatarUrl}
                  avatarOverlap
                />
                <div className="mt-5">
                  <PlayerStatsRow
                    connections={gameConnections}
                    rolesPlayed={rolesPlayed}
                    profile={profile}
                  />
                </div>
              </motion.div>

              <motion.div
                custom={1}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <EngagementBar
                  slug={profile.slug}
                  initialViews={initialViews}
                  initialLikes={initialLikes}
                  initialLiked={initialLiked}
                  commentCount={initialComments.length}
                  onCommentClick={scrollToComments}
                />
              </motion.div>

              <motion.div
                custom={2}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <CurrentActivitySection profile={profile} />
              </motion.div>

              <motion.div
                custom={3}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <LiveRanksSection connections={gameConnections} />
              </motion.div>

              <motion.div
                custom={4}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <CompetitiveHistorySection entries={teamHistory} />
              </motion.div>

              <motion.div
                custom={5}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <SocialLinksSection links={socialLinks} slug={profile.slug} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Endorsements — its own panel below the card, like a comment section */}
        <motion.div
          custom={6}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-6 rounded-[10px] border border-border-default bg-surface-1/80 px-4 py-6 backdrop-blur-sm sm:px-6"
        >
          <CommentsSection
            ref={commentsRef}
            slug={profile.slug}
            initialComments={initialComments}
            currentUserId={currentUserId}
            isOwner={isOwner}
          />
        </motion.div>

        <motion.div
          custom={7}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <ProfileFooterCTA />
        </motion.div>
      </main>
    </div>
  );
}
