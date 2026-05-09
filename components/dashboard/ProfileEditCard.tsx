"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { COUNTRIES } from "@/lib/utils/country";
import { ESPORTS_ROLES } from "@/lib/constants/esports-roles";
import type { ProfileRow, EsportsRole } from "@/types/db";

interface ProfileEditCardProps {
  profile: ProfileRow;
  onUpdate: (profile: ProfileRow) => void;
}

export function ProfileEditCard({
  profile,
  onUpdate,
}: ProfileEditCardProps) {
  const [draft, setDraft] = useState({
    display_name: profile.display_name,
    slug: profile.slug,
    country: profile.country ?? "",
    tagline: profile.tagline ?? "",
    bio: profile.bio ?? "",
    esports_role: profile.esports_role ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [savedAt, setSavedAt] = useState<number>();

  const dirty =
    draft.display_name !== profile.display_name ||
    draft.slug !== profile.slug ||
    draft.country !== (profile.country ?? "") ||
    draft.tagline !== (profile.tagline ?? "") ||
    draft.bio !== (profile.bio ?? "") ||
    draft.esports_role !== (profile.esports_role ?? "");

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: draft.display_name,
          slug: draft.slug,
          country: draft.country || null,
          tagline: draft.tagline || null,
          bio: draft.bio || null,
          esports_role: draft.esports_role || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      onUpdate(data.profile);
      setSavedAt(Date.now());
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // Live-update preview as user types
  const updateField = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    onUpdate({
      ...profile,
      display_name:
        key === "display_name" ? (value as string) : draft.display_name,
      slug: key === "slug" ? (value as string) : draft.slug,
      country:
        key === "country"
          ? ((value as string) || null)
          : draft.country || null,
      tagline:
        key === "tagline"
          ? ((value as string) || null)
          : draft.tagline || null,
      bio: key === "bio" ? ((value as string) || null) : draft.bio || null,
      esports_role:
        key === "esports_role"
          ? (((value as string) || null) as EsportsRole | null)
          : (draft.esports_role || null) as EsportsRole | null,
    });
  };

  return (
    <CardShell
      title="Identity"
      subtitle="Display name, tagline, country, bio"
      icon=""
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Display Name"
          value={draft.display_name}
          onChange={(e) => updateField("display_name", e.target.value)}
          maxLength={40}
        />

        <Input
          label="URL Slug"
          value={draft.slug}
          onChange={(e) =>
            updateField(
              "slug",
              e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
            )
          }
          hint={`procard.gg/${draft.slug}`}
          maxLength={24}
        />

        <Input
          label="Tagline"
          value={draft.tagline}
          onChange={(e) => updateField("tagline", e.target.value)}
          placeholder="Mid laner • EUW • Looking for team"
          maxLength={80}
          hint={`${draft.tagline.length}/80`}
        />

        <Select
          label="Country"
          value={draft.country}
          onChange={(e) => updateField("country", e.target.value)}
          options={COUNTRIES.map((c) => ({
            value: c.code,
            label: `${c.flag} ${c.name}`,
          }))}
        />

        <Select
          label="Esports Role"
          value={draft.esports_role}
          onChange={(e) => updateField("esports_role", e.target.value)}
          options={ESPORTS_ROLES.map((r) => ({
            value: r.value,
            label: r.label,
          }))}
        />

        <TextArea
          label="Bio"
          value={draft.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          maxLength={280}
          charCount
          rows={3}
          placeholder="Tell teams what makes you stand out."
        />

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex items-center justify-between">
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
