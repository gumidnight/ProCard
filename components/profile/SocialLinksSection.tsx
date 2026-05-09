"use client";

import type { SocialLinkRow } from "@/types/db";

const PLATFORM_CONFIG: Record<
  string,
  { label: string; baseUrl?: string }
> = {
  discord: { label: "Discord" },
  twitch: { label: "Twitch", baseUrl: "https://twitch.tv/" },
  twitter: { label: "Twitter / X", baseUrl: "https://x.com/" },
  youtube: { label: "YouTube", baseUrl: "https://youtube.com/" },
  instagram: { label: "Instagram", baseUrl: "https://instagram.com/" },
  tiktok: { label: "TikTok", baseUrl: "https://tiktok.com/" },
  kick: { label: "Kick", baseUrl: "https://kick.com/" },
  liquipedia: { label: "Liquipedia" },
  opgg: { label: "OP.GG" },
  tracker: { label: "Tracker.gg" },
  website: { label: "Website" },
};

function resolveUrl(link: SocialLinkRow): string | null {
  const value = link.handle_or_url;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const config = PLATFORM_CONFIG[link.platform];
  if (config?.baseUrl) {
    return `${config.baseUrl}${value.replace(/^@/, "")}`;
  }
  return null;
}

interface SocialLinksSectionProps {
  links: SocialLinkRow[];
}

export function SocialLinksSection({
  links,
}: SocialLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        SOCIALS
      </p>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const config = PLATFORM_CONFIG[link.platform] ?? {
            label: link.platform,
          };
          const url = resolveUrl(link);
          const content = (
            <div className="flex items-center gap-3 rounded-[10px] border border-border-subtle bg-bg-surface px-4 py-3 text-sm transition-colors duration-[180ms] hover:border-border-default">
              <span className="font-medium text-text-primary">
                {config.label}
              </span>
              <span className="ml-auto font-mono text-xs text-text-muted">
                {link.handle_or_url}
              </span>
            </div>
          );

          if (url) {
            return (
              <a
                key={link.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            );
          }
          return <div key={link.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
