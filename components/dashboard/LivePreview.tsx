"use client";

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

interface LivePreviewProps {
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
}

export function LivePreview({
  profile,
  gameConnections,
  socialLinks,
  teamHistory,
  rolesPlayed,
  avatarUrl,
}: LivePreviewProps) {
  return (
    <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col items-center justify-start px-6 py-8">
      <p className="mb-4 text-xs uppercase tracking-widest text-text-muted">
        Live preview
      </p>

      {/* Phone frame */}
      <div className="relative h-full max-h-[760px] w-full max-w-[390px] overflow-hidden rounded-[2.25rem] border-[10px] border-bg-surface bg-bg-base shadow-2xl">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-32 -translate-x-1/2 rounded-b-2xl bg-bg-surface" />

        {/* Profile content */}
        <div className="h-full overflow-y-auto px-1 pb-8 pt-6">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-3 py-4">
            <ProfileHeader
              profile={profile}
              rolesPlayed={rolesPlayed}
              avatarUrl={avatarUrl}
            />
            <LiveRanksSection connections={gameConnections} />
            <CompetitiveHistorySection entries={teamHistory} />
            <SocialLinksSection links={socialLinks} />
            <ProfileFooterCTA />
          </div>
        </div>
      </div>
    </div>
  );
}
