"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DiscordLogo } from "@/components/ui/DiscordLogo";
import { GameLogo } from "@/components/ui/GameLogo";
import { HERO_DEMO } from "@/lib/constants/demo-profiles";
import { formatRankDisplay, getRankColour } from "@/lib/utils/rank";
import { Reveal } from "./Reveal";

export function ScoutScenarioSection() {
  return (
    <section id="scenario" className="relative overflow-hidden bg-surface-0">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--accent-soft), transparent 65%)",
        }}
      />

      <div className="relative mx-auto grid max-w-5xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Built for the DM
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary md:text-[36px]">
            &ldquo;Got a ProCard?&rdquo;
          </h2>
          <ul className="mt-5 flex flex-col gap-2 text-[14px] text-text-secondary">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-accent" />
              Live rank, not a screenshot from two patches ago.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-accent" />
              Team history with org logos and tournament context.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-accent" />
              Status flag so messages land at the right time.
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="relative">
          <DmMockup />
        </Reveal>
      </div>
    </section>
  );
}

function DmMockup() {
  const reduced = useReducedMotion();
  const base = reduced
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto max-w-[440px] rounded-[var(--radius-xl)] border border-border-default bg-surface-1 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-border-subtle px-2 pb-3">
        <DiscordLogo size={16} className="text-[#5865F2]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Example direct message
        </span>
      </div>

      <div className="flex flex-col gap-3 px-1 pt-4">
        <motion.div
          {...base}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <DmRow author="Scout" time="14:02">
            saw your climb. you on a roster?
          </DmRow>
        </motion.div>

        <motion.div
          {...base}
          transition={{ duration: 0.6, delay: 1.4 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
          className="self-end"
        >
          <DmRow author="You" time="14:03" self>
            free agent. looking for spring.
          </DmRow>
        </motion.div>

        <motion.div
          {...base}
          transition={{ duration: 0.6, delay: 2.4 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <DmRow author="Scout" time="14:03">
            got a procard?
          </DmRow>
        </motion.div>

        <motion.div
          {...base}
          transition={{ duration: 0.6, delay: 3.4 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
          className="self-end"
        >
          <DmRichLinkRow />
        </motion.div>

        <motion.div
          {...base}
          transition={{ duration: 0.6, delay: 4.4 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
          className="self-start mt-1 flex items-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-3 py-1"
        >
          <TypingDots />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Scout is typing
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-text-muted"
          style={{
            animation: "livePulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

interface DmRowProps {
  author: string;
  time: string;
  children: React.ReactNode;
  self?: boolean;
}

function DmRow({ author, time, children, self }: DmRowProps) {
  return (
    <div className={`flex flex-col gap-1 ${self ? "items-end" : "items-start"}`}>
      <div className="flex items-baseline gap-2">
        <span
          className="font-display text-[12px] font-bold tracking-[0.04em]"
          style={{ color: self ? "var(--accent)" : "var(--text-secondary)" }}
        >
          {author}
        </span>
        <span className="font-mono text-[10px] text-text-muted">{time}</span>
      </div>
      <div
        className={`max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-[13px] leading-relaxed ${
          self
            ? "border border-accent/30 bg-[var(--accent-soft)] text-text-primary"
            : "border border-border-subtle bg-surface-2 text-text-primary"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * "You" sends procard.gg/you — rendered as a Discord-style rich link
 * embed pulling Faker's avatar, name, role, and live rank from HERO_DEMO.
 */
function DmRichLinkRow() {
  const { profile, connections, avatarUrl } = HERO_DEMO;
  const top = connections[0];
  const rankColour = top ? getRankColour(top.rank_tier) : "var(--text-muted)";
  const rankLabel = top ? formatRankDisplay(top.rank_tier, top.rank_division) : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-baseline gap-2">
        <span
          className="font-display text-[12px] font-bold tracking-[0.04em]"
          style={{ color: "var(--accent)" }}
        >
          You
        </span>
        <span className="font-mono text-[10px] text-text-muted">14:04</span>
      </div>

      <a
        href={`/${profile.slug}`}
        target="_blank"
        rel="noreferrer"
        className="group flex w-full max-w-[320px] flex-col gap-2 rounded-[var(--radius-md)] border-l-2 border-accent bg-surface-2/70 px-3 py-2.5 transition-colors hover:bg-surface-2"
      >
        <span className="font-mono text-[11px] text-accent group-hover:underline">
          procard.gg/{profile.slug}
        </span>

        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-full border border-border-default object-cover"
            />
          ) : (
            <div className="size-9 shrink-0 rounded-full border border-border-default bg-surface-3" />
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-display text-[13px] font-bold tracking-[0.02em] text-text-primary">
              {profile.display_name}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
              {profile.current_role ?? "Player"}
              {profile.current_team_name && ` · ${profile.current_team_name}`}
            </p>
          </div>
        </div>

        {top && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-0 px-2 py-1.5">
            <GameLogo game={top.game} size={14} />
            <span
              className="font-display text-[12px] font-bold tabular-nums"
              style={{ color: rankColour }}
            >
              {rankLabel}
            </span>
          </div>
        )}
      </a>
    </div>
  );
}
