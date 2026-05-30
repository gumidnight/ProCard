"use client";

import { useRef, useState } from "react";
import { ImageUp, X, Check, ShieldCheck } from "lucide-react";
import { CardShell } from "./CardShell";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import {
  BACKGROUND_PRESETS,
  DEFAULT_BACKGROUND_PRESET,
  getBackgroundPreset,
} from "@/lib/constants/backgrounds";
import type { ProfileRow } from "@/types/db";

interface AppearanceCardProps {
  profile: ProfileRow;
  onUpdate: (profile: ProfileRow) => void;
}

export function AppearanceCard({ profile, onUpdate }: AppearanceCardProps) {
  return (
    <CardShell title="Appearance" subtitle="Banner & background" icon="">
      <div className="flex flex-col gap-6">
        <BannerBlock profile={profile} onUpdate={onUpdate} />
        <div className="border-t border-border-subtle" />
        <BackgroundBlock profile={profile} onUpdate={onUpdate} />

        {/* Verified is admin/DB-only — never user-editable (no self-verify). */}
        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center gap-2 text-[12px]">
            <ShieldCheck
              size={14}
              className={profile.is_verified === 1 ? "text-accent" : "text-text-muted"}
              aria-hidden
            />
            <span className="text-text-secondary">
              {profile.is_verified === 1 ? (
                <>
                  <span className="font-medium text-text-primary">Verified</span> —
                  managed by ProCard
                </>
              ) : (
                "Not verified yet — verification is granted by ProCard"
              )}
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function BannerBlock({ profile, onUpdate }: AppearanceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const hasBanner = !!profile.banner_key;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // TODO(pro-gating): banners are open to everyone for now. Future rule —
      // free users get no custom banner (branded strip only); pro users get
      // custom banner uploads. Gate this POST then.
      const res = await fetch("/api/profile/banner", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/profile/banner", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-primary">Banner</p>
        <p className="text-[11px] text-text-muted">~1500×500 · max 4 MB</p>
      </div>

      {/* Preview strip — reuses the public banner component */}
      <div className="overflow-hidden rounded-[10px] border border-border-subtle">
        <ProfileBanner bannerKey={profile.banner_key} className="h-24" />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-2 px-3 py-1.5 text-[12px] text-text-primary transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          <ImageUp size={13} />
          {hasBanner ? "Replace banner" : "Upload banner"}
        </button>
        {hasBanner && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-red-400 disabled:opacity-50"
          >
            <X size={12} />
            Remove
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleUpload}
        />
      </div>

      {busy && <p className="text-[11px] text-accent">Working…</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

function BackgroundBlock({ profile, onUpdate }: AppearanceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const isDefault = profile.background_type === "default";
  const isCustom = profile.background_type === "custom" && !!profile.background_key;
  const selectedPreset =
    profile.background_type === "preset" ? profile.background_preset : null;

  const patch = async (updates: Partial<ProfileRow>) => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  // TODO(pro-gating): presets are all open for now. Future rule — free users
  // get the 1–2 branded presets + default only; pro users get every preset +
  // custom upload. Filter selectable tiles by profile.is_pro then.
  const selectDefault = () =>
    patch({ background_type: "default", background_preset: null });
  const selectPreset = (id: string) =>
    patch({ background_type: "preset", background_preset: id });

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // TODO(pro-gating): custom background upload is open for now. Future rule
      // — pro users only. Gate this POST then.
      const res = await fetch("/api/profile/background", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveCustom = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/profile/background", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove");
        return;
      }
      onUpdate(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-text-primary">Background</p>

      <div className="grid grid-cols-3 gap-2">
        {/* Default / house background */}
        <Thumb
          label="Default"
          src={getBackgroundPreset(DEFAULT_BACKGROUND_PRESET).src}
          selected={isDefault}
          branded
          onClick={selectDefault}
          disabled={busy}
        />

        {/* Presets */}
        {BACKGROUND_PRESETS.map((p) => (
          <Thumb
            key={p.id}
            label={p.label}
            src={p.src}
            selected={selectedPreset === p.id}
            branded={p.branded}
            onClick={() => selectPreset(p.id)}
            disabled={busy}
          />
        ))}

        {/* Custom upload tile */}
        {isCustom ? (
          <Thumb
            label="Custom"
            src={`/api/profile/background?key=${encodeURIComponent(
              profile.background_key!,
            )}`}
            selected
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          />
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-border-default bg-surface-2 text-text-muted transition-colors hover:border-border-strong hover:text-text-secondary disabled:opacity-50"
          >
            <ImageUp size={16} />
            <span className="text-[10px]">Upload</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleCustomUpload}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">Custom image · max 4 MB</p>
        {isCustom && (
          <button
            type="button"
            onClick={handleRemoveCustom}
            disabled={busy}
            className="inline-flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-red-400 disabled:opacity-50"
          >
            <X size={11} />
            Remove custom
          </button>
        )}
      </div>

      {busy && <p className="text-[11px] text-accent">Working…</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function Thumb({
  label,
  src,
  selected,
  branded,
  onClick,
  disabled,
}: {
  label: string;
  src: string;
  selected: boolean;
  branded?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`group relative aspect-video overflow-hidden rounded-[8px] border transition-colors disabled:opacity-60 ${
        selected
          ? "border-accent ring-2 ring-[var(--accent-ring)]"
          : "border-border-subtle hover:border-border-default"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="h-full w-full object-cover" />

      {branded && (
        <span className="absolute left-1 top-1 rounded-full bg-surface-0/80 px-1.5 py-px text-[8px] font-semibold uppercase tracking-[0.08em] text-accent">
          Brand
        </span>
      )}

      {selected && (
        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[var(--accent-on)]">
          <Check size={10} strokeWidth={3} />
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-surface-0/90 to-transparent px-1.5 pb-1 pt-3 text-left text-[9px] font-medium text-text-secondary">
        {label}
      </span>
    </button>
  );
}
