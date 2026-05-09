"use client";

export function ProfileFooterCTA() {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-border-subtle pt-8 text-center">
      <p className="text-sm text-text-muted">
        Want your own ProCard?
      </p>
      <a
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-light active:scale-[0.97]"
      >
        Build your ProCard →
      </a>
    </div>
  );
}
