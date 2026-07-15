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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = searchParams.get("next") ?? "/dashboard";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
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

  const handleCreateAccount = () => {
    setError(null);
    setMessage("Si el correo no existe, crea primero la cuenta desde Supabase Auth o con invitación manual.");
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
            autoComplete="current-password"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
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
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      <button
        type="button"
        onClick={handleCreateAccount}
        className="rounded-full border border-black/10 bg-white px-6 py-4 text-base font-semibold text-ink shadow-soft transition hover:bg-slate-50"
      >
        Necesito crear la cuenta
      </button>
    </form>
  );
}