import { DIET_ITEMS, type DietItem } from "@/lib/diet-data";
import { findAllergenMatches, normalize } from "@/lib/diet-allergens";
import { getAllergyMatches } from "@/lib/diet-menu-data";
import { foodImageSrc, hasRecipePhoto, recipeImageSrc } from "@/lib/food-images";
import { RECIPES, type Recipe } from "@/lib/recipes-data";

export interface CommonAllergen {
  name: string;
  photoId: string;
  match: string[]; // palabras que indican que ya está registrada
}

export const COMMON_ALLERGENS: CommonAllergen[] = [
  { name: "Mariscos", photoId: "mariscos", match: ["marisco", "crustaceo"] },
  { name: "Pescado", photoId: "salmon", match: ["pescado"] },
  { name: "Maní", photoId: "mani", match: ["mani", "cacahuate", "cacahuete"] },
  { name: "Nueces", photoId: "almendras", match: ["nuez", "nueces", "frutos secos", "fruto seco"] },
  { name: "Lácteos", photoId: "leche", match: ["lacteo", "lactosa", "leche"] },
  { name: "Huevo", photoId: "huevo", match: ["huevo"] },
  { name: "Gluten", photoId: "pan-integral", match: ["gluten", "trigo"] },
  { name: "Cítricos", photoId: "naranja", match: ["citrico"] },
  { name: "Legumbres", photoId: "frijoles", match: ["legumbre"] },
  { name: "Cerdo", photoId: "tocino", match: ["cerdo"] },
  { name: "Maíz", photoId: "tortilla-maiz", match: ["maiz"] },
  { name: "Pollo", photoId: "pollo-sin-piel", match: ["pollo", "aves"] }
];

export const NOTE_CHIPS = ["Reacción fuerte", "Reacción leve", "Me da ronchas", "Intolerancia", "Confirmada por mi médico"];

export const WORD_SUGGESTIONS = "mariscos, pescado, maní, nueces, lácteos, huevo, gluten o el nombre del alimento";

export const ALLERGY_TIPS = [
  "Lee siempre la etiqueta completa, también en los productos que ya conoces: sus ingredientes pueden cambiar.",
  "Busca avisos como «puede contener» o «trazas de»: indican que pudo tener contacto con lo que te hace daño.",
  "Al comer fuera, di tu alergia antes de pedir y pregunta cómo preparan el platillo.",
  "En casa, lava bien tablas, cuchillos y sartenes para que no pasen restos de un alimento a otro.",
  "Si tu médico te recetó medicina para una reacción, llévala contigo y revisa su fecha de vencimiento.",
  "Cuéntale a tu familia qué alergias tienes y qué hacer si te sientes mal.",
  "Menciona tus alergias en cada consulta médica y en la farmacia."
];

export type ReactionLevel = "severe" | "mild";

export const REACTION_SIGNS: { label: string; level: ReactionLevel }[] = [
  { label: "Me cuesta respirar", level: "severe" },
  { label: "Se me hinchan los labios, la lengua o la garganta", level: "severe" },
  { label: "Siento que me voy a desmayar", level: "severe" },
  { label: "Vomito varias veces", level: "severe" },
  { label: "Ronchas o comezón", level: "mild" },
  { label: "Dolor de estómago", level: "mild" },
  { label: "Hormigueo en la boca", level: "mild" }
];

export function isCommonRegistered(common: CommonAllergen, names: string[]) {
  return names.some((name) => {
    const norm = normalize(name);
    return common.match.some((word) => norm.includes(word));
  });
}

export function affectedFoods(name: string): DietItem[] {
  const matches = findAllergenMatches([name]);
  return DIET_ITEMS.filter((item) => matches[item.id]);
}

export function affectedRecipes(name: string): Recipe[] {
  return RECIPES.filter((recipe) => getAllergyMatches([name], recipe.keywords).length > 0);
}

export function allergySummary(names: string[]) {
  return {
    foods: Object.keys(findAllergenMatches(names)).length,
    recipes: RECIPES.filter((recipe) => getAllergyMatches(names, recipe.keywords).length > 0).length
  };
}

export interface CheckResult {
  key: string;
  name: string;
  kind: "Alimento" | "Receta";
  image: string | null;
  allergies: string[];
}

// Busca un alimento o receta y dice si coincide con las alergias registradas.
export function checkFood(query: string, names: string[]): { direct: string[]; results: CheckResult[] } {
  const q = normalize(query);
  if (q.length < 2) return { direct: [], results: [] };

  const direct =
    q.length < 3
      ? []
      : names.filter((name) => {
          const norm = normalize(name);
          return norm.length >= 3 && (q.includes(norm) || norm.includes(q));
        });

  const foodMatches = findAllergenMatches(names);
  const foods: CheckResult[] = DIET_ITEMS.filter((item) => normalize(item.name).includes(q)).map((item) => ({
    key: `food-${item.id}`,
    name: item.name,
    kind: "Alimento",
    image: foodImageSrc(item.id),
    allergies: foodMatches[item.id] ?? []
  }));
  const recipes: CheckResult[] = RECIPES.filter((recipe) => normalize(recipe.name).includes(q)).map((recipe) => ({
    key: `recipe-${recipe.id}`,
    name: recipe.name,
    kind: "Receta",
    image: hasRecipePhoto(recipe.id) ? recipeImageSrc(recipe.id) : null,
    allergies: getAllergyMatches(names, recipe.keywords)
  }));

  const results = [...foods, ...recipes]
    .sort((a, b) => Number(b.allergies.length > 0) - Number(a.allergies.length > 0))
    .slice(0, 8);

  return { direct, results };
}
