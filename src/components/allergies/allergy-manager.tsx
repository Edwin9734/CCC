"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAllergy, deleteAllergy, type AllergyRow } from "@/lib/supabase/allergies";

export function AllergyManager({ initialAllergies }: { initialAllergies: AllergyRow[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [allergies, setAllergies] = useState<AllergyRow[]>(initialAllergies);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Escribe el nombre de la alergia.");
      return;
    }

    if (allergies.some((a) => a.allergy_name.trim().toLowerCase() === cleanName.toLowerCase())) {
      setError("Ya registraste esa alergia.");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createAllergy(supabase, { allergy_name: cleanName, notes: notes.trim() });
        setAllergies((prev) => [...prev, created]);
        setName("");
        setNotes("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await deleteAllergy(supabase, id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <SectionCard
      title="Mis alergias"
      description="Registra los alimentos a los que eres alérgico. Los ocultaremos de la guía y no te los sugeriremos."
    >
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Mariscos, nueces, lácteos"
          className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nota (opcional)"
          className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Guardando..." : "Agregar"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      ) : null}

      {allergies.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No tienes alergias registradas.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {allergies.map((allergy) => (
            <article
              key={allergy.id}
              className="flex items-start justify-between gap-3 rounded-3xl border border-black/5 bg-background p-4"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-ink">{allergy.allergy_name}</p>
                  {allergy.notes ? <p className="mt-1 text-xs text-muted">{allergy.notes}</p> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(allergy.id)}
                disabled={deleting === allergy.id}
                className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-muted">
        El filtro funciona por palabras (por ejemplo, &quot;lácteos&quot;, &quot;nueces&quot; o &quot;mariscos&quot;) y no
        cubre todos los casos. Revisa siempre las etiquetas de los productos y consulta a tu médico.
      </p>
    </SectionCard>
  );
}