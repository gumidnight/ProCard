"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const GAMES = [
  { id: "lol", name: "League of Legends", short: "LoL" },
  { id: "valorant", name: "Valorant", short: "VAL" },
  { id: "cs2", name: "CS2", short: "CS2" },
] as const;

const ROLES_BY_GAME: Record<string, string[]> = {
  lol: ["Top", "Jungle", "Mid", "ADC", "Support"],
  valorant: ["Duelist", "Initiator", "Controller", "Sentinel"],
  cs2: ["Entry Fragger", "AWPer", "Lurker", "IGL", "Support", "Rifler"],
};

interface RoleEntry {
  game: string;
  role: string;
  is_main: boolean;
}

interface Step2Data {
  selectedGames: string[];
  roles: RoleEntry[];
}

interface Step2Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Games({ data, onChange, onNext, onBack }: Step2Props) {
  const toggleGame = (gameId: string) => {
    const selected = data.selectedGames.includes(gameId)
      ? data.selectedGames.filter((g) => g !== gameId)
      : [...data.selectedGames, gameId];

    // Remove roles for deselected games
    const roles = data.roles.filter((r) => selected.includes(r.game));
    onChange({ selectedGames: selected, roles });
  };

  const toggleRole = (game: string, role: string) => {
    const exists = data.roles.find((r) => r.game === game && r.role === role);
    const roles = exists
      ? data.roles.filter((r) => !(r.game === game && r.role === role))
      : [...data.roles, { game, role, is_main: false }];
    onChange({ ...data, roles });
  };

  const toggleMain = (game: string, role: string) => {
    const roles = data.roles.map((r) => {
      if (r.game === game && r.role === role) {
        return { ...r, is_main: !r.is_main };
      }
      // Only one main per game
      if (r.game === game && r.is_main) {
        return { ...r, is_main: false };
      }
      return r;
    });
    onChange({ ...data, roles });
  };

  const canProceed = data.selectedGames.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide">Games & Roles</h2>
        <p className="mt-1 text-sm text-text-secondary">What do you play?</p>
      </div>

      {/* Game selection */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text-secondary">
          Select your games
        </label>
        <div className="flex flex-wrap gap-2">
          {GAMES.map((game) => {
            const selected = data.selectedGames.includes(game.id);
            return (
              <button
                key={game.id}
                onClick={() => toggleGame(game.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-accent bg-accent/10 text-accent-hover"
                    : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-default"
                }`}
              >
                <span className="font-display text-[11px] font-bold tracking-wide">
                  {game.short}
                </span>
                {game.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role selection per game */}
      {data.selectedGames.map((gameId) => {
        const game = GAMES.find((g) => g.id === gameId);
        const roles = ROLES_BY_GAME[gameId] ?? [];
        const selectedRoles = data.roles.filter((r) => r.game === gameId);

        return (
          <div key={gameId} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              {game?.name} roles
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const isSelected = selectedRoles.some((r) => r.role === role);
                const isMain = selectedRoles.some((r) => r.role === role && r.is_main);
                return (
                  <div key={role} className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRole(gameId, role)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-accent/50 bg-accent/10 text-accent-hover"
                          : "border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {role}
                    </button>
                    {isSelected && (
                      <button
                        onClick={() => toggleMain(gameId, role)}
                        title="Set as main role"
                      >
                        <Badge
                          colour={isMain ? "#22c55e" : undefined}
                          className="cursor-pointer"
                        >
                          {isMain ? "Main" : "Set main"}
                        </Badge>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next →
        </Button>
      </div>
    </div>
  );
}
