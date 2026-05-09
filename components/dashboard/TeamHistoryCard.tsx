"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { TeamHistoryRow } from "@/types/db";

interface TeamHistoryCardProps {
  entries: TeamHistoryRow[];
  onUpdate: (entries: TeamHistoryRow[]) => void;
}

const GAME_OPTIONS = [
  { value: "lol", label: "League of Legends" },
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "Counter-Strike 2" },
];

const EMPTY_DRAFT = {
  org_name: "",
  role: "",
  game: "lol",
  start_date: "",
  end_date: "",
  result_note: "",
};

export function TeamHistoryCard({
  entries,
  onUpdate,
}: TeamHistoryCardProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const handleAdd = async () => {
    if (!draft.org_name.trim()) {
      setError("Org name is required");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/profile/team-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: draft.org_name.trim(),
          role: draft.role.trim() || null,
          game: draft.game,
          start_date: draft.start_date || null,
          end_date: draft.end_date || null,
          result_note: draft.result_note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add");
        return;
      }
      onUpdate([...entries, data.entry]);
      setDraft(EMPTY_DRAFT);
      setAdding(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    onUpdate(entries.filter((e) => e.id !== id));
    await fetch("/api/profile/team-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <CardShell
      title="Team & Match History"
      subtitle="Orgs, scrims, tournaments"
      icon=""
      rightSlot={
        <span className="rounded-full bg-bg-base px-2 py-0.5 text-[10px] text-text-muted">
          {entries.length}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {entries.length === 0 && !adding && (
          <p className="text-sm text-text-muted">
            No history added yet. Add your first team or tournament result.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle bg-bg-base p-3"
            >
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-text-primary">
                  {entry.org_name}
                  {entry.role && (
                    <span className="ml-2 text-xs font-normal text-text-muted">
                      · {entry.role}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {entry.game.toUpperCase()}
                  {entry.start_date &&
                    ` · ${entry.start_date}${entry.end_date ? ` → ${entry.end_date}` : " → present"}`}
                </p>
                {entry.result_note && (
                  <p className="mt-1 text-xs text-text-secondary">
                    {entry.result_note}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-xs text-text-muted transition-colors hover:text-red-400"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border-subtle bg-bg-base p-4">
            <Input
              label="Org / Team Name"
              value={draft.org_name}
              onChange={(e) =>
                setDraft({ ...draft, org_name: e.target.value })
              }
              placeholder="e.g. Cloud9"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Role"
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value })
                }
                placeholder="e.g. Mid laner"
              />
              <Select
                label="Game"
                value={draft.game}
                onChange={(e) =>
                  setDraft({ ...draft, game: e.target.value })
                }
                options={GAME_OPTIONS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start"
                type="month"
                value={draft.start_date}
                onChange={(e) =>
                  setDraft({ ...draft, start_date: e.target.value })
                }
              />
              <Input
                label="End"
                type="month"
                value={draft.end_date}
                onChange={(e) =>
                  setDraft({ ...draft, end_date: e.target.value })
                }
                hint="Leave blank for current"
              />
            </div>
            <Input
              label="Result / Notes"
              value={draft.result_note}
              onChange={(e) =>
                setDraft({ ...draft, result_note: e.target.value })
              }
              placeholder="e.g. 2nd place — LCS Spring 2024"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraft(EMPTY_DRAFT);
                  setError(undefined);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} isLoading={saving}>
                Add Entry
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-lg border border-dashed border-border-subtle bg-bg-base py-3 text-sm text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
          >
            + Add team / result
          </button>
        )}
      </div>
    </CardShell>
  );
}
