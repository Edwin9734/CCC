import { cookies } from "next/headers";
import { AppChrome } from "@/components/shell/app-chrome";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { NOTES_COOKIE, parseDismissedNotes, type ProfileData } from "@/lib/profile";

export async function AppShell({
  title,
  description,
  userEmail,
  children
}: {
  title: string;
  description: string;
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  let profile: ProfileData | null = null;
  let conditions: string[] = [];
  let dismissed: string[] = [];

  if (userEmail) {
    const supabase = await createSupabaseServerClient();
    const loaded = await loadProfileForShell(supabase);
    profile = loaded.profile;
    conditions = loaded.conditions;

    const cookieStore = await cookies();
    dismissed = parseDismissedNotes(cookieStore.get(NOTES_COOKIE)?.value);
  }

  return (
    <AppChrome
      title={title}
      description={description}
      userEmail={userEmail ?? null}
      initialProfile={profile}
      initialConditions={conditions}
      initialDismissed={dismissed}
    >
      {children}
    </AppChrome>
  );
}