import Link from "next/link";
import { ArrowRight, Bell, FileText, ShieldCheck, Sparkles, Waves } from "lucide-react";

const highlights = [
  {
    icon: Bell,
    title: "Alertas claras",
    text: "Notificaciones por valores fuera de rango y recordatorios de medicamentos."
  },
  {
    icon: FileText,
    title: "Reportes PDF",
    text: "Exportación con gráficas y registros históricos por fecha."
  },
  {
    icon: ShieldCheck,
    title: "Datos privados",
    text: "Cada usuario solo ve su propia información con RLS en Supabase."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(21,128,61,0.16),_transparent_28%),linear-gradient(180deg,_#fbf7f0_0%,_#f2ede4_100%)] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-sm font-semibold text-accent shadow-soft">
              <Sparkles className="h-4 w-4" />
              Diseñado para adultos mayores
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
              Seguimiento simple y seguro del colesterol
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Sistema web en español para registrar HDL, LDL y triglicéridos de forma manual,
              ver su evolución, recibir alertas y descargar reportes listos para imprimir.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-teal-700"
              >
                Empezar
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-4 text-base font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Ver panel
                <Waves className="h-5 w-5" />
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Resumen del proyecto</p>
            <div className="mt-6 grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-3xl bg-background p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}