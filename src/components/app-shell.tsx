import Link from "next/link";
import { Activity, CircleUserRound, FileText, Pill, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: Activity },
  { href: "/mediciones", label: "Mediciones", icon: Stethoscope },
  { href: "/medicamentos", label: "Medicamentos", icon: Pill },
  { href: "/reportes", label: "Reportes", icon: FileText }
];

export function AppShell({
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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.12),_transparent_26%),linear-gradient(180deg,_#f8f4eb_0%,_#f2ede4_100%)] text-ink">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-accent uppercase">Control de colesterol</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>
            {userEmail ? <p className="mt-2 text-sm font-semibold text-accent">Sesión activa: {userEmail}</p> : null}
          </div>
          {userEmail ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px] hover:bg-slate-900"
            >
              <CircleUserRound className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <nav className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-4 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-white",
                  "focus:outline-none focus:ring-4 focus:ring-accent/15"
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </main>
    </div>
  );
}