"use client";

import type { ComponentType, SVGProps } from "react";
import {
  SiDiscord,
  SiTwitch,
  SiX,
  SiYoutube,
  SiInstagram,
  SiTiktok,
  SiKick,
} from "react-icons/si";
import { BookOpen, BarChart3, Target, Globe } from "lucide-react";
import type { SocialLinkRow, SocialPlatform } from "@/types/db";

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface PlatformMeta {
  label: string;
  Icon: IconCmp;
  color: string;
  baseUrl?: string;
}

const PLATFORM_CONFIG: Record<SocialPlatform, PlatformMeta> = {
  discord: { label: "Discord", Icon: SiDiscord, color: "#5865F2" },
  twitch: {
    label: "Twitch",
    Icon: SiTwitch,
    color: "#9146FF",
    baseUrl: "https://twitch.tv/",
  },
  twitter: {
    label: "Twitter / X",
    Icon: SiX,
    color: "#FFFFFF",
    baseUrl: "https://x.com/",
  },
  youtube: {
    label: "YouTube",
    Icon: SiYoutube,
    color: "#FF0000",
    baseUrl: "https://youtube.com/",
  },
  instagram: {
    label: "Instagram",
    Icon: SiInstagram,
    color: "#E4405F",
    baseUrl: "https://instagram.com/",
  },
  tiktok: {
    label: "TikTok",
    Icon: SiTiktok,
    color: "#FFFFFF",
    baseUrl: "https://tiktok.com/@",
  },
  kick: { label: "Kick", Icon: SiKick, color: "#53FC18", baseUrl: "https://kick.com/" },
  liquipedia: { label: "Liquipedia", Icon: BookOpen as IconCmp, color: "#FFFFFF" },
  opgg: { label: "OP.GG", Icon: BarChart3 as IconCmp, color: "#5383E8" },
  tracker: { label: "Tracker.gg", Icon: Target as IconCmp, color: "#FF4655" },
  website: { label: "Website", Icon: Globe as IconCmp, color: "#FFFFFF" },
};

function resolveUrl(link: SocialLinkRow): string | null {
  const value = link.handle_or_url;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const config = PLATFORM_CONFIG[link.platform];
  if (config?.baseUrl) return `${config.baseUrl}${value.replace(/^@/, "")}`;
  return null;
}

interface SocialLinksSectionProps {
  links: SocialLinkRow[];
  /**
   * Public-profile slug. When provided, clicks are tracked for analytics.
   * Omit on the dashboard live preview / marketing demos so they don't count.
   */
  slug?: string;
}

export function SocialLinksSection({ links, slug }: SocialLinksSectionProps) {
  if (links.length === 0) return null;

  const trackClick = (linkId: string) => {
    if (!slug) return;
    try {
      fetch(`/api/profile/${slug}/social-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore — analytics is best-effort
    }
  };

  return (
    <section className="border-t border-border-subtle pt-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {links.map((link) => {
          const config = PLATFORM_CONFIG[link.platform];
          const url = resolveUrl(link);
          const Icon = config?.Icon;
          const color = config?.color ?? "#FFFFFF";

          const btn = (
            <span
              className="group flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-text-muted transition-all duration-150 hover:border-border-default hover:bg-surface-2"
              style={{ ["--brand" as string]: color }}
              title={`${config?.label ?? link.platform} — ${link.handle_or_url}`}
            >
              {Icon && (
                <Icon
                  size={16}
                  className="transition-colors duration-150 group-hover:text-[var(--brand)]"
                />
              )}
            </span>
          );

          if (url) {
            return (
              <a
                key={link.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${config?.label ?? link.platform}`}
                onClick={() => trackClick(link.id)}
                onAuxClick={() => trackClick(link.id)}
              >
                {btn}
              </a>
            );
          }
          return <span key={link.id}>{btn}</span>;
        })}
      </div>
    </section>
  );
}
