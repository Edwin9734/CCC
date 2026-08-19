"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = searchParams.get("next") ?? "/dashboard";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (!data.session) {
          // Esto pasaría si "Confirm email" sigue activado en Supabase
          setMessage("Cuenta creada. Revisa tu correo para confirmar antes de entrar.");
          return;
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-ink">Correo</span>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <Mail className="h-5 w-5 text-muted" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            required
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-ink">Contraseña</span>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <Lock className="h-5 w-5 text-muted" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            minLength={6}
            required
          />
        </div>
      </label>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}
      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-success">{message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (mode === "signup" ? "Creando cuenta..." : "Entrando...") : mode === "signup" ? "Crear cuenta" : "Entrar"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setMessage(null);
        }}
        className="rounded-full border border-black/10 bg-white px-6 py-4 text-base font-semibold text-ink shadow-soft transition hover:bg-slate-50"
      >
        {mode === "signin" ? "Necesito crear la cuenta" : "Ya tengo cuenta, iniciar sesión"}
      </button>
    </form>
  );
}