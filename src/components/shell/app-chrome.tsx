"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogIn, Menu, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppBackground } from "@/components/app-background";
import { Greeting } from "@/components/shell/greeting";
import { ProfilePanel } from "@/components/shell/profile-panel";
import { SideMenu } from "@/components/shell/sidebar";
import { TextSizeControl } from "@/components/text-size-control";
import { initialOf, saveDismissedNotes, type ProfileData } from "@/lib/profile";

export function AppChrome({
  title,
  description,
  userEmail,
  initialProfile,
  initialConditions,
  initialDismissed,
  children
}: {
  title: string;
  description: string;
  userEmail: string | null;
  initialProfile: ProfileData | null;
  initialConditions: string[];
  initialDismissed: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile);
  const [conditions, setConditions] = useState<string[]>(initialConditions);
  const [dismissed, setDismissed] = useState<string[]>(initialDismissed);
  const [savedMessage, setSavedMessage] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!savedMessage) return;
    const id = window.setTimeout(() => setSavedMessage(false), 4000);
    return () => window.clearTimeout(id);
  }, [savedMessage]);

  const openMenu = () => {
    setPanelOpen(false);
    setMenuOpen(true);
  };

  const openPanel = () => {
    setMenuOpen(false);
    setPanelOpen(true);
  };

  const dismissNote = (kind: string) => {
    const next = Array.from(new Set([...dismissed, kind]));
    setDismissed(next);
    saveDismissedNotes(next);
  };

  const handleSaved = (nextProfile: ProfileData, nextConditions: string[]) => {
    setProfile(nextProfile);
    setConditions(nextConditions);
    setPanelOpen(false);
    setSavedMessage(true);
    // Vuelve a cargar la página con los datos nuevos (por ejemplo, el sexo cambia el estado del HDL).
    router.refresh();
  };

  const handleProfileUpdated = (nextProfile: ProfileData) => {
    setProfile(nextProfile);
    router.refresh();
  };

  const initial = initialOf(profile?.first_name);

  return (
    <div className="app-theme min-h-screen text-ink">
      <AppBackground />
      <header className="no-print sticky top-0 z-30 border-b border-black/5 bg-white/85 shadow-[0_8px_24px_rgba(225,29,72,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={openMenu}
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink shadow-soft transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
            >
              <Menu className="h-5 w-5" />
              Menú
            </button>
            <div className="ab-logo" aria-hidden="true">
              <span>♥</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <TextSizeControl />
            </div>

            {userEmail ? (
              <button
                ref={profileButtonRef}
                type="button"
                onClick={openPanel}
                aria-label="Abrir mis datos"
                aria-haspopup="dialog"
                aria-expanded={panelOpen}
                aria-controls="profile-panel"
                title="Mis datos"
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full border text-base font-semibold shadow-soft transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                  initial
                    ? "border-accent bg-accent text-white hover:bg-accentDark"
                    : "border-black/10 bg-white text-ink hover:bg-slate-50"
                )}
              >
                {initial ? initial : <UserRound className="h-5 w-5" />}
                {!initial ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-warning motion-reduce:animate-none"
                  />
                ) : null}
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-900"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userEmail={userEmail}
        returnFocusRef={menuButtonRef}
      />

      {userEmail ? (
        <ProfilePanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          returnFocusRef={profileButtonRef}
          profile={profile}
          conditions={conditions}
          onSaved={handleSaved}
          onProfileUpdated={handleProfileUpdated}
        />
      ) : null}

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-5">
          {userEmail ? (
            <Greeting
              profile={profile}
              dismissed={dismissed}
              savedMessage={savedMessage}
              onDismiss={dismissNote}
              onOpenPanel={openPanel}
            />
          ) : null}

          <div className="no-print">
            <h1 className="ab-title text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>
          </div>

          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}