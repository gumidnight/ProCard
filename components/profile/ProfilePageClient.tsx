"use client";

import { motion } from "framer-motion";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LiveRanksSection } from "@/components/profile/LiveRanksSection";
import { CompetitiveHistorySection } from "@/components/profile/CompetitiveHistorySection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { ProfileFooterCTA } from "@/components/profile/ProfileFooterCTA";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface ProfilePageClientProps {
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
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
}: ProfilePageClientProps) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
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
          />
        </motion.div>

        <motion.div
          custom={1}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <LiveRanksSection connections={gameConnections} />
        </motion.div>

        <motion.div
          custom={2}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <CompetitiveHistorySection entries={teamHistory} />
        </motion.div>

        <motion.div
          custom={3}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <SocialLinksSection links={socialLinks} />
        </motion.div>

        <motion.div
          custom={4}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <ProfileFooterCTA />
        </motion.div>
      </div>
    </main>
  );
}
