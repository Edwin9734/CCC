"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, UserRound, X } from "lucide-react";
import { currentNote, greetingForHour, type ProfileData } from "@/lib/profile";

export function Greeting({
  profile,
  dismissed,
  savedMessage,
  onDismiss,
  onOpenPanel
}: {
  profile: ProfileData | null;
  dismissed: string[];
  savedMessage: boolean;
  onDismiss: (kind: string) => void;
  onOpenPanel: () => void;
}) {
  // La hora se toma del dispositivo, ya en el navegador (el servidor usaría otra zona horaria).
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, []);

  const name = profile?.first_name?.trim() ?? "";
  const note = currentNote(profile, dismissed);
  const text = hour === null ? "" : name ? `${greetingForHour(hour)}, ${name}` : greetingForHour(hour);

  const isName = note?.kind === "name";

  return (
    <div className="no-print">
      <p className="min-h-[2rem] text-xl font-semibold text-ink sm:text-2xl">{text || "\u00A0"}</p>

      {savedMessage ? (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Tus datos se guardaron.
        </p>
      ) : null}

      {note ? (
        <div
          className={`mt-3 flex items-stretch rounded-2xl border ${
            isName ? "border-amber-300 bg-amber-50 text-amber-900" : "border-black/10 bg-white/70 text-ink"
          }`}
        >
          <button
            type="button"
            onClick={onOpenPanel}
            className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left leading-6 ${
              isName ? "text-sm font-semibold hover:bg-amber-100" : "text-sm hover:bg-white"
            }`}
          >
            <UserRound className="h-5 w-5 shrink-0" />
            <span>{note.text}</span>
          </button>
          <button
            type="button"
            onClick={() => onDismiss(note.kind)}
            aria-label="Ocultar aviso"
            className={`m-1 shrink-0 rounded-full p-3 ${isName ? "hover:bg-amber-100" : "hover:bg-white"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}