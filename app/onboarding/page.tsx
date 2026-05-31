import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { OnboardingShell } from "@/components/builder/OnboardingShell";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // If they already have a profile, send to dashboard
  const profile = await findProfileByUserId(user.id);
  if (profile) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center py-8">
      <OnboardingShell username={user.username} userId={user.id} />
    </main>
  );
}
