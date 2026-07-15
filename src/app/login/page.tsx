import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8f4eb_0%,_#efe8db_100%)] px-4 py-10 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Acceso seguro</p>
            <h1 className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Inicia sesión para ver tu información
            </h1>
            <p className="mt-3 text-base leading-7 text-muted">
              En esta primera versión, la autenticación quedará conectada a Supabase. Esta pantalla ya está lista para integrar el flujo real.
            </p>

            <LoginForm />
          </section>

          <aside className="rounded-[2rem] border border-black/5 bg-ink p-8 text-white shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">Diseño simple</p>
            <h2 className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Botones grandes, lectura clara y navegación corta.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-200">
              El proyecto ya queda preparado para RLS en Supabase, alertas, gráficas y reportes descargables.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">
                Ir al panel
              </Link>
              <Link href="/" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                Volver al inicio
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}