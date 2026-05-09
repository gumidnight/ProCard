"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ProfileRow, ProfileStatus } from "@/types/db";

interface StatusEditCardProps {
  profile: ProfileRow;
  onUpdate: (profile: ProfileRow) => void;
}

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: "open", label: "Open to offers" },
  { value: "on_team", label: "On a team" },
  { value: "not_looking", label: "Not looking" },
];

export function StatusEditCard({
  profile,
  onUpdate,
}: StatusEditCardProps) {
  const [saving, setSaving] = useState(false);

  const updateStatus = async (status: ProfileStatus) => {
    if (status === profile.status) return;
    onUpdate({ ...profile, status });
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.profile);
    } finally {
      setSaving(false);
    }
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
      subtitle="Tell teams what you're looking for"
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
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-text-muted">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateStatus(opt.value)}
                disabled={saving}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  profile.status === opt.value
                    ? "border-accent bg-accent/10 text-accent-light"
                    : "border-border-subtle bg-bg-base text-text-secondary hover:border-border-default"
                }`}
              >
                <StatusBadge status={opt.value} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-base p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {profile.is_published === 1
                ? "Profile is live"
                : "Profile is in draft"}
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
                ? "bg-bg-subtle text-text-secondary hover:bg-bg-subtle/70"
                : "bg-accent text-white hover:bg-accent-light"
            }`}
          >
            {profile.is_published === 1 ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </CardShell>
  );
}
