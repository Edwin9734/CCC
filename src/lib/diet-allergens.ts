import { DIET_ITEMS } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";

// Palabras (sin tildes y en minúscula) que, si aparecen en el nombre de una alergia,
// marcan ese alimento o bebida como "posible alergia". La clave es el id del alimento.
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  // Recomendados
  avena: ["avena", "gluten"],
  frijoles: ["frijol", "legumbre"],
  lentejas: ["lenteja", "legumbre"],
  salmon: ["pescado", "salmon"],
  sardina: ["pescado", "sardina"],
  aguacate: ["aguacate", "palta"],
  mani: ["mani", "cacahuate", "cacahuete"],
  almendras: ["almendra", "nuez", "nueces", "frutos secos", "fruto seco"],
  "aceite-oliva": ["oliva", "aceituna"],
  manzana: ["manzana"],
  naranja: ["naranja", "citrico"],
  pera: ["pera"],
  lechuga: ["lechuga"],
  ayote: ["ayote", "calabaza"],
  platano: ["platano", "banano", "guineo"],
  "pollo-sin-piel": ["pollo", "aves"],
  huevo: ["huevo"],
  leche: ["lactosa", "lacteo", "leche"],

  // A evitar
  salchicha: ["cerdo", "embutido", "salchicha"],
  tocino: ["cerdo", "embutido", "tocino"],
  jamon: ["cerdo", "embutido", "jamon"],
  chorizo: ["cerdo", "embutido", "chorizo"],
  higado: ["higado", "visceras", "menudencia"],
  rinon: ["rinon", "visceras", "menudencia"],
  menudencias: ["visceras", "menudencia"],
  margarina: ["margarina", "lacteo", "lactosa", "leche"],
  manteca: ["manteca", "cerdo"],
  crema: ["crema", "lacteo", "lactosa", "leche"],
  chicharron: ["cerdo", "chicharron"],
  reposteria: ["gluten", "trigo", "harina", "huevo", "lacteo", "lactosa", "leche"],
  galletas: ["gluten", "trigo", "harina", "huevo", "lacteo", "lactosa", "leche"],
  pasteles: ["gluten", "trigo", "harina", "huevo", "lacteo", "lactosa", "leche"],
  pupusas: ["pupusa", "maiz", "queso", "lacteo", "lactosa", "cerdo", "frijol", "chicharron"],
  helados: ["helado", "lacteo", "lactosa", "leche", "huevo"],
  camarones: ["marisco", "camaron", "crustaceo"],
  mariscos: ["marisco", "crustaceo", "molusco", "camaron"],
  "pan-blanco": ["gluten", "trigo", "harina"],
  "arroz-blanco": ["arroz"],

  // Bebidas
  "te-verde": ["te verde", "cafeina"],
  "licuado-verde": ["pepino", "apio", "espinaca", "lechuga"],
  "licuado-avena": ["avena", "gluten"],
  "jugo-tomate": ["tomate"],
  "jugo-naranja": ["naranja", "citrico"],
  "agua-jamaica": ["jamaica", "hibisco"],
  energeticas: ["cafeina", "taurina"],
  cerveza: ["cerveza", "gluten", "cebada"],
  frappes: ["cafe", "leche", "lactosa", "lacteo", "crema"],
  "cafe-crema": ["cafe", "leche", "lactosa", "lacteo", "crema"],
  "leche-entera": ["leche", "lactosa", "lacteo"],
  toronja: ["toronja", "pomelo", "citrico"],

  // Verduras, cereales y condimentos
  "arroz-integral": ["arroz"],
  "tortilla-maiz": ["maiz"],
  "pan-integral": ["gluten", "trigo", "harina"],
  papa: ["papa"],
  tomate: ["tomate"],
  pepino: ["pepino"],
  zanahoria: ["zanahoria"],
  guisquil: ["guisquil", "chayote"],
  ejote: ["ejote"],
  brocoli: ["brocoli"],
  cebolla: ["cebolla"],
  apio: ["apio"],
  espinaca: ["espinaca"],
  limon: ["limon", "citrico"],
  ajo: ["ajo"],
  cilantro: ["cilantro"],
  perejil: ["perejil"],
  canela: ["canela"],
  laurel: ["laurel"],
  oregano: ["oregano"],
  pimienta: ["pimienta"]
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Palabras clave de un alimento (las usan el menú de ejemplo y las recetas para detectar alergias).
export function getFoodKeywords(id: string): string[] {
  return ALLERGEN_KEYWORDS[id] ?? [];
}

// Devuelve, por cada alimento afectado, la lista de alergias que coinciden.
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