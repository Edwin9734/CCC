import { AlertTriangle, Phone, X } from "lucide-react";
import { telHref, type ContactsInfo } from "@/lib/contacts";
import { URGENT_CARE_TEXT } from "@/lib/ranges";

function ContactRow({
  title,
  name,
  detail,
  phone
}: {
  title: string;
  name: string | null;
  detail?: string | null;
  phone: string | null;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-3">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-sm leading-6">
          {name ?? "Sin nombre guardado"}
          {detail ? ` (${detail})` : ""}
        </p>
      </div>

      {phone ? (
        <a
          href={telHref(phone)}
          className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          <Phone className="h-4 w-4" />
          Llamar {phone}
        </a>
      ) : (
        <span className="text-xs">Sin teléfono guardado</span>
      )}
    </li>
  );
}

export function CriticalAlert({
  title,
  message,
  footnote,
  contacts,
  onDismiss
}: {
  title: string;
  message: string;
  footnote?: string;
  // undefined = no mostrar nada; null = no hay datos guardados (muestra una sugerencia)
  contacts?: ContactsInfo | null;
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

            {contacts ? (
              <div className="mt-3">
                <p className="text-sm font-bold">Si necesitas ayuda ahora:</p>
                <ul className="mt-2 space-y-2">
                  {contacts.doctor ? (
                    <ContactRow title="Tu médico" name={contacts.doctor.name} phone={contacts.doctor.phone} />
                  ) : null}
                  {contacts.emergency ? (
                    <ContactRow
                      title="Contacto de emergencia"
                      name={contacts.emergency.name}
                      detail={contacts.emergency.relationship}
                      phone={contacts.emergency.phone}
                    />
                  ) : null}
                </ul>
              </div>
            ) : contacts === null ? (
              <p className="mt-3 text-xs leading-5">
                Puedes guardar tu médico y un contacto de emergencia en «Mis datos» (el botón de arriba a la
                derecha) para tenerlos aquí a la mano.
              </p>
            ) : null}

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