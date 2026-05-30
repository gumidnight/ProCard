"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Step1Identity } from "./Step1Identity";
import { Step2Games } from "./Step2Games";
import { Step3Connections } from "./Step3Connections";
import { Step4History } from "./Step4History";
import { Step5Publish } from "./Step5Publish";
import type { ProfileStatus, SocialPlatform } from "@/types/db";

const STEP_LABELS = ["Identity", "Games", "Connections", "History", "Publish"];

interface OnboardingShellProps {
  username: string;
  userId: string;
}

interface OnboardingState {
  // Step 1
  display_name: string;
  slug: string;
  country: string;
  tagline: string;
  bio: string;
  esports_role: string;
  // Step 2
  selectedGames: string[];
  roles: { game: string; role: string; is_main: boolean }[];
  // Step 3
  connections: {
    lol: { connected: boolean; accountName?: string };
    valorant: { connected: boolean; accountName?: string };
    cs2: { connected: boolean; accountName?: string; nickname?: string };
  };
  // Step 4
  teamHistory: {
    id: string;
    org_name: string;
    role: string;
    game: string;
    start_date: string;
    end_date: string;
    result_note: string;
  }[];
  // Step 5
  status: ProfileStatus;
  socials: { platform: SocialPlatform; handle_or_url: string }[];
}

const INITIAL_STATE: OnboardingState = {
  display_name: "",
  slug: "",
  country: "",
  tagline: "",
  bio: "",
  esports_role: "",
  selectedGames: [],
  roles: [],
  connections: {
    lol: { connected: false },
    valorant: { connected: false },
    cs2: { connected: false },
  },
  teamHistory: [],
  status: "not_looking",
  socials: [],
};

export function OnboardingShell({ username }: OnboardingShellProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string>();

  const next = useCallback(() => setStep((s) => Math.min(s + 1, 4)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleConnect = useCallback((game: string, data?: { nickname?: string }) => {
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [game]: {
          connected: true,
          accountName: data?.nickname,
          nickname: data?.nickname,
        },
      },
    }));
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(undefined);

    try {
      // 1. Create profile
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: state.slug,
          display_name: state.display_name,
          country: state.country || null,
          tagline: state.tagline || null,
          bio: state.bio || null,
          esports_role: state.esports_role || null,
        }),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        setError(data.error ?? "Failed to create profile");
        setIsPublishing(false);
        return;
      }

      // 2. Save roles
      if (state.roles.length > 0) {
        await fetch("/api/profile/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: state.roles }),
        });
      }

      // 3. Save team history
      for (const entry of state.teamHistory) {
        await fetch("/api/profile/team-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      }

      // 4. Save social links (filter empty)
      const filledSocials = state.socials.filter((s) => s.handle_or_url.trim());
      if (filledSocials.length > 0) {
        await fetch("/api/profile/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links: filledSocials }),
        });
      }

      // 5. Set status + publish
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: state.status,
          is_published: 1,
        }),
      });

      // Redirect to their new public profile
      router.push(`/${state.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-text-muted">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={i <= step ? "text-accent-hover font-medium" : ""}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-surface-3">
          <div
            className="h-1 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <Step1Identity
              data={{
                display_name: state.display_name,
                slug: state.slug,
                country: state.country,
                tagline: state.tagline,
                bio: state.bio,
                esports_role: state.esports_role,
              }}
              onChange={(d) => setState((s) => ({ ...s, ...d }))}
              onNext={next}
              username={username}
            />
          )}

          {step === 1 && (
            <Step2Games
              data={{
                selectedGames: state.selectedGames,
                roles: state.roles,
              }}
              onChange={(d) => setState((s) => ({ ...s, ...d }))}
              onNext={next}
              onBack={back}
            />
          )}

          {step === 2 && (
            <Step3Connections
              selectedGames={state.selectedGames}
              connections={state.connections}
              onConnect={handleConnect}
              onNext={next}
              onBack={back}
            />
          )}

          {step === 3 && (
            <Step4History
              data={{ entries: state.teamHistory }}
              onChange={(d) => setState((s) => ({ ...s, teamHistory: d.entries }))}
              selectedGames={state.selectedGames}
              onNext={next}
              onBack={back}
            />
          )}

          {step === 4 && (
            <Step5Publish
              data={{
                status: state.status,
                socials: state.socials,
              }}
              onChange={(d) => setState((s) => ({ ...s, ...d }))}
              onPublish={handlePublish}
              onBack={back}
              isPublishing={isPublishing}
              slug={state.slug}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
