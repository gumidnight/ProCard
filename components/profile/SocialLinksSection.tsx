"use client";

import type { SocialLinkRow } from "@/types/db";

const PLATFORM_CONFIG: Record<
  string,
  { label: string; icon: string; baseUrl?: string }
> = {
  discord: { label: "Discord", icon: "💬" },
  twitch: { label: "Twitch", icon: "📺", baseUrl: "https://twitch.tv/" },
  twitter: { label: "Twitter / X", icon: "🐦", baseUrl: "https://x.com/" },
  youtube: { label: "YouTube", icon: "▶️", baseUrl: "https://youtube.com/" },
  opgg: { label: "OP.GG", icon: "📊" },
  tracker: { label: "Tracker.gg", icon: "📈" },
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
      <h2 className="font-display text-lg font-semibold tracking-wide text-text-secondary">
        Socials
      </h2>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const config = PLATFORM_CONFIG[link.platform] ?? {
            label: link.platform,
            icon: "🔗",
          };
          const url = resolveUrl(link);
          const content = (
            <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-default">
              <span>{config.icon}</span>
              <span className="font-medium text-text-primary">
                {config.label}
              </span>
              <span className="ml-auto text-text-muted">
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
