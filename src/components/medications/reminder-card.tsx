"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, BellRing, Share, Smartphone, X } from "lucide-react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/plan/plan.css";
import { useToast } from "@/components/antecedentes/antecedentes-ui";
import { useDrawer } from "@/lib/use-drawer";

type Phase = "loading" | "unsupported" | "install" | "unconfigured" | "denied" | "off" | "on";
type Notify = (text: string, error?: boolean) => void;

interface Prefs {
  hide_names: boolean;
  second_reminder: boolean;
}

const DEFAULT_PREFS: Prefs = { hide_names: false, second_reminder: true };
const API = "/api/recordatorios/suscripcion";
const ERROR_TEXT = "No se pudo completar. Revisa tu conexión e inténtalo de nuevo.";
const CHANGED_EVENT = "recordatorios-cambiados"; // mantiene iguales la campana y el cuadro de Hoy

function toKeyBytes(base64: string) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

function useReminders(publicKey: string | null, notify: Notify) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const onChanged = () => setRefresh((value) => value + 1);
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    let active = true;

    const detect = async (): Promise<Phase> => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (isIos && !standalone) return "install";
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
      if (!publicKey) return "unconfigured";
      if (Notification.permission === "denied") return "denied";

      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return "off";

      const response = await fetch(`${API}?endpoint=${encodeURIComponent(subscription.endpoint)}`);
      if (!response.ok) return "off";
      const { subscription: saved } = (await response.json()) as { subscription: Prefs | null };
      if (!saved) return "off";
      if (active) setPrefs(saved);
      return "on";
    };

    detect()
      .then((next) => {
        if (active) setPhase(next);
      })
      .catch(() => {
        if (active) setPhase("off");
      });

    return () => {
      active = false;
    };
  }, [publicKey, refresh]);

  const announce = () => window.dispatchEvent(new Event(CHANGED_EVENT));

  const send = (method: "POST" | "DELETE", body: object) =>
    fetch(API, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((response) => {
      if (!response.ok) throw new Error("Respuesta no válida");
    });

  const enable = useCallback(async () => {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await getRegistration();
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKeyBytes(publicKey) });
      try {
        await send("POST", { ...subscription.toJSON(), ...DEFAULT_PREFS });
      } catch (error) {
        await subscription.unsubscribe();
        throw error;
      }
      setPrefs(DEFAULT_PREFS);
      setPhase("on");
      announce();
      notify("¡Recordatorios activados!");
    } catch {
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  }, [publicKey, notify]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await send("DELETE", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setPhase("off");
      announce();
      notify("Recordatorios desactivados");
    } catch {
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  }, [notify]);

  const changePref = async (changes: Partial<Prefs>) => {
    const next = { ...prefs, ...changes };
    const previous = prefs;
    setPrefs(next);
    setBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) throw new Error("Sin suscripción");
      await send("POST", { ...subscription.toJSON(), ...next });
    } catch {
      setPrefs(previous);
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  };

  return { phase, prefs, busy, enable, disable, changePref };
}

type ReminderState = ReturnType<typeof useReminders>;

function Shell({ tone, icon, title, children }: { tone: string; icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <section className={`ant-rise rounded-[1.75rem] p-4 ${tone}`}>
      <div className="flex items-center gap-3">
        <span className="ant-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70" aria-hidden="true">
          {icon}
        </span>
        <h3 className="min-w-0 flex-1 text-lg font-bold leading-5">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, on, disabled, onChange }: { label: string; on: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onChange} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left text-base font-semibold leading-5 text-ink transition active:scale-[0.98] disabled:opacity-60">
      <span className="min-w-0 flex-1">{label}</span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-emerald-600" : "bg-slate-300"}`} aria-hidden="true">
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 motion-reduce:transition-none ${on ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

function ReminderContent({ state }: { state: ReminderState }) {
  const { phase, prefs, busy, enable, disable, changePref } = state;

  if (phase === "unsupported") {
    return (
      <Shell tone="bg-slate-100 text-slate-900" icon={<BellOff className="h-6 w-6" />} title="Este navegador no permite recordatorios">
        <p className="mt-2 text-base leading-5">En Android, ábrela con Chrome.</p>
      </Shell>
    );
  }

  if (phase === "install") {
    return (
      <Shell tone="bg-sky-100 text-sky-950" icon={<Smartphone className="h-6 w-6" />} title="Instala la app para recibir recordatorios">
        <ol className="mt-2 space-y-1 text-base font-semibold leading-5">
          <li className="flex items-center gap-2">
            1. Toca <Share className="h-5 w-5 shrink-0" aria-label="Compartir" /> abajo en Safari
          </li>
          <li>2. Elige «Agregar a inicio»</li>
          <li>3. Abre la app desde ese ícono</li>
        </ol>
      </Shell>
    );
  }

  if (phase === "denied") {
    return (
      <Shell tone="bg-amber-100 text-amber-950" icon={<BellOff className="h-6 w-6" />} title="Los avisos están bloqueados">
        <p className="mt-2 text-base leading-5">Permite las notificaciones de esta app en los ajustes de tu celular y vuelve a abrirla.</p>
      </Shell>
    );
  }

  if (phase === "off") {
    return (
      <Shell tone="bg-amber-200 text-amber-950" icon={<BellRing className="pln-updown h-7 w-7" />} title="¿Quieres que te avise a la hora de cada medicina?">
        <button type="button" onClick={enable} disabled={busy} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-lg font-bold text-white shadow-soft transition hover:bg-violet-800 active:scale-[0.98] disabled:opacity-60">
          <BellRing className="h-6 w-6 shrink-0" aria-hidden="true" />
          {busy ? "Activando…" : "Activar recordatorios"}
        </button>
      </Shell>
    );
  }

  return (
    <Shell tone="bg-emerald-100 text-emerald-950" icon={<BellRing className="h-6 w-6 text-emerald-700" />} title="Recordatorios activados en este celular">
      <div className="mt-3 space-y-2">
        <Toggle label="Mostrar el nombre de la medicina en el aviso" on={!prefs.hide_names} disabled={busy} onChange={() => changePref({ hide_names: !prefs.hide_names })} />
        <Toggle label="Avisarme otra vez a los 30 minutos si no la marco" on={prefs.second_reminder} disabled={busy} onChange={() => changePref({ second_reminder: !prefs.second_reminder })} />
        <button type="button" onClick={disable} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition active:scale-95 disabled:opacity-60">
          <BellOff className="h-5 w-5 shrink-0" aria-hidden="true" />
          Desactivar
        </button>
      </div>
    </Shell>
  );
}

// En Hoy solo aparece mientras falte activarlos; ya activados, se manejan desde la campana.
export function ReminderCard({ publicKey, notify }: { publicKey: string | null; notify: Notify }) {
  const state = useReminders(publicKey, notify);
  if (state.phase === "loading" || state.phase === "unconfigured" || state.phase === "on") return null;
  return <ReminderContent state={state} />;
}

function BellDialog({ state, onClose, returnFocusRef }: { state: ReminderState; onClose: () => void; returnFocusRef: React.RefObject<HTMLElement | null> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDrawer({ open: true, onClose, panelRef, returnFocusRef });

  return createPortal(
    <div onClick={onClose} className="ant-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Recordatorios"
        onClick={(event) => event.stopPropagation()}
        className="ant-modal max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-surface p-3 text-ink shadow-soft"
      >
        <div className="mb-2 flex items-center justify-between gap-3 pl-2">
          <p className="min-w-0 text-xl font-bold">Recordatorios</p>
          <button type="button" onClick={onClose} data-autofocus aria-label="Cerrar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition active:scale-95">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <ReminderContent state={state} />
      </div>
    </div>,
    document.body
  );
}

// Campana de la barra superior.
export function ReminderBell({ publicKey }: { publicKey: string | null }) {
  const { toastElement, showToast } = useToast();
  const state = useReminders(publicKey, showToast);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (state.phase === "loading" || state.phase === "unconfigured" || state.phase === "unsupported") return null;

  const active = state.phase === "on";
  const Icon = active ? BellRing : Bell;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? "Recordatorios activados" : "Recordatorios desactivados"}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Recordatorios"
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-soft transition focus:outline-none focus:ring-4 focus:ring-accent/15 active:scale-95 ${
          active ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-black/10 bg-white text-ink hover:bg-slate-50"
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
        {active ? <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-600" aria-hidden="true" /> : null}
      </button>
      {open ? <BellDialog state={state} onClose={() => setOpen(false)} returnFocusRef={buttonRef} /> : null}
      {toastElement}
    </>
  );
}
