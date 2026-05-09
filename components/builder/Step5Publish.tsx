"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import type { ProfileStatus, SocialPlatform } from "@/types/db";

interface SocialEntry {
  platform: SocialPlatform;
  handle_or_url: string;
}

interface Step5Data {
  status: ProfileStatus;
  socials: SocialEntry[];
}

interface Step5Props {
  data: Step5Data;
  onChange: (data: Step5Data) => void;
  onPublish: () => void;
  onBack: () => void;
  isPublishing: boolean;
  slug: string;
}

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: "open", label: "Open to offers" },
  { value: "on_team", label: "On a team" },
  { value: "not_looking", label: "Not looking" },
];

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
  { id: "opgg", label: "OP.GG", placeholder: "op.gg/summoners/..." },
  { id: "tracker", label: "Tracker.gg", placeholder: "tracker.gg/..." },
  { id: "website", label: "Website / Other", placeholder: "https://..." },
];

export function Step5Publish({
  data,
  onChange,
  onPublish,
  onBack,
  isPublishing,
  slug,
}: Step5Props) {
  const updateSocial = (platform: SocialPlatform, value: string) => {
    const existing = data.socials.find((s) => s.platform === platform);
    const socials = existing
      ? data.socials.map((s) =>
          s.platform === platform
            ? { ...s, handle_or_url: value }
            : s,
        )
      : [
          ...data.socials,
          { platform, handle_or_url: value },
        ];
    onChange({ ...data, socials });
  };

  const getSocialValue = (platform: SocialPlatform) =>
    data.socials.find((s) => s.platform === platform)?.handle_or_url ??
    "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide">
          Almost There
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Set your availability and add social links.
        </p>
      </div>

      {/* Availability status */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">
          Availability
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...data, status: opt.value })}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                data.status === opt.value
                  ? "border-accent bg-accent/10 text-accent-light"
                  : "border-border-subtle bg-bg-surface text-text-secondary hover:border-border-default"
              }`}
            >
              <StatusBadge status={opt.value} />
            </button>
          ))}
        </div>
      </div>

      {/* Social links */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-text-secondary">
            Media & Socials
          </label>
          <p className="mt-1 text-xs text-text-muted">
            Showcase your professional presence. All optional — fill in only what you use.
          </p>
        </div>

        <div className="grid gap-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.id} className="flex items-center gap-2">
              <span className="flex w-9 shrink-0 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {platform.label.slice(0, 3)}
              </span>
              <Input
                value={getSocialValue(platform.id)}
                onChange={(e) =>
                  updateSocial(platform.id, e.target.value)
                }
                placeholder={`${platform.label} — ${platform.placeholder}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preview URL */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 text-center">
        <p className="text-xs text-text-muted">Your profile will be at</p>
        <p className="mt-1 font-mono text-sm text-accent-light">
          procard.gg/{slug}
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onPublish} isLoading={isPublishing}>
          Publish Profile
        </Button>
      </div>
    </div>
  );
}
