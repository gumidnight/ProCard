"use client";

import { Eye, Heart, MessageSquare, MousePointerClick, Lock, Globe } from "lucide-react";
import { AnalyticsCard } from "./AnalyticsCard";
import { DashboardShell } from "./DashboardShell";
import { useDashboardData } from "./useDashboardData";
import { Flag } from "@/components/ui/Flag";
import { getRoleLabel } from "@/lib/utils/esports-roles";
import { formatRelative } from "@/lib/utils/time";
import type { ProfileAnalytics, ActivityItem } from "@/lib/db/engagement";
import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
} from "@/types/db";

interface AnalyticsUser {
  username: string;
  avatarUrl: string | null;
}

interface AnalyticsClientProps {
  user: AnalyticsUser;
  slug: string;
  baseUrl: string;
  analytics: ProfileAnalytics;
  // Live-preview data (read-only on this tab)
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
}

const PLATFORM_LABELS: Record<string, string> = {
  discord: "Discord",
  twitch: "Twitch",
  twitter: "Twitter / X",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  kick: "Kick",
  liquipedia: "Liquipedia",
  opgg: "OP.GG",
  tracker: "Tracker.gg",
  website: "Website",
};

function pluralRole(role: string, n: number): string {
  const label = getRoleLabel(role);
  if (n === 1) return label;
  return /(s|x|z|ch|sh)$/i.test(label) ? `${label}es` : `${label}s`;
}

const ACTIVITY_ICON = {
  view: Eye,
  like: Heart,
  comment: MessageSquare,
  click: MousePointerClick,
} as const;

function activityText(item: ActivityItem): string {
  switch (item.kind) {
    case "view": {
      const who = item.viewerRole ? `A ${getRoleLabel(item.viewerRole)}` : "Someone";
      return `${who} viewed your card`;
    }
    case "like":
      return "Someone liked your card";
    case "comment":
      return "New comment on your card";
    case "click":
      return `Opened your ${PLATFORM_LABELS[item.platform ?? ""] ?? "social"} link`;
  }
}

export function AnalyticsClient({
  user,
  slug,
  baseUrl,
  analytics,
  profile,
  gameConnections,
  socialLinks,
  teamHistory,
  rolesPlayed,
}: AnalyticsClientProps) {
  const data = useDashboardData({
    profile,
    gameConnections,
    socialLinks,
    teamHistory,
    rolesPlayed,
    discordAvatarUrl: user.avatarUrl,
  });

  const maxClicks = analytics.clicksByPlatform.reduce((m, p) => Math.max(m, p.clicks), 0);
  const maxCountry = analytics.viewsByCountry.reduce((m, c) => Math.max(m, c.views), 0);
  const totalRoleViewers = analytics.viewersByRole.reduce((s, r) => s + r.viewers, 0);

  return (
    <DashboardShell
      active="analytics"
      username={user.username}
      topbarAvatarUrl={user.avatarUrl}
      slug={slug}
      baseUrl={baseUrl}
      profile={data.profile}
      gameConnections={data.gameConnections}
      socialLinks={data.socialLinks}
      teamHistory={data.teamHistory}
      rolesPlayed={data.rolesPlayed}
      avatarUrl={data.avatarUrl}
    >
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-[0.03em] text-text-primary">
          Analytics
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          How your card is performing across the web.
        </p>
      </div>

      {/* Live / recent pulse */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full bg-success"
            style={{ animation: "livePulse 1.6s ease-in-out infinite" }}
            aria-hidden
          />
          <span className="font-mono tabular-nums text-text-primary">
            {analytics.viewsLast24h.toLocaleString()}
          </span>{" "}
          views in the last 24h
        </span>
        <span className="text-text-muted">·</span>
        <span>
          <span className="font-mono tabular-nums text-text-primary">
            {analytics.viewsLastHour.toLocaleString()}
          </span>{" "}
          in the last hour
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <AnalyticsCard analytics={analytics} />

        {/* Who's scouting you — free role counts + paid identity teaser */}
        <section className="overflow-hidden rounded-[10px] border border-border-subtle bg-surface-1">
          <div className="p-5">
            <h2 className="font-display text-base font-semibold tracking-wide text-text-primary">
              Who&apos;s viewing you
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Signed-in members of the esports scene who checked your card.
            </p>

            {analytics.viewersByRole.length === 0 ? (
              <p className="mt-4 text-[13px] text-text-muted">
                No signed-in members have viewed your card yet. As coaches, managers and
                scouts start looking, they&apos;ll show up here.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {analytics.viewersByRole.map(({ role, viewers }) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-0 px-3 py-1.5 text-[13px] text-text-secondary"
                  >
                    <span className="font-mono font-semibold text-text-primary">
                      {viewers}
                    </span>
                    {pluralRole(role, viewers)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Paid teaser */}
          <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-0/60 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Lock className="size-4 text-accent" aria-hidden />
              <span className="text-[13px] text-text-secondary">
                {totalRoleViewers > 0
                  ? `See exactly who they are — names, orgs & when`
                  : `Unlock names, orgs & timestamps when scouts view you`}
              </span>
            </div>
            <button
              type="button"
              disabled
              title="Premium — coming soon"
              className="shrink-0 cursor-not-allowed rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-[var(--accent-on)] opacity-90"
            >
              Unlock →
            </button>
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-[10px] border border-border-subtle bg-surface-1 p-5">
          <h2 className="font-display text-base font-semibold tracking-wide text-text-primary">
            Recent activity
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            The latest things happening on your card.
          </p>

          {analytics.recentActivity.length === 0 ? (
            <p className="mt-4 text-[13px] text-text-muted">
              Nothing yet. Share your card to get the ball rolling.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-border-subtle">
              {analytics.recentActivity.map((item, i) => {
                const Icon = ACTIVITY_ICON[item.kind];
                return (
                  <li
                    key={`${item.kind}-${item.created_at}-${i}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-0 text-text-muted">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="flex-1 text-[13px] text-text-secondary">
                      {activityText(item)}
                    </span>
                    {item.kind === "view" && item.country && (
                      <Flag code={item.country} size={16} />
                    )}
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(item.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Geography */}
        <section className="rounded-[10px] border border-border-subtle bg-surface-1 p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-wide text-text-primary">
            <Globe className="size-4 text-text-muted" aria-hidden />
            Where viewers are
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            The regions paying attention to you.
          </p>

          {analytics.viewsByCountry.length === 0 ? (
            <p className="mt-4 text-[13px] text-text-muted">
              Location data appears once your card gets views in production.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {analytics.viewsByCountry.map(({ country, views }) => (
                <li key={country} className="flex items-center gap-3">
                  <span className="flex w-24 shrink-0 items-center gap-2 text-[13px] text-text-secondary">
                    <Flag code={country} size={18} />
                    {country}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${maxCountry ? (views / maxCountry) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[13px] tabular-nums text-text-primary">
                    {views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Clicks by platform */}
        <section className="rounded-[10px] border border-border-subtle bg-surface-1 p-5">
          <h2 className="font-display text-base font-semibold tracking-wide text-text-primary">
            Clicks by platform
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Which social links visitors actually open.
          </p>

          {analytics.clicksByPlatform.length === 0 ? (
            <p className="mt-4 text-[13px] text-text-muted">
              No link clicks yet. Share your card to start tracking —{" "}
              <span className="font-mono text-text-secondary">
                {baseUrl.replace(/^https?:\/\//, "")}/{slug}
              </span>
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {analytics.clicksByPlatform.map(({ platform, clicks }) => (
                <li key={platform} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-[13px] text-text-secondary">
                    {PLATFORM_LABELS[platform] ?? platform}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${maxClicks ? (clicks / maxClicks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[13px] tabular-nums text-text-primary">
                    {clicks.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
