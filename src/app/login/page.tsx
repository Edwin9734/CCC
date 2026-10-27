import { redirect } from "next/navigation";
import { FloatingBackground } from "@/components/auth/floating-background";
import { LoginForm } from "@/components/auth/login-form";
import "@/components/auth/login-animations.css";
import { TextSizeControl } from "@/components/text-size-control";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <FloatingBackground />

      <div className="l-tools">
        <TextSizeControl />
      </div>

      <section className="login-card">
        <div className="l-top l-in" style={{ "--i": 0 } as React.CSSProperties}>
          <span className="l-badge">Acceso seguro</span>
          <div className="l-logo">
            <span>♥</span>
          </div>
        </div>

        <h1 className="l-title l-in" style={{ "--i": 1 } as React.CSSProperties}>
          Inicia sesión para ver tu información
        </h1>
        <p className="l-sub l-in" style={{ "--i": 2 } as React.CSSProperties}>
          Controla tu colesterol y triglicéridos de forma sencilla.
        </p>

        <svg
          className="l-ecg l-in"
          style={{ "--i": 2 } as React.CSSProperties}
          viewBox="0 0 400 36"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            pathLength={1}
            d="M0 20 H110 L125 20 L135 6 L148 32 L160 14 L168 20 H260 L275 20 L285 8 L298 31 L310 15 L318 20 H400"
          />
        </svg>

        <LoginForm />

        
      </section>
    </main>
  );
}