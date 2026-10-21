import { AlertTriangle, X } from "lucide-react";
import { URGENT_CARE_TEXT } from "@/lib/ranges";

export function CriticalAlert({
  title,
  message,
  footnote,
  onDismiss
}: {
  title: string;
  message: string;
  footnote?: string;
  onDismiss?: () => void;
}) {
  return (
    <div role="alert" className="rounded-3xl border-2 border-red-700 bg-red-50 p-5 text-red-900 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
          <div>
            <p className="text-lg font-bold">{title}</p>
            <p className="mt-2 text-base leading-7">{message}</p>
            <p className="mt-3 rounded-2xl bg-red-100 p-3 text-sm font-semibold leading-6">{URGENT_CARE_TEXT}</p>
            {footnote ? <p className="mt-3 text-xs leading-5">{footnote}</p> : null}
          </div>
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded-full p-2 text-red-900 transition hover:bg-red-100"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}