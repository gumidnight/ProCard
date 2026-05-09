"use client";

export function ProfileFooterCTA() {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-border-subtle pt-8 text-center">
      <p className="text-sm text-text-muted">
        Want your own RankCard?
      </p>
      <a
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
      >
        Build your RankCard →
      </a>
    </div>
  );
}
