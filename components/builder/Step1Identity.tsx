"use client";

import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { SlugInput } from "@/components/ui/SlugInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { COUNTRIES } from "@/lib/utils/country";
import { ESPORTS_ROLES } from "@/lib/constants/esports-roles";
import { sanitiseUsernameToSlug } from "@/lib/utils/slug";

interface Step1Data {
  display_name: string;
  slug: string;
  country: string;
  tagline: string;
  bio: string;
  esports_role: string;
}

interface Step1Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onNext: () => void;
  username: string;
}

export function Step1Identity({ data, onChange, onNext, username }: Step1Props) {
  const update = (field: keyof Step1Data, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const canProceed = data.display_name.trim().length > 0 && data.slug.length >= 3;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide">Your Identity</h2>
        <p className="mt-1 text-sm text-text-secondary">How do you want to be known?</p>
      </div>

      <Input
        label="Display Name"
        value={data.display_name}
        onChange={(e) => update("display_name", e.target.value)}
        placeholder="ALEXG"
        hint="Your gamertag or display name"
      />

      <SlugInput
        value={data.slug}
        onChange={(v) => update("slug", v)}
        initialSuggestion={sanitiseUsernameToSlug(username)}
      />

      <Input
        label="Tagline"
        value={data.tagline}
        onChange={(e) => update("tagline", e.target.value)}
        placeholder="alexg#EUW"
        hint="Optional — Riot ID, Discord tag, etc."
      />

      <Select
        label="Country"
        value={data.country}
        onChange={(e) => update("country", e.target.value)}
        options={COUNTRIES.map((c) => ({
          value: c.code,
          label: c.name,
        }))}
      />

      <Select
        label="Esports Role"
        value={data.esports_role}
        onChange={(e) => update("esports_role", e.target.value)}
        options={ESPORTS_ROLES.map((r) => ({
          value: r.value,
          label: r.label,
        }))}
      />

      <TextArea
        label="Bio"
        value={data.bio}
        onChange={(e) => update("bio", e.target.value)}
        placeholder="Brief intro — who are you as a player?"
        maxLength={280}
        charCount
        rows={3}
        hint={
          "Markdown supported — **bold**, *italic*, ~~strike~~, `code`, [links](https://…)"
        }
      />

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canProceed}>
          Next →
        </Button>
      </div>
    </div>
  );
}
