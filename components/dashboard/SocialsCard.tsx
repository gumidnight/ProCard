"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { SocialLinkRow, SocialPlatform } from "@/types/db";

interface SocialsCardProps {
  socials: SocialLinkRow[];
  onUpdate: (socials: SocialLinkRow[]) => void;
}

const SOCIAL_PLATFORMS: {
  id: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  { id: "twitch", label: "Twitch", placeholder: "username" },
  { id: "youtube", label: "YouTube", placeholder: "@channel" },
  { id: "kick", label: "Kick", placeholder: "username" },
  { id: "twitter", label: "Twitter / X", placeholder: "@handle" },
  { id: "instagram", label: "Instagram", placeholder: "@handle" },
  { id: "tiktok", label: "TikTok", placeholder: "@handle" },
  { id: "discord", label: "Discord", placeholder: "username or invite" },
  { id: "liquipedia", label: "Liquipedia", placeholder: "liquipedia.net/..." },
  { id: "opgg", label: "OP.GG", placeholder: "op.gg/..." },
  { id: "tracker", label: "Tracker.gg", placeholder: "tracker.gg/..." },
  { id: "website", label: "Website / Other", placeholder: "https://..." },
];

export function SocialsCard({ socials, onUpdate }: SocialsCardProps) {
  // Build a working draft: { platform → handle_or_url }
  const initialDraft: Record<string, string> = {};
  for (const s of socials) initialDraft[s.platform] = s.handle_or_url;

  const [draft, setDraft] = useState<Record<string, string>>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [savedAt, setSavedAt] = useState<number>();

  const dirty = (() => {
    const platforms = new Set([
      ...socials.map((s) => s.platform),
      ...Object.keys(draft),
    ]);
    for (const p of platforms) {
      const original = socials.find((s) => s.platform === p)?.handle_or_url ?? "";
      if ((draft[p] ?? "").trim() !== original.trim()) return true;
    }
    return false;
  })();

  const updateField = (platform: SocialPlatform, value: string) => {
    setDraft((prev) => ({ ...prev, [platform]: value }));

    // Live preview update
    const next: SocialLinkRow[] = SOCIAL_PLATFORMS.flatMap((p) => {
      const v =
        p.id === platform
          ? value.trim()
          : (draft[p.id] ?? "").trim();
      if (!v) return [];
      const existing = socials.find((s) => s.platform === p.id);
      return [
        existing
          ? { ...existing, handle_or_url: v }
          : {
              id: `tmp-${p.id}`,
              profile_id: socials[0]?.profile_id ?? "",
              platform: p.id,
              handle_or_url: v,
              display_order: 0,
              created_at: Math.floor(Date.now() / 1000),
            },
      ];
    });
    onUpdate(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);

    const links = SOCIAL_PLATFORMS.flatMap((p) => {
      const v = (draft[p.id] ?? "").trim();
      return v ? [{ platform: p.id, handle_or_url: v }] : [];
    });

    try {
      const res = await fetch("/api/profile/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      // Refetch from server for canonical data
      const refresh = await fetch("/api/profile");
      if (refresh.ok) {
        const refreshData = await refresh.json();
        onUpdate(refreshData.socialLinks ?? []);
      }
      setSavedAt(Date.now());
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardShell
      title="Media & Socials"
      subtitle="Showcase your professional presence"
      icon=""
    >
      <div className="flex flex-col gap-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.id} className="flex items-center gap-2">
            <span className="flex w-9 shrink-0 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {platform.label.slice(0, 3)}
            </span>
            <Input
              value={draft[platform.id] ?? ""}
              onChange={(e) => updateField(platform.id, e.target.value)}
              placeholder={`${platform.label} — ${platform.placeholder}`}
              className="flex-1"
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">
            {savedAt && !dirty
              ? "✓ Saved"
              : dirty
                ? "Unsaved changes"
                : "Up to date"}
          </p>
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={!dirty}
          >
            Save
          </Button>
        </div>
      </div>
    </CardShell>
  );
}
