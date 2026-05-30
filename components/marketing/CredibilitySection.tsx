"use client";

import { useState } from "react";
import { RankCard } from "@/components/profile/LiveRanksSection";
import { GameLogo } from "@/components/ui/GameLogo";
import { Reveal } from "./Reveal";
import type { GameConnectionRow } from "@/types/db";

const NOW = Math.floor(Date.now() / 1000);
const RECENT = NOW - 240;

function makeConn(
  c: Partial<GameConnectionRow> & { id: string; game: string },
): GameConnectionRow {
  return {
    profile_id: "demo-credibility",
    puuid: null,
    account_name: null,
    summoner_id: null,
    riot_access_token: null,
    riot_refresh_token: null,
    riot_token_expires_at: null,
    faceit_player_id: null,
    faceit_nickname: null,
    rank_tier: null,
    rank_division: null,
    lp_rr: null,
    skill_level: null,
    peak_rank_tier: null,
    peak_rank_division: null,
    region: "euw1",
    queue_type: "RANKED_SOLO_5x5",
    is_visible: 1,
    last_refreshed_at: RECENT,
    created_at: NOW,
    updated_at: NOW,
    ...c,
  };
}

const GAME_TABS = [
  {
    key: "lol",
    label: "LoL",
    connection: makeConn({
      id: "cred-lol",
      game: "lol",
      account_name: "Kairos#EUW",
      rank_tier: "DIAMOND",
      rank_division: "II",
      lp_rr: 67,
      region: "euw1",
      queue_type: "RANKED_SOLO_5x5",
    }),
  },
  {
    key: "valorant",
    label: "Valorant",
    connection: makeConn({
      id: "cred-val",
      game: "valorant",
      account_name: "Lunaire#000",
      rank_tier: "IMMORTAL",
      rank_division: "II",
      lp_rr: 280,
      region: "eu",
      queue_type: "competitive",
    }),
  },
  {
    key: "cs2",
    label: "CS2",
    connection: makeConn({
      id: "cred-cs2",
      game: "cs2",
      faceit_nickname: "ashen-cs",
      skill_level: 8,
      region: "eu",
      queue_type: "premier",
    }),
  },
];

export function CredibilitySection() {
  return (
    <section id="verification" className="border-y border-border-subtle bg-surface-1">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Verification
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[0.02em] text-text-primary">
            Ranks come from the source.
          </h2>
          <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-text-secondary">
            Every rank on your ProCard is pulled live from the official API. Refresh
            updates within 30 minutes of your last game. Nothing on your profile is
            something you typed in.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Riot Games
            </span>
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              League of Legends
            </span>
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Valorant
            </span>
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Faceit
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="flex items-center justify-center">
          <RankShowcase />
        </Reveal>
      </div>
    </section>
  );
}

function RankShowcase() {
  const [activeKey, setActiveKey] = useState("lol");
  const activeTab = GAME_TABS.find((t) => t.key === activeKey) ?? GAME_TABS[0];

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-3">
      {/* Game tabs */}
      <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-0 p-1">
        {GAME_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-[11px] font-semibold transition-all duration-150",
              activeKey === tab.key
                ? "bg-surface-2 text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary",
            ].join(" ")}
          >
            <GameLogo game={tab.key} size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actual RankCard with real emblem + styling */}
      <RankCard connection={activeTab.connection} />
    </div>
  );
}
