import { MessageCircle, Link2, Share2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { OpenLoginButton } from "./OpenLoginButton";

const STEPS = [
  {
    n: "01",
    icon: MessageCircle,
    title: "Sign in with Discord",
    body: "No email, no password. We only read your name and avatar.",
  },
  {
    n: "02",
    icon: Link2,
    title: "Connect your Riot account",
    body: "One-click via Riot SSO, or paste your Riot ID and region.",
  },
  {
    n: "03",
    icon: Share2,
    title: "Share procard.gg/you",
    body: "Drop it in your bio, your team chat, your scout DMs.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border-subtle bg-surface-0">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            Live in 60 seconds.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body }, i) => (
            <Reveal key={n} delay={i * 0.1} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[28px] font-bold tracking-[0.04em] text-accent">
                  {n}
                </span>
                <Icon className="size-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-[18px] font-semibold tracking-[0.02em] text-text-primary">
                {title}
              </h3>
              <p className="text-[14px] leading-relaxed text-text-secondary">{body}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <OpenLoginButton>Start with Discord</OpenLoginButton>
        </div>
      </div>
    </section>
  );
}
