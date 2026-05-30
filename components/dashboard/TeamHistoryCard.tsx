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

interface Draft {
  org_name: string;
  tournament_name: string;
  org_logo_url: string;
  role: string;
  game: string;
  start_date: string;
  end_date: string;
  result_note: string;
}

const EMPTY_DRAFT: Draft = {
  org_name: "",
  tournament_name: "",
  org_logo_url: "",
  role: "",
  game: "lol",
  start_date: "",
  end_date: "",
  result_note: "",
};

function entryToDraft(entry: TeamHistoryRow): Draft {
  return {
    org_name: entry.org_name,
    tournament_name: entry.tournament_name ?? "",
    org_logo_url: entry.org_logo_url ?? "",
    role: entry.role ?? "",
    game: entry.game,
    start_date: entry.start_date ?? "",
    end_date: entry.end_date ?? "",
    result_note: entry.result_note ?? "",
  };
}

export function TeamHistoryCard({ entries, onUpdate }: TeamHistoryCardProps) {
  // null = closed, "new" = adding, otherwise = id of entry being edited
  const [mode, setMode] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  // Leaguepedia import state
  const [importOpen, setImportOpen] = useState(false);
  const [lpHandle, setLpHandle] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const handleImport = async () => {
    const playerId = lpHandle.trim();
    if (!playerId) {
      setImportMessage({ kind: "error", text: "Enter your Leaguepedia handle" });
      return;
    }
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/connect/leaguepedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportMessage({
          kind: "error",
          text: data.error ?? "Import failed",
        });
        return;
      }
      onUpdate(data.entries);
      setImportMessage({
        kind: "success",
        text:
          data.imported > 0
            ? `Imported ${data.imported} entr${data.imported === 1 ? "y" : "ies"}${data.skipped ? ` (${data.skipped} already existed)` : ""}.`
            : "Nothing new to import — all entries already present.",
      });
      setLpHandle("");
    } catch {
      setImportMessage({ kind: "error", text: "Network error" });
    } finally {
      setImporting(false);
    }
  };

  const startAdd = () => {
    setMode("new");
    setDraft(EMPTY_DRAFT);
    setError(undefined);
  };

  const startEdit = (entry: TeamHistoryRow) => {
    setMode(entry.id);
    setDraft(entryToDraft(entry));
    setError(undefined);
  };

  const cancel = () => {
    setMode(null);
    setDraft(EMPTY_DRAFT);
    setError(undefined);
  };

  const handleSave = async () => {
    if (!draft.org_name.trim()) {
      setError("Org name is required");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const isEdit = mode !== "new" && mode !== null;
      const res = await fetch("/api/profile/team-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEdit ? mode : undefined,
          org_name: draft.org_name.trim(),
          tournament_name: draft.tournament_name.trim() || null,
          org_logo_url: draft.org_logo_url.trim() || null,
          role: draft.role.trim() || null,
          game: draft.game,
          start_date: draft.start_date || null,
          end_date: draft.end_date || null,
          result_note: draft.result_note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      if (isEdit) {
        onUpdate(entries.map((e) => (e.id === data.entry.id ? data.entry : e)));
      } else {
        onUpdate([...entries, data.entry]);
      }
      cancel();
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

  const renderForm = () => (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border-subtle bg-surface-0 p-4">
      <Input
        label="Org / Team Name"
        value={draft.org_name}
        onChange={(e) => setDraft({ ...draft, org_name: e.target.value })}
        placeholder="e.g. Cloud9"
      />
      <Input
        label="Tournament / League Name"
        value={draft.tournament_name}
        onChange={(e) => setDraft({ ...draft, tournament_name: e.target.value })}
        placeholder="e.g. LCS Spring 2024"
        hint="Optional"
      />
      <Input
        label="Organisation Logo URL"
        value={draft.org_logo_url}
        onChange={(e) => setDraft({ ...draft, org_logo_url: e.target.value })}
        placeholder="https://..."
        hint="Optional — PNG/SVG link"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Role"
          value={draft.role}
          onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          placeholder="e.g. Mid laner"
        />
        <Select
          label="Game"
          value={draft.game}
          onChange={(e) => setDraft({ ...draft, game: e.target.value })}
          options={GAME_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start"
          type="month"
          value={draft.start_date}
          onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
        />
        <Input
          label="End"
          type="month"
          value={draft.end_date}
          onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
          hint="Leave blank for current"
        />
      </div>
      <Input
        label="Result / Notes"
        value={draft.result_note}
        onChange={(e) => setDraft({ ...draft, result_note: e.target.value })}
        placeholder="e.g. 2nd place — LCS Spring 2024"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} isLoading={saving}>
          {mode === "new" ? "Add Entry" : "Save Changes"}
        </Button>
      </div>
    </div>
  );

  return (
    <CardShell
      title="Team & Match History"
      subtitle="Orgs, scrims, tournaments"
      icon=""
      rightSlot={
        <span className="rounded-full bg-surface-0 px-2 py-0.5 text-[10px] text-text-muted">
          {entries.length}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {entries.length === 0 && mode === null && (
          <p className="text-sm text-text-muted">
            No history added yet. Add your first team or tournament result.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {[...entries]
            .sort((a, b) => {
              const aDate = a.start_date ?? "";
              const bDate = b.start_date ?? "";
              if (aDate === bDate) return 0;
              if (!aDate) return 1;
              if (!bDate) return -1;
              return bDate.localeCompare(aDate);
            })
            .map((entry) =>
              mode === entry.id ? (
                <li key={entry.id}>{renderForm()}</li>
              ) : (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle bg-surface-0 p-3"
                >
                  <div className="flex flex-1 items-start gap-3 overflow-hidden">
                    {entry.org_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.org_logo_url}
                        alt={entry.org_name}
                        className="size-9 shrink-0 rounded-md border border-border-subtle bg-surface-1 object-contain p-0.5"
                      />
                    ) : (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-1 font-display text-xs font-bold text-text-muted">
                        {entry.org_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-text-primary">
                        {entry.org_name}
                        {entry.role && (
                          <span className="ml-2 text-xs font-normal text-text-muted">
                            · {entry.role}
                          </span>
                        )}
                      </p>
                      {entry.tournament_name && (
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {entry.tournament_name}
                        </p>
                      )}
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
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => startEdit(entry)}
                      className="text-xs text-text-muted transition-colors hover:text-text-primary"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-text-muted transition-colors hover:text-red-400"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ),
            )}
        </ul>

        {mode === "new" ? (
          renderForm()
        ) : mode === null ? (
          <div className="flex flex-col gap-2">
            {importOpen ? (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border-subtle bg-surface-0 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Import from Leaguepedia
                  </p>
                  <button
                    onClick={() => {
                      setImportOpen(false);
                      setImportMessage(null);
                    }}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">
                  Enter your Leaguepedia player ID — the exact wiki page title (e.g.{" "}
                  <span className="font-mono text-text-secondary">Faker</span>,{" "}
                  <span className="font-mono text-text-secondary">Caps</span>).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={lpHandle}
                    onChange={(e) => setLpHandle(e.target.value)}
                    placeholder="Leaguepedia handle"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !importing) handleImport();
                    }}
                  />
                  <Button onClick={handleImport} isLoading={importing}>
                    Import
                  </Button>
                </div>
                {importMessage && (
                  <p
                    className={`text-xs ${
                      importMessage.kind === "success" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {importMessage.text}
                  </p>
                )}
                <p className="text-[10px] text-text-muted">
                  Data sourced from Leaguepedia (CC BY-SA 3.0). LoL only.
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setImportOpen(true);
                  setImportMessage(null);
                }}
                className="w-full rounded-lg border border-dashed border-border-subtle bg-surface-0 py-2.5 text-xs text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
              >
                ⬇ Import from Leaguepedia
              </button>
            )}
            <button
              onClick={startAdd}
              className="w-full rounded-lg border border-dashed border-border-subtle bg-surface-0 py-3 text-sm text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
            >
              + Add team / result
            </button>
          </div>
        ) : null}
      </div>
    </CardShell>
  );
}
