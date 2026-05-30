"use client";

import { useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  SiDiscord,
  SiTwitch,
  SiX,
  SiYoutube,
  SiInstagram,
  SiTiktok,
  SiKick,
} from "react-icons/si";
import { Globe, BookOpen, BarChart3, Target } from "lucide-react";
import { CardShell } from "./CardShell";
import { Input } from "@/components/ui/Input";
import { SaveStatus, type SaveState } from "./SaveStatus";
import type { SocialLinkRow, SocialPlatform } from "@/types/db";

interface SocialsCardProps {
  socials: SocialLinkRow[];
  onUpdate: (socials: SocialLinkRow[]) => void;
}

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const SOCIAL_ICONS: Record<SocialPlatform, IconCmp> = {
  twitch: SiTwitch,
  youtube: SiYoutube,
  kick: SiKick,
  twitter: SiX,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  discord: SiDiscord,
  liquipedia: BookOpen as IconCmp,
  opgg: BarChart3 as IconCmp,
  tracker: Target as IconCmp,
  website: Globe as IconCmp,
};

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
  const buildInitial = () => {
    const d: Record<string, string> = {};
    for (const s of socials) d[s.platform] = s.handle_or_url;
    return d;
  };

  const [draft, setDraft] = useState<Record<string, string>>(buildInitial);
  // Latest draft, readable synchronously from blur handlers.
  const draftRef = useRef<Record<string, string>>(draft);
  // Last snapshot successfully persisted to the server (state, so `dirty` reacts).
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>(draft);
  const [status, setStatus] = useState<SaveState>("idle");
  const [error, setError] = useState<string>();

  // Stable signature of the trimmed, non-empty links for change detection.
  const signature = (d: Record<string, string>) =>
    JSON.stringify(
      SOCIAL_PLATFORMS.flatMap((p) => {
        const v = (d[p.id] ?? "").trim();
        return v ? [[p.id, v]] : [];
      }),
    );

  const dirty = signature(draft) !== signature(savedSnapshot);

  // Build the live-preview rows from a full draft map.
  const buildPreview = (d: Record<string, string>): SocialLinkRow[] =>
    SOCIAL_PLATFORMS.flatMap((p) => {
      const v = (d[p.id] ?? "").trim();
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

  const updateField = (platform: SocialPlatform, value: string) => {
    const next = { ...draftRef.current, [platform]: value };
    draftRef.current = next;
    setDraft(next);
    onUpdate(buildPreview(next));
  };

  // Persist the full set of links on blur. No-op when nothing changed.
  const persist = async () => {
    const d = draftRef.current;
    if (signature(d) === signature(savedSnapshot)) return;
    setStatus("saving");
    setError(undefined);

    const links = SOCIAL_PLATFORMS.flatMap((p) => {
      const v = (d[p.id] ?? "").trim();
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
        setError(data.error ?? "Couldn’t save");
        setStatus("error");
        return;
      }
      setSavedSnapshot(d);
      // Refetch from server for canonical data (ids, ordering).
      const refresh = await fetch("/api/profile");
      if (refresh.ok) {
        const refreshData = await refresh.json();
        onUpdate(refreshData.socialLinks ?? []);
      }
      setStatus("saved");
    } catch {
      setError("Network error");
      setStatus("error");
    }
  };

  return (
    <CardShell
      title="Media & Socials"
      subtitle="Showcase your professional presence"
      icon=""
    >
      <div className="flex flex-col gap-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const Icon = SOCIAL_ICONS[platform.id];
          return (
            <div key={platform.id} className="flex items-center gap-2">
              <span className="flex w-9 shrink-0 items-center justify-center text-text-muted">
                <Icon className="size-4" aria-hidden />
                <span className="sr-only">{platform.label}</span>
              </span>
              <Input
                value={draft[platform.id] ?? ""}
                onChange={(e) => updateField(platform.id, e.target.value)}
                onBlur={persist}
                placeholder={`${platform.label} — ${platform.placeholder}`}
                className="flex-1"
              />
            </div>
          );
        })}

        <div className="flex items-center justify-end pt-2">
          <SaveStatus state={status} dirty={dirty} error={error} />
        </div>
      </div>
    </CardShell>
  );
}
