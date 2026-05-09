import { getSessionUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const user = await getSessionUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-3xl font-bold tracking-wide">
          Welcome, {user?.username}
        </h1>
        <p className="text-text-secondary">
          Let&apos;s build your RankCard profile.
        </p>
        <div className="mt-4 rounded-lg border border-border-subtle bg-bg-surface px-6 py-3 text-sm text-text-muted">
          Profile builder coming next — auth is working!
        </div>
      </div>
    </main>
  );
}
