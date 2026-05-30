"use client";

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { RoleChipPicker } from "@/components/ui/RoleChipPicker";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { COUNTRIES } from "@/lib/utils/country";
import { parseRoles, formatRoles } from "@/lib/utils/esports-roles";
import type { ProfileRow } from "@/types/db";

interface ProfileEditCardProps {
  profile: ProfileRow;
  onUpdate: (profile: ProfileRow) => void;
  discordAvatarUrl: string | null;
}

export function ProfileEditCard({
  profile,
  onUpdate,
  discordAvatarUrl,
}: ProfileEditCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  const customAvatarUrl = profile.avatar_key
    ? `/api/profile/avatar?key=${encodeURIComponent(profile.avatar_key)}`
    : null;
  const displayAvatarUrl = customAvatarUrl ?? discordAvatarUrl;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setUploadError("Network error");
    } finally {
      setUploading(false);
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setUploadError(undefined);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Failed to remove");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setUploadError("Network error");
    } finally {
      setUploading(false);
    }
  };

  type IdentityDraft = {
    display_name: string;
    slug: string;
    country: string;
    tagline: string;
    bio: string;
    esports_roles: string[];
  };

  const initialDraft: IdentityDraft = {
    display_name: profile.display_name,
    slug: profile.slug,
    country: profile.country ?? "",
    tagline: profile.tagline ?? "",
    bio: profile.bio ?? "",
    esports_roles: parseRoles(profile.esports_role) as string[],
  };

  const [draft, setDraft] = useState<IdentityDraft>(initialDraft);
  // Latest draft, readable synchronously from blur / change handlers.
  const draftRef = useRef<IdentityDraft>(initialDraft);
  // Last snapshot successfully persisted to the server (state, so `dirty` reacts).
  const [savedSnapshot, setSavedSnapshot] = useState<IdentityDraft>(initialDraft);
  const [status, setStatus] = useState<SaveState>("idle");
  const [error, setError] = useState<string>();

  // Stable signature for change detection (normalises roles, ignores key order).
  const signature = (d: IdentityDraft) =>
    JSON.stringify({
      display_name: d.display_name,
      slug: d.slug,
      country: d.country,
      tagline: d.tagline,
      bio: d.bio,
      esports_role: formatRoles(d.esports_roles),
    });

  const dirty = signature(draft) !== signature(savedSnapshot);

  // Persist the current draft. Called on blur (text fields) and on change
  // (country / roles). No-op when nothing changed since the last save.
  const persist = async () => {
    const d = draftRef.current;
    if (signature(d) === signature(savedSnapshot)) return;
    if (!d.display_name.trim()) return; // display name is required
    setStatus("saving");
    setError(undefined);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: d.display_name,
          slug: d.slug,
          country: d.country || null,
          tagline: d.tagline || null,
          bio: d.bio || null,
          esports_role: formatRoles(d.esports_roles),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn’t save");
        setStatus("error");
        return;
      }
      setSavedSnapshot(d);
      onUpdate(data.profile);
      setStatus("saved");
    } catch {
      setError("Network error");
      setStatus("error");
    }
  };

  // Live-update the preview as the user edits; persistence happens on blur.
  const updateField = <K extends keyof IdentityDraft>(
    key: K,
    value: IdentityDraft[K],
  ) => {
    const next = { ...draftRef.current, [key]: value };
    draftRef.current = next;
    setDraft(next);
    onUpdate({
      ...profile,
      display_name: next.display_name,
      slug: next.slug,
      country: next.country || null,
      tagline: next.tagline || null,
      bio: next.bio || null,
      esports_role: formatRoles(next.esports_roles),
    });
  };

  return (
    <CardShell title="Identity" subtitle="Display name, tagline, country, bio" icon="">
      <div className="flex flex-col gap-4">
        {/* Avatar picker */}
        <div className="flex items-center gap-4 pb-1">
          <div className="relative shrink-0">
            <div className="size-16 overflow-hidden rounded-full border border-border-default bg-surface-2">
              {displayAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-text-muted text-xl font-bold">
                  {draft.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border-default bg-surface-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary disabled:opacity-50"
              title="Upload photo"
            >
              <Camera size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-text-primary">Profile photo</p>
            <p className="text-[11px] text-text-muted">JPEG, PNG or WebP · max 2 MB</p>
            {customAvatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="mt-1 flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <X size={10} />
                Reset to Discord photo
              </button>
            )}
            {uploading && <p className="mt-1 text-[11px] text-accent">Uploading…</p>}
            {uploadError && (
              <p className="mt-1 text-[11px] text-red-400">{uploadError}</p>
            )}
          </div>
        </div>

        <Input
          label="Display Name"
          value={draft.display_name}
          onChange={(e) => updateField("display_name", e.target.value)}
          onBlur={persist}
          maxLength={40}
        />

        <Input
          label="URL Slug"
          value={draft.slug}
          onChange={(e) =>
            updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
          }
          onBlur={persist}
          hint={`procard.gg/${draft.slug}`}
          maxLength={24}
        />

        <Input
          label="Tagline"
          value={draft.tagline}
          onChange={(e) => updateField("tagline", e.target.value)}
          onBlur={persist}
          placeholder="Mid laner • EUW • Looking for team"
          maxLength={80}
          hint={`${draft.tagline.length}/80`}
        />

        <Select
          label="Country"
          value={draft.country}
          onChange={(e) => {
            updateField("country", e.target.value);
            void persist();
          }}
          options={COUNTRIES.map((c) => ({
            value: c.code,
            label: c.name,
          }))}
        />

        <RoleChipPicker
          value={draft.esports_roles}
          onChange={(next) => {
            updateField("esports_roles", next);
            void persist();
          }}
          hint="Pick all that apply"
        />

        <TextArea
          label="Bio"
          value={draft.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          onBlur={persist}
          maxLength={280}
          charCount
          rows={3}
          placeholder="Tell teams what makes you stand out."
          hint={
            "Markdown supported — **bold**, *italic*, ~~strike~~, `code`, [links](https://…)"
          }
        />

        <div className="flex items-center justify-end pt-1">
          <SaveStatus state={status} dirty={dirty} error={error} />
        </div>
      </div>
    </CardShell>
  );
}
