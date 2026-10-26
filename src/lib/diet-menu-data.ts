import { getFoodKeywords } from "@/lib/diet-allergens";

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

export interface Ingredient {
  text: string;
  foodId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  time: string;
  servings: string;
  ingredients: string[]; // solo el texto de cada ingrediente (se usa al imprimir)
  ingredientItems: Ingredient[]; // con el alimento asociado (se usa para mostrar su imagen)
  steps: string[];
  tip?: string;
  keywords: string[];
}

interface RecipeInput {
  id: string;
  name: string;
  time: string;
  servings: string;
  ingredients: Ingredient[];
  steps: string[];
  tip?: string;
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

const recipe = ({ ingredients, ...rest }: RecipeInput): Recipe => ({
  ...rest,
  ingredients: ingredients.map((item) => item.text),
  ingredientItems: ingredients,
  keywords: keywordsOf(ingredients.flatMap((item) => (item.foodId ? [item.foodId] : [])))
});

export const RECIPES: Recipe[] = [
  recipe({
    id: "avena",
    name: "Avena con manzana y canela",
    time: "10 min",
    servings: "1 porción",
    ingredients: [
      { text: "½ taza de avena en hojuelas", foodId: "avena" },
      { text: "1 taza de agua (o de leche descremada)", foodId: "agua" },
      { text: "1 manzana en cubitos", foodId: "manzana" },
      { text: "Canela al gusto", foodId: "canela" },
      { text: "1 cucharada de almendras picadas (opcional)", foodId: "almendras" }
    ],
    steps: [
      "Hierve el agua en una olla pequeña.",
      "Agrega la avena y cocina 5 minutos a fuego bajo, moviendo de vez en cuando.",
      "Añade la manzana y la canela, y cocina 2 minutos más.",
      "Sirve tibia y, si quieres, con las almendras por encima."
    ],
    tip: "No le agregues azúcar ni miel: la manzana ya aporta dulzor."
  }),
  recipe({
    id: "pescado",
    name: "Pescado al horno con verduras",
    time: "35 min",
    servings: "2 porciones",
    ingredients: [
      { text: "2 filetes de pescado (salmón o sardina)", foodId: "salmon" },
      { text: "Un trozo de ayote en rodajas", foodId: "ayote" },
      { text: "1 zanahoria en rodajas finas", foodId: "zanahoria" },
      { text: "1 tomate en rodajas", foodId: "tomate" },
      { text: "1 cucharada de aceite de oliva", foodId: "aceite-oliva" },
      { text: "Jugo de ½ limón", foodId: "limon" },
      { text: "1 diente de ajo picado", foodId: "ajo" },
      { text: "Orégano y pimienta al gusto, con muy poca sal", foodId: "oregano" }
    ],
    steps: [
      "Calienta el horno a 180 °C.",
      "Pon las verduras en una bandeja y úntalas con la mitad del aceite.",
      "Coloca encima los filetes con el limón, el ajo, el orégano y el resto del aceite.",
      "Hornea de 20 a 25 minutos, hasta que el pescado se desmenuce con un tenedor."
    ],
    tip: "Usa poca sal: el limón y las hierbas dan mucho sabor."
  }),
  recipe({
    id: "ensalada-frijoles",
    name: "Ensalada de frijoles",
    time: "15 min",
    servings: "2 porciones",
    ingredients: [
      { text: "1 taza de frijoles cocidos y escurridos", foodId: "frijoles" },
      { text: "1 tomate picado", foodId: "tomate" },
      { text: "½ pepino en cubos", foodId: "pepino" },
      { text: "¼ de cebolla picada", foodId: "cebolla" },
      { text: "¼ de aguacate", foodId: "aguacate" },
      { text: "Jugo de 1 limón", foodId: "limon" },
      { text: "1 cucharadita de aceite de oliva", foodId: "aceite-oliva" },
      { text: "Cilantro al gusto", foodId: "cilantro" }
    ],
    steps: [
      "Mezcla los frijoles, el tomate, el pepino y la cebolla en un recipiente.",
      "Mezcla el limón con el aceite y agrégalo a la ensalada.",
      "Añade el cilantro y revuelve.",
      "Agrega el aguacate en cubos al final, para que no se deshaga."
    ],
    tip: "Usa frijoles cocidos en casa, sin manteca. Si usas frijoles de lata, enjuágalos antes para quitar el exceso de sal."
  }),
  recipe({
    id: "lentejas",
    name: "Lentejas guisadas con verduras",
    time: "40 min",
    servings: "4 porciones",
    ingredients: [
      { text: "1 taza de lentejas", foodId: "lentejas" },
      { text: "4 tazas de agua", foodId: "agua" },
      { text: "1 zanahoria picada", foodId: "zanahoria" },
      { text: "1 tomate picado", foodId: "tomate" },
      { text: "¼ de cebolla picada", foodId: "cebolla" },
      { text: "1 diente de ajo", foodId: "ajo" },
      { text: "1 cucharada de aceite de oliva", foodId: "aceite-oliva" },
      { text: "1 hoja de laurel y muy poca sal", foodId: "laurel" }
    ],
    steps: [
      "Lava las lentejas y cuécelas en el agua con la hoja de laurel por 25 minutos.",
      "Aparte, sofríe en el aceite la cebolla, el ajo y el tomate por 5 minutos.",
      "Agrega ese sofrito y la zanahoria a las lentejas.",
      "Cocina 10 minutos más, hasta que todo esté suave, y sirve."
    ],
    tip: "Las lentejas no necesitan remojo. Acompáñalas con arroz integral o una tortilla de maíz."
  }),
  recipe({
    id: "tostada",
    name: "Tostada integral con aguacate y tomate",
    time: "5 min",
    servings: "1 porción",
    ingredients: [
      { text: "1 rebanada de pan integral", foodId: "pan-integral" },
      { text: "¼ de aguacate maduro", foodId: "aguacate" },
      { text: "2 rodajas de tomate", foodId: "tomate" },
      { text: "Unas gotas de limón", foodId: "limon" },
      { text: "Pimienta al gusto", foodId: "pimienta" }
    ],
    steps: [
      "Tuesta el pan.",
      "Machaca el aguacate con unas gotas de limón y úntalo sobre el pan.",
      "Coloca el tomate encima y agrega pimienta."
    ],
    tip: "Puedes acompañarla con un huevo cocido, con moderación si tu LDL está alto."
  }),
  recipe({
    id: "licuado-verde",
    name: "Licuado verde",
    time: "5 min",
    servings: "1 porción",
    ingredients: [
      { text: "1 taza de agua", foodId: "agua" },
      { text: "1 puñado de espinaca", foodId: "espinaca" },
      { text: "½ pepino", foodId: "pepino" },
      { text: "1 tallo de apio", foodId: "apio" },
      { text: "½ manzana verde", foodId: "manzana" },
      { text: "Jugo de ½ limón", foodId: "limon" }
    ],
    steps: [
      "Lava bien las verduras y la fruta.",
      "Licúa todo con el agua hasta que quede suave.",
      "Sirve de inmediato, sin azúcar."
    ],
    tip: "Si tomas warfarina o acenocumarol, consulta a tu médico antes de tomarlo seguido: la espinaca tiene vitamina K."
  }),
  recipe({
    id: "platano",
    name: "Plátano al horno con canela",
    time: "25 min",
    servings: "1 porción",
    ingredients: [
      { text: "1 plátano maduro", foodId: "platano" },
      { text: "Canela al gusto", foodId: "canela" },
      { text: "Unas gotas de limón (opcional)", foodId: "limon" }
    ],
    steps: [
      "Calienta el horno a 180 °C.",
      "Pela el plátano y córtalo por la mitad a lo largo.",
      "Colócalo en una bandeja y hornéalo de 15 a 20 minutos, hasta que esté suave y dorado.",
      "Espolvorea la canela y sirve tibio."
    ],
    tip: "No necesita azúcar ni aceite: el plátano maduro ya es dulce. No lo frías."
  })
];

export const MENU_DAYS: MenuDay[] = [
  {
    key: "lunes",
    label: "Lunes",
    short: "Lun",
    meals: [
      meal("desayuno", "Avena con manzana y canela, y té verde sin azúcar.", ["avena", "manzana", "canela", "te-verde"], "avena"),
      meal("colacion", "1 naranja.", ["naranja"]),
      meal(
        "almuerzo",
        "Pescado al horno con verduras y 3 a 4 cucharadas de arroz integral.",
        ["salmon", "ayote", "zanahoria", "tomate", "arroz-integral"],
        "pescado"
      ),
      meal(
        "cena",
        "Ensalada de frijoles y una tortilla de maíz.",
        ["frijoles", "tomate", "pepino", "aguacate", "tortilla-maiz"],
        "ensalada-frijoles"
      )
    ]
  },
  {
    key: "martes",
    label: "Martes",
    short: "Mar",
    meals: [
      meal("desayuno", "Tostada integral con aguacate y tomate, y agua o infusión sin azúcar.", ["pan-integral", "aguacate", "tomate", "agua"], "tostada"),
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
      meal("desayuno", "Avena con manzana y canela.", ["avena", "manzana", "canela"], "avena"),
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
      meal("cena", "Ensalada de frijoles.", ["frijoles", "tomate", "pepino", "aguacate"], "ensalada-frijoles")
    ]
  },
  {
    key: "sabado",
    label: "Sábado",
    short: "Sáb",
    meals: [
      meal("desayuno", "Tostada integral con aguacate y tomate.", ["pan-integral", "aguacate", "tomate"], "tostada"),
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
        "Avena con manzana y canela, con almendras picadas.",
        ["avena", "manzana", "canela", "almendras"],
        "avena"
      ),
      meal("colacion", "Un puñado pequeño de maní, sin sal.", ["mani"]),
      meal("almuerzo", "Pescado al horno con verduras.", ["salmon", "ayote", "zanahoria", "tomate"], "pescado"),
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