"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
  const [faceitNickname, setFaceitNickname] = useState("");
  const [faceitLoading, setFaceitLoading] = useState(false);
  const [faceitError, setFaceitError] = useState<string>();

  const handleRiotConnect = () => {
    // Riot RSO OAuth — redirect to connect endpoint
    // For now, placeholder since we need Riot client credentials
    window.location.href = "/api/connect/riot";
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
      {(selectedGames.includes("lol") ||
        selectedGames.includes("valorant")) && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Riot Account
                </p>
                <p className="text-xs text-text-muted">
                  Covers League of Legends & Valorant
                </p>
              </div>
            </div>
            {connections.lol.connected ||
            connections.valorant.connected ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span>✓</span>
                <span>
                  {connections.lol.accountName ??
                    connections.valorant.accountName}
                </span>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={handleRiotConnect}
              >
                Connect Riot
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Note: Riot RSO OAuth requires approved credentials. You can
            skip this for now and connect later.
          </p>
        </div>
      )}

      {/* Faceit (CS2) */}
      {selectedGames.includes("cs2") && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔫</span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Faceit Account
              </p>
              <p className="text-xs text-text-muted">
                CS2 ELO and skill level
              </p>
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
