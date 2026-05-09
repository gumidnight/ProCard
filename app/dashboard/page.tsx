import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const profile = user ? findProfileByUserId(user.id) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-3xl font-bold tracking-wide">
          Dashboard
        </h1>
        <p className="text-text-secondary">
          Welcome back, {user?.username}
        </p>
        {profile ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-6 py-3 text-sm text-text-muted">
            Your profile: rankcard.gg/{profile.slug}
          </div>
        ) : (
          <a
            href="/onboarding"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Create your profile
          </a>
        )}
      </div>
    </main>
  );
}
