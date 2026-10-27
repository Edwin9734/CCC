export interface TabDef {
  key: string; // se usa en la dirección: ?tab=<key>
  label: string; // nombre corto que se ve en la barra
  icon: string; // archivo en public/tab-icons (sin .svg)
}

export const PLAN_TABS: TabDef[] = [
  { key: "metas", label: "Metas", icon: "metas" },
  { key: "ajuste", label: "Ajuste", icon: "ajuste" },
  { key: "dieta", label: "Dieta", icon: "dieta" },
  { key: "ejercicio", label: "Ejercicio", icon: "ejercicio" },
  { key: "consejos", label: "Consejos", icon: "consejos" }
];

export const DIET_TABS: TabDef[] = [
  { key: "alergias", label: "Alergias", icon: "alergias" },
  { key: "guia", label: "Guía", icon: "guia" },
  { key: "menu", label: "Menú", icon: "menu" },
  { key: "recetas", label: "Recetas", icon: "recetas" }
];

export const HABIT_TABS: TabDef[] = [
  { key: "medicamentos", label: "Medicamentos", icon: "medicamentos" },
  { key: "agua", label: "Agua y sueño", icon: "agua-sueno" },
  { key: "actividad", label: "Actividad", icon: "actividad" },
  { key: "semana", label: "Semana", icon: "semana" }
];

export const DIARY_TABS: TabDef[] = [
  { key: "diario", label: "Mi diario", icon: "diario" },
  { key: "semana", label: "Semana", icon: "semana" }
];

// Devuelve la pestaña pedida en la dirección, o la pestaña por defecto si no existe.
export function normalizeTab(value: string | string[] | undefined, tabs: TabDef[], fallback: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && tabs.some((tab) => tab.key === raw) ? raw : fallback;
}