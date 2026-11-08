import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Pill, Stethoscope, Utensils } from "lucide-react";
import { AppBackground } from "@/components/app-background";
import { TextSizeControl } from "@/components/text-size-control";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEATURES = [
  { icon: Stethoscope, label: "Mediciones", color: "bg-rose-600" },
  { icon: Pill, label: "Medicinas", color: "bg-violet-600" },
  { icon: Utensils, label: "Comidas", color: "bg-amber-600" }
];

// Bienvenida: quien ya tiene sesión entra directo a la aplicación.
export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="app-theme min-h-[100dvh] text-ink">
      <AppBackground />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
        <div className="flex justify-center">
          <TextSizeControl />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="my-8 scale-[2.4]">
            <div className="ab-logo" aria-hidden="true">
              <span>♥</span>
            </div>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Control de Colesterol
          </h1>
          <p className="mt-3 text-lg leading-7 text-muted">Tu colesterol y triglicéridos, fáciles de seguir cada día.</p>

          <ul className="mt-8 grid w-full grid-cols-3 gap-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.label} className="flex flex-col items-center gap-2 text-sm font-semibold text-ink">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-soft ${feature.color}`}>
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </span>
                  {feature.label}
                </li>
              );
            })}
          </ul>
        </section>

        <Link
          href="/login"
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-xl font-semibold text-white shadow-soft transition active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-accent/25 motion-reduce:transition-none"
        >
          Entrar
          <ArrowRight className="h-6 w-6" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
