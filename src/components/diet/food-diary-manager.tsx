"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Apple, Moon, Plus, Search, ShieldAlert, Sunrise, Trash2, Utensils } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { FoodImage } from "@/components/diet/food-image";
import { SectionTabs } from "@/components/shell/section-tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  type DiaryMealType,
  type FoodDiaryRow
} from "@/lib/supabase/food-diary";
import { DIET_ITEMS, type TrafficLight } from "@/lib/diet-data";
import { DIARY_TABS } from "@/lib/section-tabs";

const MEALS: { key: DiaryMealType; label: string; icon: typeof Apple }[] = [
  { key: "desayuno", label: "Desayuno", icon: Sunrise },
  { key: "colacion", label: "Colación", icon: Apple },
  { key: "almuerzo", label: "Almuerzo", icon: Utensils },
  { key: "cena", label: "Cena", icon: Moon }
];

const MEAL_BY_KEY = new Map(MEALS.map((meal) => [meal.key, meal]));

const MEAL_ORDER: Record<DiaryMealType, number> = { desayuno: 0, colacion: 1, almuerzo: 2, cena: 3 };

const ITEM_BY_ID = new Map(DIET_ITEMS.map((item) => [item.id, item]));

const LIGHT_DOT: Record<TrafficLight, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500"
};

const pad = (n: number) => String(n).padStart(2, "0");

function localDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayHeading(value: string) {
  const text = parseLocalDate(value).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sortEntries(list: FoodDiaryRow[]) {
  return [...list].sort((a, b) =>
    a.eaten_on === b.eaten_on ? b.created_at.localeCompare(a.created_at) : b.eaten_on.localeCompare(a.eaten_on)
  );
}

export function FoodDiaryManager({
  initialEntries,
  allergyMatches,
  initialTab
}: {
  initialEntries: FoodDiaryRow[];
  allergyMatches: Record<string, string[]>;
  initialTab: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<FoodDiaryRow[]>(initialEntries);
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [mealType, setMealType] = useState<DiaryMealType>("desayuno");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [visibleDays, setVisibleDays] = useState(7);
  const [isPending, startTransition] = useTransition();

  // La fecha de hoy se calcula en el navegador, para usar la hora local de la persona.
  useEffect(() => {
    const current = localDateString(new Date());
    setToday(current);
    setDate(current);
  }, []);

  const filteredItems = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return DIET_ITEMS;
    return DIET_ITEMS.filter((item) => normalize(item.name).includes(q));
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, FoodDiaryRow[]>();
    for (const entry of sortEntries(entries)) {
      const list = map.get(entry.eaten_on) ?? [];
      list.push(entry);
      map.set(entry.eaten_on, list);
    }
    return Array.from(map.entries()).map(([day, list]) => ({
      date: day,
      entries: [...list].sort(
        (a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type] || a.created_at.localeCompare(b.created_at)
      )
    }));
  }, [entries]);

  const week = useMemo(() => {
    if (!today) return null;

    const base = parseLocalDate(today);
    const days = new Set<string>();
    for (let i = 0; i < 7; i++) {
      days.add(localDateString(new Date(base.getFullYear(), base.getMonth(), base.getDate() - i)));
    }

    const inWeek = entries.filter((entry) => days.has(entry.eaten_on));
    const counts = { green: 0, yellow: 0, red: 0 };
    const redCount = new Map<string, number>();
    const daysWithRecords = new Set<string>();

    for (const entry of inWeek) {
      daysWithRecords.add(entry.eaten_on);
      for (const id of entry.food_ids) {
        const item = ITEM_BY_ID.get(id);
        if (!item) continue;
        counts[item.level] += 1;
        if (item.level === "red") redCount.set(id, (redCount.get(id) ?? 0) + 1);
      }
    }

    const topRed = Array.from(redCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, times]) => ({ name: ITEM_BY_ID.get(id)?.name ?? id, times }));

    return {
      counts,
      total: counts.green + counts.yellow + counts.red,
      topRed,
      daysWithRecords: daysWithRecords.size,
      entriesCount: inWeek.length
    };
  }, [entries, today]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!date) {
      setError("Elige la fecha.");
      return;
    }

    if (selectedIds.length === 0 && !notes.trim()) {
      setError("Marca al menos un alimento o escribe una nota.");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createDiaryEntry(supabase, {
          eaten_on: date,
          meal_type: mealType,
          food_ids: selectedIds,
          notes
        });
        setEntries((prev) => sortEntries([created, ...prev]));
        setSelectedIds([]);
        setNotes("");
        setQuery("");
        setMessage("Comida registrada.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    setMessage(null);
    try {
      await deleteDiaryEntry(supabase, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  const weekMessage = () => {
    if (!week || week.entriesCount === 0) {
      return "Aún no registras comidas en los últimos 7 días.";
    }
    if (week.total === 0) {
      return "Registraste comidas solo con notas, así que no hay alimentos de la guía para contar.";
    }
    if (week.counts.red === 0) {
      return "Esta semana no registraste alimentos marcados en rojo. ¡Sigue así!";
    }
    if (week.counts.red > week.counts.green) {
      return "Registraste más alimentos en rojo que en verde. Prueba cambiar alguno por una opción verde de la guía.";
    }
    return "Vas bien. Intenta que cada semana predominen más los alimentos verdes.";
  };

  const formCard = (
    <SectionCard
      title="Registrar una comida"
      description="Marca lo que comiste. Puedes elegir de la guía, escribir una nota, o las dos cosas."
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Fecha</span>
          <input
            type="date"
            value={date}
            max={today || undefined}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
            required
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Comida</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEALS.map((meal) => {
              const Icon = meal.icon;
              const active = mealType === meal.key;
              return (
                <button
                  key={meal.key}
                  type="button"
                  onClick={() => setMealType(meal.key)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                    active
                      ? "border-accent bg-accent text-white shadow-soft"
                      : "border-black/10 bg-white text-ink hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {meal.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Alimentos y bebidas de la guía</span>
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (ej. avena, gaseosa)"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-black/10 bg-white p-3">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted">No encontramos resultados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredItems.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  const flagged = Boolean(allergyMatches[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-semibold transition ${
                        selected
                          ? "border-accent bg-accent text-white"
                          : flagged
                            ? "border-rose-300 bg-rose-50 text-rose-900"
                            : "border-black/10 bg-white text-ink hover:bg-slate-50"
                      }`}
                    >
                      <FoodImage
                        id={item.id}
                        size={28}
                        rounded="rounded-full"
                        className={selected ? "bg-white" : "bg-slate-50"}
                      />
                      {item.name}
                      {flagged ? (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${LIGHT_DOT[item.level]}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted">
            Seleccionados: {selectedIds.length}. El punto de color indica el semáforo de la guía; el icono rojo marca
            una posible alergia.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Nota (opcional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Sopa de verduras en casa de mi hija"
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}
        {message ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-success">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Guardando..." : "Guardar comida"}
        </button>
      </form>
    </SectionCard>
  );

  const listCard = (
    <SectionCard title="Mi diario" description="Lo que has registrado, de lo más reciente a lo más antiguo.">
      {groups.length === 0 ? (
        <p className="text-sm text-muted">Aún no has registrado comidas.</p>
      ) : (
        <div className="space-y-6">
          {groups.slice(0, visibleDays).map((group) => (
            <div key={group.date}>
              <h3 className="text-base font-semibold text-ink">{formatDayHeading(group.date)}</h3>
              <div className="mt-2 space-y-3">
                {group.entries.map((entry) => {
                  const meal = MEAL_BY_KEY.get(entry.meal_type);
                  const Icon = meal?.icon ?? Utensils;
                  const items = entry.food_ids.flatMap((id) => {
                    const item = ITEM_BY_ID.get(id);
                    return item ? [item] : [];
                  });
                  const flaggedAllergies = Array.from(
                    new Set(entry.food_ids.flatMap((id) => allergyMatches[id] ?? []))
                  );

                  return (
                    <article key={entry.id} className="rounded-3xl border border-black/5 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                          <Icon className="h-4 w-4" />
                          {meal?.label ?? entry.meal_type}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          aria-label="Eliminar registro"
                          className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {items.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span
                              key={item.id}
                              className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1 pl-1 pr-3 text-sm text-ink"
                            >
                              <FoodImage id={item.id} size={24} rounded="rounded-full" className="bg-slate-50" />
                              {item.name}
                              <span className={`h-2.5 w-2.5 rounded-full ${LIGHT_DOT[item.level]}`} />
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {entry.notes ? <p className="mt-2 text-sm leading-6 text-muted">{entry.notes}</p> : null}

                      {flaggedAllergies.length > 0 ? (
                        <p className="mt-2 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
                          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                          Posible alergia: {flaggedAllergies.join(", ")}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length > visibleDays ? (
            <button
              type="button"
              onClick={() => setVisibleDays((v) => v + 7)}
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              Mostrar días anteriores
            </button>
          ) : null}
        </div>
      )}
    </SectionCard>
  );

  const weekCard = week ? (
    <SectionCard title="Resumen de la semana" description="Tus últimos 7 días, contando lo que marcaste de la guía.">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Verdes</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{week.counts.green}</p>
          <p className="text-xs text-emerald-900">Consumir con frecuencia</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Amarillos</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{week.counts.yellow}</p>
          <p className="text-xs text-amber-900">Con moderación</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-900">Rojos</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{week.counts.red}</p>
          <p className="text-xs text-rose-900">Evitar</p>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">Días con registro: {week.daysWithRecords} de 7</p>
      <p className="mt-1 text-base leading-7 text-ink">{weekMessage()}</p>

      {week.topRed.length > 0 ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          <span className="font-semibold text-ink">Lo que más se repitió en rojo: </span>
          {week.topRed.map((item) => `${item.name} (${item.times})`).join(", ")}.
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-muted">
        Es un resumen orientativo: no cuenta las notas libres ni las porciones, y no reemplaza la indicación de tu
        médico o nutricionista.
      </p>
    </SectionCard>
  ) : (
    <p className="text-center text-sm text-muted">Cargando tu resumen...</p>
  );

  return (
    <SectionTabs
      tabs={DIARY_TABS}
      initialTab={initialTab}
      panels={{
        diario: (
          <>
            {formCard}
            {listCard}
          </>
        ),
        semana: weekCard
      }}
    />
  );
}