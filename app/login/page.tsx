"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You denied access. Try again when you're ready.",
  no_code: "Something went wrong with Discord. Try again.",
  invalid_state: "Session expired. Please try logging in again.",
  auth_failed: "Authentication failed. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-xs flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-[0.06em]">
            PROCARD<span className="text-accent-light">.GG</span>
          </h1>
          <p className="text-[12px] text-text-muted">
            Sign in to manage your profile
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full rounded-[7px] border border-danger/20 bg-danger/5 px-4 py-3 text-center text-[13px] text-danger">
            {ERROR_MESSAGES[error] ?? "An unknown error occurred."}
          </div>
        )}

        {/* Discord login button */}
        <div className="flex w-full flex-col gap-3">
          <a
            href="/api/auth/discord"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#5865F2] px-5 py-3 text-[13px] font-medium text-white transition-all hover:bg-[#4752C4] active:scale-[0.97]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Continue with Discord
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] leading-relaxed text-text-muted">
          We only access your username, avatar, and email.
          <br />
          No messages. No servers. No permissions.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="text-text-muted">Loading...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
