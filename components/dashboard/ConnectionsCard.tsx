"use client";

import { useState } from "react";
import { X, Plus, RefreshCw, Download } from "lucide-react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GameLogo } from "@/components/ui/GameLogo";
import { RankEmblem } from "@/components/ui/RankEmblem";
import { withAlpha } from "@/lib/utils/color";
import {
  formatRankDisplay,
  formatLpRr,
  formatLastRefreshed,
  getRankColour,
  getRankHex,
  getFaceitLabel,
} from "@/lib/utils/rank";
import { RIOT_REGIONS, type RiotRegion } from "@/lib/api/riot-regions";
import type { GameConnectionRow } from "@/types/db";

type GameId = "lol" | "valorant" | "tft" | "cs2";

interface GameSection {
  id: GameId;
  name: string;
  type: "riot" | "cs2";
  defaultQueue: GameConnectionRow["queue_type"];
}

const GAME_SECTIONS: GameSection[] = [
  { id: "lol", name: "League of Legends", type: "riot", defaultQueue: "RANKED_SOLO_5x5" },
  { id: "valorant", name: "Valorant", type: "riot", defaultQueue: "competitive" },
  { id: "tft", name: "Teamfight Tactics", type: "riot", defaultQueue: "RANKED_TFT" },
  { id: "cs2", name: "Counter-Strike 2", type: "cs2", defaultQueue: "premier" },
];

interface ConnectionsCardProps {
  connections: GameConnectionRow[];
  onUpdate: (connections: GameConnectionRow[]) => void;
}

export function ConnectionsCard({ connections, onUpdate }: ConnectionsCardProps) {
  const [openForms, setOpenForms] = useState<Set<GameId>>(new Set());
  const [riotId, setRiotId] = useState<Record<GameId, string>>({
    lol: "",
    valorant: "",
    tft: "",
    cs2: "",
  });
  const [region, setRegion] = useState<Record<GameId, RiotRegion>>({
    lol: "euw1",
    valorant: "euw1",
    tft: "euw1",
    cs2: "euw1",
  });
  const [faceitNick, setFaceitNick] = useState("");
  const [loadingGame, setLoadingGame] = useState<GameId | null>(null);
  const [errors, setErrors] = useState<Partial<Record<GameId, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string>();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const reloadConnections = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      onUpdate(data.gameConnections ?? []);
    }
  };

  const toggleForm = (game: GameId) =>
    setOpenForms((prev) => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game);
      else next.add(game);
      return next;
    });

  const clearError = (game: GameId) =>
    setErrors((e) => {
      const n = { ...e };
      delete n[game];
      return n;
    });

  const handleAddRiot = async (game: GameId) => {
    const id = riotId[game].trim();
    if (!id.includes("#")) {
      setErrors((e) => ({ ...e, [game]: "Use format: Name#TAG" }));
      return;
    }
    setLoadingGame(game);
    clearError(game);
    try {
      const res = await fetch("/api/connect/riot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId: id, region: region[game], game }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((e) => ({ ...e, [game]: data.error ?? "Failed to connect" }));
        return;
      }
      await reloadConnections();
      setRiotId((r) => ({ ...r, [game]: "" }));
      setOpenForms((prev) => {
        const n = new Set(prev);
        n.delete(game);
        return n;
      });
    } catch {
      setErrors((e) => ({ ...e, [game]: "Network error" }));
    } finally {
      setLoadingGame(null);
    }
  };

  const handleAddCS2 = async () => {
    const nick = faceitNick.trim();
    if (!nick) return;
    setLoadingGame("cs2");
    clearError("cs2");
    try {
      const res = await fetch("/api/profile/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "cs2", faceitNickname: nick }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((e) => ({ ...e, cs2: data.error ?? "Failed to add" }));
        return;
      }
      await reloadConnections();
      setFaceitNick("");
      setOpenForms((prev) => {
        const n = new Set(prev);
        n.delete("cs2");
        return n;
      });
    } catch {
      setErrors((e) => ({ ...e, cs2: "Network error" }));
    } finally {
      setLoadingGame(null);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`/api/profile/connections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await reloadConnections();
    } catch {
      /* ignore */
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisible: number) => {
    setTogglingId(id);
    try {
      await fetch("/api/profile/connections/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, visible: currentVisible === 0 }),
      });
      await reloadConnections();
    } catch {
      /* ignore */
    } finally {
      setTogglingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(undefined);
    try {
      const res = await fetch("/api/ranks/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRefreshMsg(data.error ?? "Refresh failed");
      } else {
        setRefreshMsg("Ranks updated");
        await reloadConnections();
      }
    } catch {
      setRefreshMsg("Network error");
    } finally {
      setRefreshing(false);
      window.setTimeout(() => setRefreshMsg(undefined), 3000);
    }
  };

  const totalConnected = connections.length;

  return (
    <CardShell
      title="Game Accounts"
      subtitle="Live verified ranks"
      icon=""
      rightSlot={
        totalConnected > 0 ? (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-0 px-2 py-1 text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-border-default hover:text-text-primary disabled:opacity-50"
          >
            <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh all"}
          </button>
        ) : undefined
      }
    >
      <LolprosImport onImported={reloadConnections} />

      <div className="flex flex-col divide-y divide-border-subtle">
        {GAME_SECTIONS.map((section, i) => {
          const gameConns = connections.filter((c) => c.game === section.id);
          const formOpen = openForms.has(section.id);

          return (
            <div key={section.id} className={i === 0 ? "" : "pt-4"}>
              {/* Section header */}
              <div
                className={`flex items-center justify-between ${i === 0 ? "mb-3" : "mb-3 "}`}
              >
                <div className="flex items-center gap-2">
                  <GameLogo game={section.id} size={14} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
                    {section.name}
                  </span>
                  {gameConns.length > 0 && (
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-text-muted">
                      {gameConns.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleForm(section.id)}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    formOpen
                      ? "text-text-muted hover:text-text-secondary"
                      : "text-accent hover:text-accent-hover"
                  }`}
                >
                  <Plus
                    size={11}
                    className={`transition-transform ${formOpen ? "rotate-45" : ""}`}
                  />
                  {formOpen ? "Cancel" : "Add"}
                </button>
              </div>

              {/* Connected accounts */}
              {gameConns.length > 0 && (
                <ul className="mb-3 flex flex-col gap-2">
                  {gameConns.map((conn) => (
                    <AccountRow
                      key={conn.id}
                      conn={conn}
                      removing={removingId === conn.id}
                      toggling={togglingId === conn.id}
                      onRemove={handleRemove}
                      onToggle={handleToggleVisibility}
                    />
                  ))}
                </ul>
              )}

              {/* Inline add form */}
              {formOpen && (
                <div className="mb-3 rounded-lg border border-dashed border-border-subtle bg-surface-0 p-3">
                  {section.type === "riot" ? (
                    <>
                      <div className="flex gap-2">
                        <select
                          value={region[section.id]}
                          onChange={(e) =>
                            setRegion((r) => ({
                              ...r,
                              [section.id]: e.target.value as RiotRegion,
                            }))
                          }
                          className="rounded-md border border-border-subtle bg-surface-1 px-2 py-2 text-[12px] text-text-primary focus:border-border-default focus:outline-none"
                        >
                          {RIOT_REGIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={riotId[section.id]}
                          onChange={(e) =>
                            setRiotId((r) => ({ ...r, [section.id]: e.target.value }))
                          }
                          placeholder="Name#TAG"
                          error={errors[section.id]}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddRiot(section.id);
                          }}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleAddRiot(section.id)}
                          isLoading={loadingGame === section.id}
                          disabled={!riotId[section.id].trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-text-muted">
                        Riot ID format: Name#TAG (e.g. Faker#KR1)
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          value={faceitNick}
                          onChange={(e) => setFaceitNick(e.target.value)}
                          placeholder="Faceit nickname"
                          error={errors.cs2}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddCS2();
                          }}
                        />
                        <Button
                          variant="secondary"
                          onClick={handleAddCS2}
                          isLoading={loadingGame === "cs2"}
                          disabled={!faceitNick.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-text-muted">
                        Your Faceit username (case-sensitive)
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {refreshMsg && <p className="mt-2 text-[11px] text-text-secondary">{refreshMsg}</p>}
    </CardShell>
  );
}

// ---------------------------------------------------------------------------
// lolpros.gg bulk import (LoL only)
// ---------------------------------------------------------------------------

function LolprosImport({ onImported }: { onImported: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<string>();

  const handleImport = async () => {
    const v = url.trim();
    if (!v) return;
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const res = await fetch("/api/connect/lolpros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: v }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      const parts: string[] = [];
      if (data.imported) parts.push(`${data.imported} added`);
      if (data.updated) parts.push(`${data.updated} updated`);
      setResult(
        parts.length
          ? `${data.player?.name ?? "Player"}: ${parts.join(", ")}.`
          : "All accounts were already connected.",
      );
      setUrl("");
      await onImported();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-border-subtle bg-surface-0 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2">
          <Download size={13} className="text-accent" />
          <span className="text-[12px] font-medium text-text-primary">
            Import LoL accounts from lolpros.gg
          </span>
        </span>
        <Plus
          size={13}
          className={`text-text-muted transition-transform ${open ? "rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://lolpros.gg/player/vladi"
              error={error}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImport();
              }}
            />
            <Button
              variant="secondary"
              onClick={handleImport}
              isLoading={loading}
              disabled={!url.trim()}
            >
              Import
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-text-muted">
            Pulls every linked League account. Unranked smurfs are imported hidden — show
            them anytime. These are imported, not ownership-verified.
          </p>
          {result && <p className="mt-1.5 text-[11px] text-green-400">{result}</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account row
// ---------------------------------------------------------------------------

interface AccountRowProps {
  conn: GameConnectionRow;
  removing: boolean;
  toggling: boolean;
  onRemove: (id: string) => void;
  onToggle: (id: string, currentVisible: number) => void;
}

function AccountRow({ conn, removing, toggling, onRemove, onToggle }: AccountRowProps) {
  const isCs2 = conn.game === "cs2";
  const rankKey =
    isCs2 && conn.skill_level ? `FACEIT_${conn.skill_level}` : conn.rank_tier;
  const hex = getRankHex(rankKey);
  const colour = getRankColour(rankKey);
  const display = isCs2
    ? getFaceitLabel(conn.skill_level)
    : formatRankDisplay(conn.rank_tier, conn.rank_division);
  const lp = formatLpRr(conn.lp_rr, conn.game);
  const hidden = !conn.is_visible;

  return (
    <li
      className={`group relative overflow-hidden rounded-[var(--radius-lg)] border bg-surface-1 transition-opacity ${hidden ? "opacity-50" : ""}`}
      style={{ borderColor: withAlpha(hex, 0.2) }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: colour }}
      />
      <div
        aria-hidden
        className="absolute right-0 top-0 h-full w-1/3 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]"
        style={{
          background: `radial-gradient(circle at 80% 50%, ${withAlpha(hex, 0.28)}, transparent 70%)`,
        }}
      />
      <div className="relative flex items-center gap-2.5 px-3 py-2.5">
        <RankEmblem
          tier={conn.rank_tier}
          skillLevel={conn.skill_level}
          game={conn.game}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <p
            className="font-display text-[15px] font-bold leading-none tracking-[0.02em] tabular-nums"
            style={{ color: colour }}
          >
            {display ?? "Unranked"}
            {lp && (
              <span
                className="ml-1.5 font-mono text-[11px] font-normal"
                style={{ color: withAlpha(colour, 0.75) }}
              >
                {lp}
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
            {conn.account_name ?? conn.faceit_nickname ?? "—"}
            {conn.region && (
              <span className="ml-1.5 uppercase">
                {conn.region.replace(/\d+$/, "").toUpperCase()}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden font-mono text-[9px] text-text-muted sm:inline">
            {formatLastRefreshed(conn.last_refreshed_at)}
          </span>
          <button
            onClick={() => onToggle(conn.id, conn.is_visible)}
            disabled={toggling}
            title={conn.is_visible ? "Hide from profile" : "Show on profile"}
            className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider transition-colors disabled:opacity-40 ${
              conn.is_visible
                ? "border border-border-subtle text-text-muted hover:text-text-secondary"
                : "border border-warning/30 text-warning hover:border-warning/60"
            }`}
          >
            {toggling ? "…" : conn.is_visible ? "Hide" : "Show"}
          </button>
          <button
            onClick={() => onRemove(conn.id)}
            disabled={removing}
            title="Remove account"
            className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-40"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </li>
  );
}
