"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface TeamEntry {
  id: string;
  org_name: string;
  role: string;
  game: string;
  start_date: string;
  end_date: string;
  result_note: string;
}

interface Step4Data {
  entries: TeamEntry[];
}

interface Step4Props {
  data: Step4Data;
  onChange: (data: Step4Data) => void;
  selectedGames: string[];
  onNext: () => void;
  onBack: () => void;
}

const EMPTY_ENTRY: Omit<TeamEntry, "id"> = {
  org_name: "",
  role: "",
  game: "",
  start_date: "",
  end_date: "",
  result_note: "",
};

export function Step4History({
  data,
  onChange,
  selectedGames,
  onNext,
  onBack,
}: Step4Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<TeamEntry, "id">>({
    ...EMPTY_ENTRY,
  });

  const gameOptions = selectedGames.map((g) => ({
    value: g,
    label: g === "lol" ? "League of Legends" : g === "valorant" ? "Valorant" : "CS2",
  }));

  const addEntry = () => {
    if (!draft.org_name.trim() || !draft.game) return;

    const entry: TeamEntry = {
      ...draft,
      id: crypto.randomUUID(),
    };

    onChange({
      entries: [...data.entries, entry],
    });
    setDraft({ ...EMPTY_ENTRY });
    setIsAdding(false);
  };

  const removeEntry = (id: string) => {
    onChange({
      entries: data.entries.filter((e) => e.id !== id),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide">
          Competitive History
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Teams, orgs, and notable results. Optional but adds credibility.
        </p>
      </div>

      {/* Existing entries */}
      {data.entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start justify-between rounded-lg border border-border-subtle bg-surface-1 p-4"
        >
          <div>
            <p className="font-display text-sm font-semibold">{entry.org_name}</p>
            <p className="text-xs text-text-secondary">
              {entry.role && `${entry.role} · `}
              {entry.game === "lol"
                ? "LoL"
                : entry.game === "valorant"
                  ? "Valorant"
                  : "CS2"}
              {entry.start_date && ` · ${entry.start_date}`}
              {entry.end_date && `–${entry.end_date}`}
            </p>
            {entry.result_note && (
              <p className="mt-1 text-xs italic text-text-muted">{entry.result_note}</p>
            )}
          </div>
          <button
            onClick={() => removeEntry(entry.id)}
            className="text-text-muted transition-colors hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add form */}
      {isAdding ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-1 p-4">
          <Input
            label="Team / Org name"
            value={draft.org_name}
            onChange={(e) => setDraft({ ...draft, org_name: e.target.value })}
            placeholder="Team Liquid"
          />
          <Input
            label="Role"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            placeholder="Mid Laner, IGL, etc."
          />
          <Select
            label="Game"
            value={draft.game}
            onChange={(e) => setDraft({ ...draft, game: e.target.value })}
            options={gameOptions}
          />
          <div className="flex gap-3">
            <Input
              label="Start"
              value={draft.start_date}
              onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
              placeholder="2024"
            />
            <Input
              label="End"
              value={draft.end_date}
              onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
              placeholder="Present"
            />
          </div>
          <Input
            label="Notable result"
            value={draft.result_note}
            onChange={(e) => setDraft({ ...draft, result_note: e.target.value })}
            placeholder="ESL Pro League S18 — QF"
          />
          <div className="flex gap-2">
            <Button onClick={addEntry} disabled={!draft.org_name.trim() || !draft.game}>
              Add
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setIsAdding(true)}
          className="self-start"
        >
          + Add team history
        </Button>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next →</Button>
      </div>
    </div>
  );
}
