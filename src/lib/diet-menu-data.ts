import { getFoodKeywords } from "@/lib/diet-allergens";

export { RECIPES, type Recipe, type Ingredient } from "@/lib/recipes-data";

export type MealType = "desayuno" | "colacion" | "almuerzo" | "cena";

export interface MenuMeal {
  type: MealType;
  text: string;
  foodIds: string[]; // alimentos del plato (ids de diet-data.ts), para mostrar sus imágenes
  keywords: string[];
  recipeId?: string;
}

export interface MenuDay {
  key: string;
  label: string;
  short: string;
  meals: MenuMeal[];
}

// Palabras para detectar posibles alergias: salen de los alimentos de cada plato o receta.
function keywordsOf(foodIds: string[]): string[] {
  return Array.from(new Set(foodIds.flatMap((id) => getFoodKeywords(id))));
}

const meal = (type: MealType, text: string, foodIds: string[], recipeId?: string): MenuMeal => ({
  type,
  text,
  foodIds,
  recipeId,
  keywords: keywordsOf(foodIds)
});

export const MENU_DAYS: MenuDay[] = [
  {
    key: "lunes",
    label: "Lunes",
    short: "Lun",
    meals: [
      meal("desayuno", "Mosh de avena con manzana, y té verde sin azúcar.", ["avena", "manzana", "canela", "te-verde"], "mosh"),
      meal("colacion", "1 naranja.", ["naranja"]),
      meal(
        "almuerzo",
        "Mojarra al horno con limón y 3 a 4 cucharadas de arroz integral.",
        ["guisquil", "zanahoria", "tomate", "limon", "arroz-integral"],
        "mojarra"
      ),
      meal(
        "cena",
        "Frijoles parados con chirmol y una tortilla de maíz.",
        ["frijoles", "tomate", "cilantro", "tortilla-maiz"],
        "frijoles-parados"
      )
    ]
  },
  {
    key: "martes",
    label: "Martes",
    short: "Mar",
    meals: [
      meal("desayuno", "Tostadas con frijol y aguacate, y agua o infusión sin azúcar.", ["frijoles", "aguacate", "agua"], "tostada-aguacate"),
      meal("colacion", "Un puñado pequeño de almendras (unas 10).", ["almendras"]),
      meal(
        "almuerzo",
        "Lentejas guisadas con verduras y una tortilla de maíz.",
        ["lentejas", "zanahoria", "tomate", "cebolla", "tortilla-maiz"],
        "lentejas"
      ),
      meal("cena", "Pollo sin piel a la plancha con ensalada de lechuga y pepino.", ["pollo-sin-piel", "lechuga", "pepino"])
    ]
  },
  {
    key: "miercoles",
    label: "Miércoles",
    short: "Mié",
    meals: [
      meal("desayuno", "Frijoles cocidos con una tortilla de maíz y una pera.", ["frijoles", "tortilla-maiz", "pera"]),
      meal("colacion", "Un vaso de leche descremada con una manzana.", ["leche", "manzana"]),
      meal(
        "almuerzo",
        "Sardinas al horno con ensalada de tomate y pepino, y papa cocida.",
        ["sardina", "tomate", "pepino", "papa"]
      ),
      meal(
        "cena",
        "Sopa de verduras (zanahoria, güisquil y ejote) con un huevo cocido, con moderación.",
        ["zanahoria", "guisquil", "ejote", "huevo"]
      )
    ]
  },
  {
    key: "jueves",
    label: "Jueves",
    short: "Jue",
    meals: [
      meal("desayuno", "Mosh de avena con manzana.", ["avena", "manzana", "canela"], "mosh"),
      meal("colacion", "Zanahoria y pepino en tiras con limón.", ["zanahoria", "pepino", "limon"]),
      meal(
        "almuerzo",
        "Frijoles cocidos con arroz integral y verduras al vapor (brócoli y zanahoria).",
        ["frijoles", "arroz-integral", "brocoli", "zanahoria"]
      ),
      meal(
        "cena",
        "Crema de verduras (ayote y zanahoria) con una rebanada de pan integral.",
        ["ayote", "zanahoria", "pan-integral"]
      )
    ]
  },
  {
    key: "viernes",
    label: "Viernes",
    short: "Vie",
    meals: [
      meal("desayuno", "Licuado verde y una rebanada de pan integral.", ["licuado-verde", "pan-integral"], "licuado-verde"),
      meal("colacion", "1 plátano pequeño, hervido o al horno, sin freír.", ["platano", "canela"], "platano"),
      meal("almuerzo", "Salmón a la plancha con brócoli y papa cocida.", ["salmon", "brocoli", "papa"]),
      meal("cena", "Frijoles parados con chirmol.", ["frijoles", "tomate", "cilantro"], "frijoles-parados")
    ]
  },
  {
    key: "sabado",
    label: "Sábado",
    short: "Sáb",
    meals: [
      meal("desayuno", "Tostadas con frijol y aguacate.", ["frijoles", "aguacate"], "tostada-aguacate"),
      meal("colacion", "1 naranja.", ["naranja"]),
      meal(
        "almuerzo",
        "Lentejas guisadas con verduras y arroz integral.",
        ["lentejas", "zanahoria", "tomate", "arroz-integral"],
        "lentejas"
      ),
      meal(
        "cena",
        "Pollo sin piel hervido con verduras (zanahoria, ejote y güisquil).",
        ["pollo-sin-piel", "zanahoria", "ejote", "guisquil"]
      )
    ]
  },
  {
    key: "domingo",
    label: "Domingo",
    short: "Dom",
    meals: [
      meal(
        "desayuno",
        "Mosh de avena con manzana, con almendras picadas.",
        ["avena", "manzana", "canela", "almendras"],
        "mosh"
      ),
      meal("colacion", "Un puñado pequeño de maní, sin sal.", ["mani"]),
      meal("almuerzo", "Mojarra al horno con limón.", ["guisquil", "zanahoria", "tomate", "limon"], "mojarra"),
      meal("cena", "Frijoles cocidos con aguacate y una tortilla de maíz.", ["frijoles", "aguacate", "tortilla-maiz"])
    ]
  }
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Devuelve las alergias registradas que coinciden con alguna de las palabras clave.
export function getAllergyMatches(allergyNames: string[], keywords: string[]): string[] {
  return allergyNames
    .map((name) => ({ original: name, norm: normalize(name) }))
    .filter((a) => a.norm.length >= 3 && keywords.some((k) => a.norm.includes(k)))
    .map((a) => a.original);
}