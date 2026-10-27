"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          const msg = signUpError.message.toLowerCase();

          if (msg.includes("already registered")) {
            setError("EL USUARIO YA EXISTE");
          } else if (msg.includes("password")) {
            setError("La contraseña debe tener al menos 6 caracteres.");
          } else {
            setError(signUpError.message);
          }
          return;
        }

        // Si "Confirm email" está activado, Supabase no da error con un correo
        // existente: devuelve un usuario sin identidades.
        if (data.user && data.user.identities?.length === 0) {
          setError("EL USUARIO YA EXISTE");
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
        const msg = signInError.message.toLowerCase();

        if (msg.includes("invalid login credentials")) {
          setError("Correo o contraseña incorrectos.");
        } else if (msg.includes("email not confirmed")) {
          setError("Falta confirmar tu correo. Revisa tu bandeja de entrada.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <form className="l-form" onSubmit={handleSubmit}>
      <div className="l-in" style={step(3)}>
        <label className="l-label" htmlFor="login-email">
          Correo
        </label>
        <div className="l-field">
          <Mail className="h-5 w-5" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="l-in" style={step(4)}>
        <label className="l-label" htmlFor="login-password">
          Contraseña
        </label>
        <div className="l-field">
          <Lock className="h-5 w-5" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button
            type="button"
            className="l-eye"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error ? <p className="l-msg err">{error}</p> : null}
      {message ? <p className="l-msg ok">{message}</p> : null}

      <button type="submit" disabled={isPending} className="l-btn l-in" style={step(5)}>
        {isPending ? (mode === "signup" ? "Creando cuenta..." : "Entrando...") : mode === "signup" ? "Crear cuenta" : "Entrar →"}
      </button>

      <button
        type="button"
        className="l-btn2 l-in"
        style={step(6)}
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setMessage(null);
        }}
      >
        {mode === "signin" ? "Necesito crear la cuenta" : "Ya tengo cuenta, iniciar sesión"}
      </button>
    </form>
  );
}