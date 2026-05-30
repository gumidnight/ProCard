import { DiscordLogo } from "@/components/ui/DiscordLogo";
import { Reveal } from "./Reveal";

export function FinalCtaSection() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-border-default bg-surface-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--accent-soft), transparent 60%)",
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <Reveal>
          <h2 className="font-display text-[36px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            Your card. Your link. Live in a minute.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          {/* OAuth start: a real navigation to the API route, not client-side <Link>. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/discord"
            className="inline-flex items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[#5865F2] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(88,101,242,0.7)] transition-all hover:bg-[#4752C4] hover:shadow-[0_12px_32px_-12px_rgba(88,101,242,0.9)]"
          >
            <DiscordLogo size={18} />
            Continue with Discord
          </a>
        </Reveal>

        <p className="font-mono text-[11px] text-text-muted">
          Free. No credit card. Delete anytime.
        </p>
      </div>
    </section>
  );
}
