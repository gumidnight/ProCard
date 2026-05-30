"use client";

import { Check } from "lucide-react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Compact auto-save indicator used by the dashboard cards. Replaces the old
 * explicit "Save" buttons — edits persist on blur, this just reports status.
 */
export function SaveStatus({
  state,
  dirty,
  error,
}: {
  state: SaveState;
  dirty: boolean;
  error?: string;
}) {
  if (state === "error") {
    return (
      <span className="text-[11px] text-red-400">
        {error ?? "Couldn’t save — try again"}
      </span>
    );
  }

  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <Spinner />
        Saving…
      </span>
    );
  }

  // Edited but not yet blurred / sent.
  if (dirty) {
    return (
      <span className="text-[11px] text-text-muted">
        Saves automatically when you click away
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-green-400">
        <Check size={12} strokeWidth={3} />
        Saved
      </span>
    );
  }

  return <span className="text-[11px] text-text-muted">Up to date</span>;
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
