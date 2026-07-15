import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";

export default function MedicationsPage() {
  return (
    <AppShell
      title="Medicamentos"
      description="Registro de nombre, dosis y horarios para generar recordatorios por notificación y correo."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Nuevo medicamento" description="Campos simples para que el usuario lo complete sin confusión.">
          <form className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Nombre</span>
              <input className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none" placeholder="Ej. Atorvastatina" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Dosis</span>
              <input className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none" placeholder="Ej. 20 mg" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Horario</span>
              <input className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none" placeholder="Ej. 08:00 y 20:00" />
            </label>
            <button type="button" className="rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft">
              Guardar medicamento
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Lista actual" description="Después se conectará a la tabla medications y sus horarios.">
          <div className="space-y-4">
            <article className="rounded-3xl border border-black/5 bg-background p-5">
              <p className="text-sm font-semibold text-ink">Atorvastatina</p>
              <p className="mt-1 text-sm text-muted">20 mg · 08:00 · 20:00</p>
            </article>
            <article className="rounded-3xl border border-black/5 bg-background p-5">
              <p className="text-sm font-semibold text-ink">Omega 3</p>
              <p className="mt-1 text-sm text-muted">1 cápsula · 09:00</p>
            </article>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}