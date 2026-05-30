"use client";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileBackground } from "@/components/profile/ProfileBackground";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { PlayerStatsRow } from "@/components/profile/PlayerStatsRow";
import { LiveRanksSection } from "@/components/profile/LiveRanksSection";
import { CurrentActivitySection } from "@/components/profile/CurrentActivitySection";
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

/**
 * Sticky live preview rendered inside a realistic iPhone 15 Pro–style frame.
 * - Outer titanium shell with subtle gradient + side buttons
 * - Inner screen with rounded corners and Dynamic Island
 * - Status bar (time + signal/wifi/battery glyphs)
 * - Scrollable profile content
 */
export function LivePreview({
  profile,
  gameConnections,
  socialLinks,
  teamHistory,
  rolesPlayed,
  avatarUrl,
}: LivePreviewProps) {
  return (
    <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-6">
      <div className="mb-6 flex w-full max-w-[440px] items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white">
          Live preview
        </p>
        <p className="font-mono text-[11px] text-white truncate">
          procard.gg/{profile.slug}
        </p>
      </div>

      <PhoneFrame backdrop={<ProfileBackground profile={profile} />}>
        {/* Banner is full-bleed at the top of the scroll; the phone screen
            itself is the card frame, so no extra border here. */}
        <ProfileBanner bannerKey={profile.banner_key} className="h-24" />
        <div className="flex flex-col gap-5 px-3 pb-8">
          <ProfileHeader
            profile={profile}
            rolesPlayed={rolesPlayed}
            avatarUrl={avatarUrl}
            avatarOverlap
          />
          <PlayerStatsRow
            connections={gameConnections.filter((c) => c.is_visible)}
            rolesPlayed={rolesPlayed}
            profile={profile}
          />
          <CurrentActivitySection profile={profile} />
          <LiveRanksSection connections={gameConnections.filter((c) => c.is_visible)} />
          <CompetitiveHistorySection entries={teamHistory} />
          <SocialLinksSection links={socialLinks} />
          <ProfileFooterCTA />
        </div>
      </PhoneFrame>
    </div>
  );
}

// ---------------------------------------------------------------------------
// iPhone frame
// ---------------------------------------------------------------------------

function PhoneFrame({
  children,
  backdrop,
}: {
  children: React.ReactNode;
  backdrop?: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 min-h-0 w-full flex justify-center">
      {/* Outer titanium shell — iPhone 15 Pro is ~71.5mm × 146.6mm → ~2.05:1 */}
      <div
        className="relative flex h-full max-h-[900px] w-full max-w-[440px] flex-col rounded-[58px] p-[6px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]"
        style={{
          background:
            "linear-gradient(155deg, #3a3d44 0%, #1c1e22 30%, #0e0f12 55%, #1c1e22 80%, #3a3d44 100%)",
          aspectRatio: "440 / 900",
        }}
      >
        {/* Side buttons */}
        <span className="absolute -left-[2px] top-[120px] h-7 w-[3px] rounded-l-sm bg-[#1a1b1f]" />
        <span className="absolute -left-[2px] top-[170px] h-14 w-[3px] rounded-l-sm bg-[#2a2c30]" />
        <span className="absolute -left-[2px] top-[240px] h-14 w-[3px] rounded-l-sm bg-[#2a2c30]" />
        <span className="absolute -right-[2px] top-[200px] h-20 w-[3px] rounded-r-sm bg-[#2a2c30]" />

        {/* Inner bezel */}
        <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-[52px] bg-black p-[2px]">
          {/* Screen */}
          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-[50px] bg-surface-0">
            {/* Full-bleed background layer (fixed behind the scrolling content) */}
            {backdrop}

            {/* Status bar */}
            <div className="relative z-20 flex h-9 shrink-0 items-center justify-between px-7 pt-1 text-[11px] font-semibold text-text-primary">
              <span className="font-mono tabular-nums">9:41</span>
              <span className="flex items-center gap-1">
                <SignalGlyph />
                <WifiGlyph />
                <BatteryGlyph />
              </span>
            </div>

            {/* Dynamic Island */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-[28px] w-[110px] -translate-x-1/2 rounded-full bg-black" />

            {/* Scrollable content — hide scrollbar for clean iPhone look */}
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain phone-scroll">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .phone-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .phone-scroll {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function SignalGlyph() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
      <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="currentColor" />
      <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="currentColor" />
      <rect x="7" y="3" width="2.5" height="7" rx="0.5" fill="currentColor" />
      <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden fill="currentColor">
      <path d="M7 0C4.4 0 2 1 0 2.6l1.2 1.5C2.8 2.8 4.8 2 7 2s4.2.8 5.8 2.1L14 2.6C12 1 9.6 0 7 0Z" />
      <path d="M7 3.5c-1.8 0-3.5.7-4.7 1.8l1.2 1.5C4.5 5.9 5.7 5.5 7 5.5s2.5.4 3.5 1.3l1.2-1.5C10.5 4.2 8.8 3.5 7 3.5Z" />
      <circle cx="7" cy="9" r="1.2" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg width="24" height="11" viewBox="0 0 24 11" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="20"
        height="10"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
      />
      <rect
        x="21.5"
        y="3.5"
        width="1.5"
        height="4"
        rx="0.5"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
