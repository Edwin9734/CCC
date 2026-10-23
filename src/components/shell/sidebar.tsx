"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type RefObject } from "react";
import {
  Activity,
  Apple,
  BookOpen,
  ClipboardList,
  FileText,
  HeartPulse,
  LogIn,
  Pill,
  Stethoscope,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TextSizeControl } from "@/components/text-size-control";
import { useDrawer } from "@/lib/use-drawer";

const GROUPS = [
  {
    title: "Registrar",
    items: [
      { href: "/mediciones", label: "Mediciones", icon: Stethoscope },
      { href: "/medicamentos", label: "Medicamentos", icon: Pill },
      { href: "/diario", label: "Diario", icon: BookOpen },
      { href: "/habitos", label: "Hábitos", icon: HeartPulse }
    ]
  },
  {
    title: "Consultar",
    items: [
      { href: "/dashboard", label: "Resumen", icon: Activity },
      { href: "/plan", label: "Mi plan", icon: ClipboardList },
      { href: "/dietas", label: "Dietas", icon: Apple },
      { href: "/reportes", label: "Reportes", icon: FileText }
    ]
  }
];

export function SideMenu({
  open,
  onClose,
  userEmail,
  returnFocusRef
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string | null;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);

  useDrawer({ open, onClose, panelRef, returnFocusRef });

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "no-print fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        ref={panelRef}
        id="app-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        aria-hidden={!open}
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[88vw] flex-col bg-surface shadow-soft transition-[transform,visibility] duration-300 motion-reduce:transition-none",
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Control de colesterol</p>
            <p className="mt-0.5 text-sm text-muted">Menú</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar menú"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {/* En el celular el control de letra no cabe en la barra, así que va aquí */}
          <div className="md:hidden">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tamaño de letra</p>
            <div className="mt-2">
              <TextSizeControl />
            </div>
          </div>

          <nav aria-label="Secciones" className="space-y-6">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{group.title}</p>
                <ul className="mt-2 space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-3 py-3 text-base font-semibold text-ink transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                            active ? "border-accent bg-accentSoft" : "border-black/5 bg-white/80 hover:bg-white"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-accent",
                              active ? "bg-white" : "bg-accentSoft"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-black/5 px-5 py-4">
          {userEmail ? (
            <>
              <p className="text-xs text-muted">Sesión activa:</p>
              <p className="mt-0.5 break-all text-sm font-semibold text-accent">{userEmail}</p>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}