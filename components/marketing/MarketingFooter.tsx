import Link from "next/link";
import { ProCardLogo } from "@/components/ui/ProCardLogo";
import { DiscordLogo } from "@/components/ui/DiscordLogo";
import {
  TwitterLogo,
  YoutubeLogo,
  InstagramLogo,
  TwitchLogo,
} from "@/components/ui/BrandLogos";

const PRODUCT_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Examples", href: "#gallery" },
  { label: "Verification", href: "#credibility" },
  { label: "Comparison", href: "#comparison" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Documentation", href: "/docs" },
  { label: "Discord", href: "https://discord.gg", external: true },
  { label: "contact@procard.gg", href: "mailto:contact@procard.gg" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const SOCIALS: {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Discord",
    href: "https://discord.gg",
    Icon: ({ className }) => <DiscordLogo size={16} className={className} />,
  },
  {
    label: "X / Twitter",
    href: "https://twitter.com",
    Icon: ({ className }) => <TwitterLogo size={14} className={className} />,
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    Icon: ({ className }) => <YoutubeLogo size={16} className={className} />,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    Icon: ({ className }) => <InstagramLogo size={16} className={className} />,
  },
  {
    label: "Twitch",
    href: "https://twitch.tv",
    Icon: ({ className }) => <TwitchLogo size={16} className={className} />,
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface-0">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <ProCardLogo size={28} />
            <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">
              Your verified esports identity. Live ranks, team history, and socials — all
              on one link, built for competitive players.
            </p>
          </div>

          {/* Product */}
          <FooterColumn title="Product" links={PRODUCT_LINKS} />

          {/* Support */}
          <FooterColumn title="Support" links={SUPPORT_LINKS} />

          {/* Legal */}
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t border-border-subtle pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[11px] text-text-muted">
            © {new Date().getFullYear()} ProCard.gg · All rights reserved · Not affiliated
            with Riot Games, Valve, or Faceit.
          </p>

          <ul className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 text-text-muted transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-text-primary"
                >
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="font-display text-[14px] font-bold tracking-[0.04em] text-text-primary">
        {title}
      </h3>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map((link) => {
          const isExternal =
            link.external ||
            link.href.startsWith("http") ||
            link.href.startsWith("mailto:");
          const className =
            "text-[13px] text-text-secondary transition-colors hover:text-text-primary";
          return (
            <li key={link.label}>
              {isExternal ? (
                <a
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={className}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
