"use client";

import { useRef, useState } from "react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import type { ProfileRow, ProfileStatus } from "@/types/db";

interface StatusEditCardProps {
  profile: ProfileRow;
  onUpdate: (profile: ProfileRow) => void;
}

const GAME_OPTIONS = [
  { value: "", label: "—" },
  { value: "lol", label: "League of Legends" },
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "Counter-Strike 2" },
];

type Mode = "open" | "on_team";

/** Map any legacy status to one of the two UI modes. */
function statusToMode(s: ProfileStatus): Mode {
  return s === "on_team" ? "on_team" : "open";
}

export function StatusEditCard({ profile, onUpdate }: StatusEditCardProps) {
  const [saving, setSaving] = useState(false);

  // Local drafts for debounced fields
  const [note, setNote] = useState(profile.status_note ?? "");
  const [teamName, setTeamName] = useState(profile.current_team_name ?? "");
  const [teamLogo, setTeamLogo] = useState(profile.current_team_logo_url ?? "");
  const [league, setLeague] = useState(profile.current_league ?? "");
  const [role, setRole] = useState(profile.current_role ?? "");
  const [game, setGame] = useState(profile.current_game ?? "");

  const timer = useRef<number | null>(null);
  const mode = statusToMode(profile.status);

  /** Fire a PATCH with the merged payload. Optimistic + debounced. */
  const patch = (payload: Partial<ProfileRow>, debounce = 600) => {
    const next = { ...profile, ...payload };
    onUpdate(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) onUpdate(data.profile);
      } finally {
        setSaving(false);
      }
    }, debounce);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    patch({ status: next }, 0);
  };

  const togglePublish = async () => {
    const next = profile.is_published === 1 ? 0 : 1;
    onUpdate({ ...profile, is_published: next });
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.profile);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardShell
      title="Availability & Visibility"
      subtitle="Tell teams what you're currently up to"
      icon=""
      rightSlot={
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            profile.is_published === 1
              ? "bg-green-500/15 text-green-400"
              : "bg-yellow-500/15 text-yellow-400"
          }`}
        >
          {profile.is_published === 1 ? "Live" : "Draft"}
        </span>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => switchMode("open")}
            disabled={saving}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              mode === "open"
                ? "border-accent bg-accent/10 text-accent-hover"
                : "border-border-subtle bg-surface-0 text-text-secondary hover:border-border-default"
            }`}
          >
            Free Agent
          </button>
          <button
            onClick={() => switchMode("on_team")}
            disabled={saving}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              mode === "on_team"
                ? "border-accent bg-accent/10 text-accent-hover"
                : "border-border-subtle bg-surface-0 text-text-secondary hover:border-border-default"
            }`}
          >
            On a Team
          </button>
        </div>

        {mode === "open" && (
          <TextArea
            label="What are you looking for?"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              patch({ status_note: e.target.value.trim() || null });
            }}
            placeholder="Free agent — looking for a mid role in EUW/EUNE"
            hint="Shown in the “Currently” section on your card. Auto-saves."
            maxLength={200}
            charCount
            rows={2}
          />
        )}

        {mode === "on_team" && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border-subtle bg-surface-0 p-4">
            <Input
              label="Team Name"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                patch({ current_team_name: e.target.value.trim() || null });
              }}
              placeholder="e.g. Cloud9"
            />
            <Input
              label="Team Logo URL"
              value={teamLogo}
              onChange={(e) => {
                setTeamLogo(e.target.value);
                patch({
                  current_team_logo_url: e.target.value.trim() || null,
                });
              }}
              placeholder="https://..."
              hint="Optional — PNG/SVG link"
            />
            <Input
              label="League / Tournament"
              value={league}
              onChange={(e) => {
                setLeague(e.target.value);
                patch({ current_league: e.target.value.trim() || null });
              }}
              placeholder="e.g. LCS Spring 2026"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  patch({ current_role: e.target.value.trim() || null });
                }}
                placeholder="e.g. Mid laner"
              />
              <Select
                label="Game"
                value={game}
                onChange={(e) => {
                  setGame(e.target.value);
                  patch({ current_game: e.target.value || null }, 0);
                }}
                options={GAME_OPTIONS}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-0 p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {profile.is_published === 1 ? "Profile is live" : "Profile is in draft"}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {profile.is_published === 1
                ? "Anyone with the link can view your profile."
                : "Only you can see this profile."}
            </p>
          </div>
          <button
            onClick={togglePublish}
            disabled={saving}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              profile.is_published === 1
                ? "bg-surface-3 text-text-secondary hover:bg-surface-3/70"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            {profile.is_published === 1 ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </CardShell>
  );
}
