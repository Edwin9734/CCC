"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BellOff, BellRing, Send, Share, Smartphone } from "lucide-react";

type Phase = "loading" | "unsupported" | "install" | "unconfigured" | "denied" | "off" | "on";

interface Prefs {
  hide_names: boolean;
  second_reminder: boolean;
}

const DEFAULT_PREFS: Prefs = { hide_names: false, second_reminder: true };
const API = "/api/recordatorios/suscripcion";
const ERROR_TEXT = "No se pudo completar. Revisa tu conexión e inténtalo de nuevo.";

function toKeyBytes(base64: string) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

function Shell({ tone, icon, title, children }: { tone: string; icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <section className={`ant-rise rounded-[1.75rem] p-4 ${tone}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70" aria-hidden="true">
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

export function ReminderCard({ publicKey, notify }: { publicKey: string | null; notify: (text: string, error?: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [busy, setBusy] = useState(false);

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
  }, [publicKey]);

  const send = (method: "POST" | "DELETE", body: object) =>
    fetch(API, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((response) => {
      if (!response.ok) throw new Error("Respuesta no válida");
    });

  const enable = async () => {
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
      notify("¡Recordatorios activados!");
    } catch {
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await send("DELETE", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setPhase("off");
      notify("Recordatorios desactivados");
    } catch {
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  };

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

  const test = async () => {
    setBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      const response = await fetch("/api/recordatorios/prueba", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription?.endpoint }) });
      if (!response.ok) throw new Error("Respuesta no válida");
      notify("Aviso enviado. Debe llegar en unos segundos.");
    } catch {
      notify(ERROR_TEXT, true);
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading" || phase === "unconfigured") return null;

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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
          <button type="button" onClick={test} disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-base font-semibold text-white transition active:scale-95 disabled:opacity-60">
            <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
            Enviar prueba
          </button>
          <button type="button" onClick={disable} disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition active:scale-95 disabled:opacity-60">
            <BellOff className="h-5 w-5 shrink-0" aria-hidden="true" />
            Desactivar
          </button>
        </div>
      </div>
    </Shell>
  );
}
