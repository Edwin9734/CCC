import { DIET_ITEMS } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";

// Palabras (sin tildes y en minúscula) que, si aparecen en el nombre de una alergia,
// marcan ese alimento o bebida como "posible alergia".
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  avena: ["avena", "gluten"],
  legumbres: ["frijol", "lenteja", "garbanzo", "legumbre"],
  "pescados-grasos": ["pescado", "salmon", "sardina", "atun"],
  aguacate: ["aguacate", "palta"],
  nueces: ["nuez", "nueces", "almendra", "frutos secos", "fruto seco"],
  "aceite-oliva": ["oliva", "aceituna"],
  "frutas-pectina": ["manzana", "naranja", "pera", "citrico"],
  verduras: ["espinaca", "berenjena", "okra", "acelga", "verdura"],
  soya: ["soya", "soja", "tofu"],
  "pollo-sin-piel": ["pollo", "aves"],
  huevo: ["huevo"],
  "lacteos-descremados": ["lactosa", "lacteo", "leche", "queso", "yogur"],
  embutidos: ["cerdo", "embutido", "salchicha", "jamon", "tocino", "chorizo"],
  visceras: ["higado", "visceras", "menudencia"],
  "mantequilla-manteca": ["mantequilla", "manteca", "crema", "lacteo", "lactosa", "leche"],
  "carnes-grasosas": ["cerdo", "carne", "chicharron"],
  reposteria: ["gluten", "trigo", "harina", "huevo", "lacteo", "lactosa", "leche"],
  helados: ["helado", "lacteo", "lactosa", "leche", "huevo"],
  "carne-roja-magra": ["carne roja", "carne de res", "ternera", "vacuno"],
  "quesos-maduros": ["queso", "lacteo", "lactosa", "leche"],
  mariscos: ["marisco", "camaron", "crustaceo", "molusco"],
  refinados: ["gluten", "trigo", "harina"],
  "te-verde": ["te verde", "cafeina"],
  "licuado-verde": ["pepino", "apio", "espinaca"],
  "licuado-avena": ["avena", "gluten"],
  "jugo-tomate": ["tomate"],
  "leche-vegetal": ["soya", "soja", "almendra", "nuez", "nueces", "frutos secos"],
  "jugo-naranja": ["naranja", "citrico"],
  "agua-jamaica": ["jamaica", "hibisco"],
  energeticas: ["cafeina", "taurina"],
  frappes: ["cafe", "leche", "lactosa", "lacteo", "crema"],
  "leche-entera": ["leche", "lactosa", "lacteo"],
  toronja: ["toronja", "pomelo", "citrico"]
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Devuelve, por cada alimento/bebida afectado, la lista de alergias que coinciden.
export function findAllergenMatches(allergyNames: string[]): Record<string, string[]> {
  const allergies = allergyNames
    .map((name) => ({ original: name, norm: normalize(name) }))
    .filter((a) => a.norm.length >= 3);

  const result: Record<string, string[]> = {};

  for (const item of DIET_ITEMS) {
    const keywords = ALLERGEN_KEYWORDS[item.id] ?? [];
    const matched = allergies
      .filter((a) => keywords.some((k) => a.norm.includes(k)))
      .map((a) => a.original);

    if (matched.length > 0) {
      result[item.id] = matched;
    }
  }

  return result;
}

// Quita de las sugerencias "Para ti" lo que el usuario no puede comer por alergia.
export function applyAllergyFilter(insights: DietInsights, blockedIds: Set<string>): DietInsights {
  const metricInsights = insights.metricInsights.map((insight) => ({
    ...insight,
    goodIds: insight.goodIds.filter((id) => !blockedIds.has(id))
  }));

  const focusIds = Array.from(new Set(metricInsights.flatMap((i) => [...i.goodIds, ...i.avoidIds])));

  return { ...insights, metricInsights, focusIds };
}