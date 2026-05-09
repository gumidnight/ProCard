"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ProfileEditCard } from "./ProfileEditCard";
import { StatusEditCard } from "./StatusEditCard";
import { ConnectionsCard } from "./ConnectionsCard";
import { SocialsCard } from "./SocialsCard";
import { TeamHistoryCard } from "./TeamHistoryCard";
import { LivePreview } from "./LivePreview";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface DashboardUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface DashboardClientProps {
  user: DashboardUser;
  initialProfile: ProfileRow;
  initialGameConnections: GameConnectionRow[];
  initialSocialLinks: SocialLinkRow[];
  initialTeamHistory: TeamHistoryRow[];
  initialRolesPlayed: RolePlayedRow[];
}

export function DashboardClient({
  user,
  initialProfile,
  initialGameConnections,
  initialSocialLinks,
  initialTeamHistory,
  initialRolesPlayed,
}: DashboardClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [gameConnections, setGameConnections] = useState(
    initialGameConnections,
  );
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks);
  const [teamHistory, setTeamHistory] = useState(initialTeamHistory);
  const [rolesPlayed] = useState(initialRolesPlayed);

  const [previewOpen, setPreviewOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }, []);

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.slug}`;

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(profileUrl);
  }, [profileUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-bg-base/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold tracking-[0.06em] text-text-primary">
            PROCARD<span className="text-accent-light">.GG</span>
          </span>
          <span className="hidden text-xs text-text-muted sm:inline">
            / dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyUrl}
            className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary md:flex"
            title="Copy profile URL"
          >
            <span className="text-xs text-text-muted">↗</span>
            <span>procard.gg/{profile.slug}</span>
          </button>

          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
          >
            View live →
          </a>

          <button
            onClick={() => setPreviewOpen((p) => !p)}
            className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
          >
            {previewOpen ? "Editor" : "Preview"}
          </button>

          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={32}
              height={32}
              className="rounded-full border border-border-subtle"
              unoptimized
            />
          )}

          <button
            onClick={handleLogout}
            className="text-xs text-text-muted transition-colors hover:text-text-primary"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: editor */}
        <section
          className={`flex-1 overflow-y-auto px-6 py-8 lg:max-w-2xl ${
            previewOpen ? "hidden" : "block"
          }`}
        >
          <div className="mx-auto flex max-w-xl flex-col gap-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-[0.03em] text-text-primary">
                Build your card
              </h1>
              <p className="mt-1 text-[13px] text-text-muted">
                Live preview updates as you edit.
              </p>
            </div>

            <ProfileEditCard
              profile={profile}
              onUpdate={setProfile}
            />

            <StatusEditCard
              profile={profile}
              onUpdate={setProfile}
            />

            <ConnectionsCard
              connections={gameConnections}
              onUpdate={setGameConnections}
            />

            <SocialsCard
              socials={socialLinks}
              onUpdate={setSocialLinks}
            />

            <TeamHistoryCard
              entries={teamHistory}
              onUpdate={setTeamHistory}
            />
          </div>
        </section>

        {/* Right: live preview */}
        <aside
          className={`relative flex-1 overflow-y-auto border-l border-border-subtle bg-bg-subtle/30 ${
            previewOpen ? "block" : "hidden lg:block"
          }`}
        >
          {/* Floating back-to-edit button (visible whenever preview is in focus mode) */}
          {previewOpen && (
            <button
              onClick={() => setPreviewOpen(false)}
              className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-default bg-bg-surface px-5 py-3 text-sm font-medium text-text-primary shadow-lg shadow-black/40 transition-colors hover:bg-bg-elevated"
            >
              <span aria-hidden>←</span>
              <span>Back to edit</span>
            </button>
          )}

          <LivePreview
            profile={profile}
            gameConnections={gameConnections}
            socialLinks={socialLinks}
            teamHistory={teamHistory}
            rolesPlayed={rolesPlayed}
            avatarUrl={user.avatarUrl}
          />
        </aside>
      </div>
    </div>
  );
}
