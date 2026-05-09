"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  formatRankDisplay,
  formatLpRr,
  formatLastRefreshed,
  getRankColour,
} from "@/lib/utils/rank";
import type { GameConnectionRow } from "@/types/db";

interface ConnectionsCardProps {
  connections: GameConnectionRow[];
  onUpdate: (connections: GameConnectionRow[]) => void;
}

const GAME_LABEL: Record<string, { name: string; icon: string }> = {
  lol: { name: "League of Legends", icon: "⚔️" },
  valorant: { name: "Valorant", icon: "🎯" },
  cs2: { name: "Counter-Strike 2", icon: "🔫" },
};

export function ConnectionsCard({
  connections,
  onUpdate,
}: ConnectionsCardProps) {
  const [riotId, setRiotId] = useState("");
  const [riotLoading, setRiotLoading] = useState(false);
  const [riotError, setRiotError] = useState<string>();

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string>();

  const hasRiot = connections.some(
    (c) => c.game === "lol" || c.game === "valorant",
  );

  const handleAddRiot = async () => {
    if (!riotId.includes("#")) {
      setRiotError("Use format: Name#TAG");
      return;
    }
    setRiotLoading(true);
    setRiotError(undefined);
    try {
      const res = await fetch("/api/connect/riot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId, games: ["lol", "valorant"] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRiotError(data.error ?? "Failed to connect");
        return;
      }
      // Refetch all
      await reloadConnections();
      setRiotId("");
    } catch {
      setRiotError("Network error");
    } finally {
      setRiotLoading(false);
    }
  };

  const reloadConnections = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      onUpdate(data.gameConnections ?? []);
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
      setTimeout(() => setRefreshMsg(undefined), 3000);
    }
  };

  return (
    <CardShell
      title="Game Accounts"
      subtitle="Live verified ranks"
      icon="🎮"
      rightSlot={
        connections.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            className="rounded-md border border-border-subtle bg-bg-base px-2 py-1 text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-border-default hover:text-text-primary disabled:opacity-50"
          >
            {refreshing ? "..." : "↻ Refresh"}
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {/* Connection list */}
        {connections.length === 0 ? (
          <p className="text-sm text-text-muted">
            No game accounts connected yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {connections.map((conn) => {
              const meta = GAME_LABEL[conn.game] ?? {
                name: conn.game,
                icon: "🎮",
              };
              const rank = formatRankDisplay(
                conn.rank_tier,
                conn.rank_division,
              );
              const lp = formatLpRr(conn.lp_rr, conn.game);
              return (
                <li
                  key={conn.id}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-base p-3"
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {meta.name}
                    </p>
                    <p className="truncate font-mono text-xs text-text-muted">
                      {conn.account_name ?? "Unknown account"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-display text-sm font-bold tracking-wide"
                      style={{
                        color: getRankColour(conn.rank_tier),
                      }}
                    >
                      {rank ?? "Unranked"}
                    </p>
                    {lp && (
                      <p className="text-[10px] text-text-muted">{lp}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {refreshMsg && (
          <p className="text-xs text-text-secondary">{refreshMsg}</p>
        )}

        {/* Add Riot account form */}
        {!hasRiot && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border-subtle bg-bg-base p-3">
            <p className="text-xs font-medium text-text-secondary">
              Add Riot Account (LoL + Valorant)
            </p>
            <div className="flex gap-2">
              <Input
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                placeholder="Name#TAG"
                error={riotError}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handleAddRiot}
                isLoading={riotLoading}
                disabled={!riotId.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {connections.length > 0 && (
          <p className="text-[10px] text-text-muted">
            Last refreshed:{" "}
            {formatLastRefreshed(
              Math.max(
                ...connections.map((c) => c.last_refreshed_at ?? 0),
              ),
            )}
          </p>
        )}
      </div>
    </CardShell>
  );
}
