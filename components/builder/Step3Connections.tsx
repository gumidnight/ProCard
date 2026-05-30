"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RIOT_REGIONS, type RiotRegion } from "@/lib/api/riot-regions";

interface ConnectionState {
  lol: { connected: boolean; accountName?: string };
  valorant: { connected: boolean; accountName?: string };
  cs2: { connected: boolean; accountName?: string; nickname?: string };
}

interface Step3Props {
  selectedGames: string[];
  connections: ConnectionState;
  onConnect: (game: string, data?: { nickname?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Connections({
  selectedGames,
  connections,
  onConnect,
  onNext,
  onBack,
}: Step3Props) {
  const [riotId, setRiotId] = useState("");
  const [riotRegion, setRiotRegion] = useState<RiotRegion>("euw1");
  const [riotLoading, setRiotLoading] = useState(false);
  const [riotError, setRiotError] = useState<string>();

  const [faceitNickname, setFaceitNickname] = useState("");
  const [faceitLoading, setFaceitLoading] = useState(false);
  const [faceitError, setFaceitError] = useState<string>();

  const handleRiotConnect = async () => {
    if (!riotId.includes("#")) {
      setRiotError("Use format: Name#TAG");
      return;
    }
    setRiotLoading(true);
    setRiotError(undefined);

    try {
      const riotGames = selectedGames.filter((g) => g === "lol" || g === "valorant");
      const res = await fetch("/api/connect/riot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId, region: riotRegion, games: riotGames }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRiotError(data.error ?? "Failed to connect");
        return;
      }

      const accountName = `${data.account.gameName}#${data.account.tagLine}`;
      for (const game of riotGames) {
        onConnect(game, { nickname: accountName });
      }
    } catch {
      setRiotError("Network error");
    } finally {
      setRiotLoading(false);
    }
  };

  const handleFaceitConnect = async () => {
    if (!faceitNickname.trim()) return;
    setFaceitLoading(true);
    setFaceitError(undefined);

    try {
      const res = await fetch("/api/connect/faceit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: faceitNickname.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFaceitError(data.error ?? "Failed to connect");
        return;
      }

      onConnect("cs2", { nickname: faceitNickname.trim() });
    } catch {
      setFaceitError("Network error");
    } finally {
      setFaceitLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide">
          Connect Accounts
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Link your game accounts for live verified ranks.
        </p>
      </div>

      {/* Riot (LoL + Valorant) */}
      {(selectedGames.includes("lol") || selectedGames.includes("valorant")) && (
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-border-subtle bg-surface-2 font-display text-[11px] font-bold tracking-wide text-text-secondary">
              RIOT
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">Riot Account</p>
              <p className="text-xs text-text-muted">
                Covers League of Legends & Valorant
              </p>
            </div>
          </div>

          {connections.lol.connected || connections.valorant.connected ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <span>✓</span>
              <span>
                Connected:{" "}
                {connections.lol.accountName ?? connections.valorant.accountName}
              </span>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex gap-2">
                <select
                  value={riotRegion}
                  onChange={(e) => setRiotRegion(e.target.value as RiotRegion)}
                  className="rounded-md border border-border-subtle bg-surface-0 px-2 py-2 text-sm text-text-primary focus:border-border-default focus:outline-none"
                >
                  {RIOT_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  placeholder="Name#TAG"
                  error={riotError}
                  hint="Your Riot ID (e.g. Faker#KR1)"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={handleRiotConnect}
                  isLoading={riotLoading}
                  disabled={!riotId.trim()}
                >
                  Connect
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Faceit (CS2) */}
      {selectedGames.includes("cs2") && (
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-border-subtle bg-surface-2 font-display text-[11px] font-bold tracking-wide text-text-secondary">
              CS2
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">Faceit Account</p>
              <p className="text-xs text-text-muted">CS2 ELO and skill level</p>
            </div>
          </div>

          {connections.cs2.connected ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <span>✓</span>
              <span>Connected: {connections.cs2.nickname}</span>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Input
                value={faceitNickname}
                onChange={(e) => setFaceitNickname(e.target.value)}
                placeholder="Your Faceit nickname"
                error={faceitError}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handleFaceitConnect}
                isLoading={faceitLoading}
                disabled={!faceitNickname.trim()}
              >
                Connect
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedGames.length === 0 && (
        <p className="text-sm text-text-muted">
          No games selected. Go back to pick your games.
        </p>
      )}

      <p className="text-xs text-text-muted">
        You can skip connections and add them later from your dashboard.
      </p>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next →</Button>
      </div>
    </div>
  );
}
