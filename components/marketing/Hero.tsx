import Link from "next/link";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LiveRanksSection } from "@/components/profile/LiveRanksSection";
import { CompetitiveHistorySection } from "@/components/profile/CompetitiveHistorySection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { HERO_DEMO } from "@/lib/constants/demo-profiles";
import { Reveal } from "./Reveal";
import { OpenLoginButton } from "./OpenLoginButton";

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Soft accent glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[15%] h-[520px] w-[520px] rounded-full opacity-50 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--accent-soft), transparent 60%)",
        }}
      />
      {/* Faint grid for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-16 lg:py-32">
        {/* Left — copy */}
        <Reveal className="flex flex-col gap-6">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            For competitive players
          </p>
          <h1 className="font-display text-[44px] font-bold leading-[1.05] tracking-[0.02em] text-text-primary md:text-[56px]">
            Your verified
            <br />
            esports identity.
            <br />
            One link.
          </h1>
          <p className="max-w-md text-[16px] leading-relaxed text-text-secondary">
            Live ranks pulled from Riot and Faceit. Team history, socials, status — built
            for players who get scouted.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <OpenLoginButton>Create your card</OpenLoginButton>
            <Link
              href="/faker"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default px-5 py-3 text-[14px] font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              See example
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Supported Games
            </span>
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              League of Legends
            </span>
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Valorant
            </span>
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              CS2
            </span>
          </div>
        </Reveal>

        {/* Right — rendered example card */}
        <Reveal delay={0.15} className="relative">
          {/* "EXAMPLE" tag floating above */}
          <div className="absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-default bg-surface-2 px-3 py-1 shadow-lg">
            <span
              className="size-1.5 rounded-full bg-success"
              style={{ animation: "livePulse 2s ease-in-out infinite" }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Live example
            </span>
          </div>

          <div className="relative mx-auto max-w-[420px] rounded-[var(--radius-xl)] border border-border-default bg-surface-0 p-6 shadow-[0_40px_100px_-30px_rgba(255,92,0,0.25),0_20px_60px_-30px_rgba(0,0,0,0.8)]">
            {/* Top accent strip */}
            <div
              aria-hidden
              className="absolute inset-x-6 top-0 h-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--accent), transparent)",
              }}
            />
            {/* Diagonal sheen sweep — slow, esports highlight feel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)]"
            >
              <div
                className="absolute -inset-x-6 h-24 -skew-y-12"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(255,92,0,0.10), transparent)",
                  animation: "sheenSweep 7s ease-in-out infinite",
                  animationDelay: "2s",
                }}
              />
            </div>
            {/* Corner brackets — tournament chrome */}
            <CornerBrackets />
            <div className="relative flex flex-col gap-6">
              <ProfileHeader
                profile={HERO_DEMO.profile}
                rolesPlayed={HERO_DEMO.rolesPlayed}
                avatarUrl={HERO_DEMO.avatarUrl}
              />
              <LiveRanksSection connections={HERO_DEMO.connections} />
              <CompetitiveHistorySection entries={HERO_DEMO.teamHistory.slice(0, 1)} />
              <SocialLinksSection links={HERO_DEMO.socials} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CornerBrackets() {
  const common = "pointer-events-none absolute size-4 border-accent/60";
  return (
    <>
      <span aria-hidden className={`${common} left-2 top-2 border-l-2 border-t-2`} />
      <span aria-hidden className={`${common} right-2 top-2 border-r-2 border-t-2`} />
      <span aria-hidden className={`${common} bottom-2 left-2 border-b-2 border-l-2`} />
      <span aria-hidden className={`${common} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}
