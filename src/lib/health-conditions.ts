export interface ConditionDef {
  key: string;
  label: string;
}

// Lista de enfermedades del panel. La "key" es estable (la usará la etapa 2 para el plan);
// el "label" es lo que se ve y lo que se guarda en medical_history.
export const CONDITIONS: ConditionDef[] = [
  { key: "diabetes", label: "Diabetes" },
  { key: "prediabetes", label: "Prediabetes" },
  { key: "hipertension", label: "Presión alta" },
  { key: "cardiopatia", label: "Enfermedad del corazón" },
  { key: "infarto", label: "Infarto previo" },
  { key: "insuficiencia_cardiaca", label: "Insuficiencia cardíaca" },
  { key: "arritmia", label: "Arritmia" },
  { key: "derrame", label: "Derrame o embolia cerebral" },
  { key: "renal", label: "Enfermedad renal crónica" },
  { key: "higado", label: "Enfermedad del hígado" },
  { key: "hipotiroidismo", label: "Hipotiroidismo" },
  { key: "hipertiroidismo", label: "Hipertiroidismo" },
  { key: "obesidad", label: "Obesidad" },
  { key: "colesterol_familiar", label: "Colesterol alto hereditario" },
  { key: "gota", label: "Gota o ácido úrico alto" },
  { key: "asma_epoc", label: "Asma o EPOC" },
  { key: "apnea", label: "Apnea del sueño" },
  { key: "artritis", label: "Artritis o artrosis" },
  { key: "osteoporosis", label: "Osteoporosis" },
  { key: "depresion_ansiedad", label: "Depresión o ansiedad" }
];

export const MAX_CUSTOM_CONDITIONS = 10;
export const MAX_CONDITION_LENGTH = 60;

export function cleanName(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Para comparar nombres sin importar mayúsculas, tildes ni espacios de más.
export function normalizeName(text: string): string {
  return cleanName(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const BY_NORMALIZED = new Map<string, ConditionDef>(
  CONDITIONS.map((condition) => [normalizeName(condition.label), condition] as [string, ConditionDef])
);

export function findCondition(name: string): ConditionDef | undefined {
  return BY_NORMALIZED.get(normalizeName(name));
}

// Separa los nombres guardados en: los de la lista (por clave) y los escritos a mano.
export function splitConditions(names: string[]): { checked: Record<string, boolean>; custom: string[] } {
  const checked: Record<string, boolean> = {};
  const custom: string[] = [];
  const seen = new Set<string>();

  for (const raw of names) {
    const name = cleanName(raw);
    if (!name) continue;

    const definition = findCondition(name);
    if (definition) {
      checked[definition.key] = true;
      continue;
    }

    const key = normalizeName(name);
    if (!seen.has(key)) {
      seen.add(key);
      custom.push(name);
    }
  }

  return { checked, custom };
}

// Junta las marcadas de la lista y las escritas a mano en una sola lista de nombres.
export function buildConditionNames(checked: Record<string, boolean>, custom: string[]): string[] {
  const fromList = CONDITIONS.filter((condition) => checked[condition.key]).map((condition) => condition.label);
  return [...fromList, ...custom];
}

export type AddCustomResult = { ok: true; list: string[] } | { ok: false; error: string };

// Valida y agrega una enfermedad escrita a mano. Si el texto está vacío no hace nada.
export function addCustomCondition(input: string, list: string[]): AddCustomResult {
  const name = cleanName(input);
  if (!name) return { ok: true, list };

  if (name.length > MAX_CONDITION_LENGTH) {
    return { ok: false, error: `Máximo ${MAX_CONDITION_LENGTH} caracteres.` };
  }
  if (findCondition(name)) {
    return { ok: false, error: "Esa enfermedad ya está en la lista: márcala con «Padece»." };
  }
  const key = normalizeName(name);
  if (list.some((item) => normalizeName(item) === key)) {
    return { ok: false, error: "Ya la agregaste." };
  }
  if (list.length >= MAX_CUSTOM_CONDITIONS) {
    return { ok: false, error: `Puedes agregar hasta ${MAX_CUSTOM_CONDITIONS} enfermedades.` };
  }

  return { ok: true, list: [...list, name] };
}