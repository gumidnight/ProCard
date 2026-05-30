"use client";

import { type ReactNode } from "react";
import { DashboardTopBar } from "./DashboardTopBar";
import { LivePreview } from "./LivePreview";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface DashboardShellProps {
  active: "editor" | "appearance" | "analytics";
  username: string;
  /** Discord avatar shown in the top bar (independent of the card avatar). */
  topbarAvatarUrl: string | null;
  slug: string;
  baseUrl: string;
  // Live-preview data
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null;
  /** Left-hand content for the active tab. */
  children: ReactNode;
}

/**
 * Shared dashboard frame: top bar + a split pane that keeps the left-hand
 * content (editor / appearance / analytics) beside a sticky phone preview, so
 * every tab feels structurally identical. The preview is shown on large
 * screens; below `lg` the content takes the full width.
 */
export function DashboardShell({
  active,
  username,
  topbarAvatarUrl,
  slug,
  baseUrl,
  profile,
  gameConnections,
  socialLinks,
  teamHistory,
  rolesPlayed,
  avatarUrl,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <DashboardTopBar
        username={username}
        avatarUrl={topbarAvatarUrl}
        slug={slug}
        baseUrl={baseUrl}
        active={active}
      />

      {/* Split pane — whole page scrolls; phone is sticky on the right */}
      <div className="flex flex-1">
        {/* Left: tab content */}
        <section className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </section>

        {/* Right: live preview (sticky — follows scroll, shown on large screens) */}
        <aside className="relative hidden flex-1 border-l border-border-subtle bg-surface-3/30 lg:block">
          <LivePreview
            profile={profile}
            gameConnections={gameConnections}
            socialLinks={socialLinks}
            teamHistory={teamHistory}
            rolesPlayed={rolesPlayed}
            avatarUrl={avatarUrl}
          />
        </aside>
      </div>
    </div>
  );
}
