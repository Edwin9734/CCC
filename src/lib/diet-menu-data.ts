export type MealType = "desayuno" | "colacion" | "almuerzo" | "cena";

export interface MenuMeal {
  type: MealType;
  text: string;
  recipeId?: string;
  keywords: string[];
}

export interface MenuDay {
  key: string;
  label: string;
  short: string;
  meals: MenuMeal[];
}

export interface Recipe {
  id: string;
  name: string;
  time: string;
  servings: string;
  ingredients: string[];
  steps: string[];
  tip?: string;
  keywords: string[];
}

// Palabras (sin tildes y en minúscula) que sirven para detectar posibles alergias.
const K = {
  avena: ["avena", "gluten"],
  gluten: ["gluten", "trigo", "harina"],
  lacteo: ["lactosa", "lacteo", "leche", "yogur", "queso"],
  pescado: ["pescado", "salmon", "atun", "sardina"],
  nuez: ["nuez", "nueces", "almendra", "frutos secos", "fruto seco"],
  huevo: ["huevo"],
  pollo: ["pollo", "aves"],
  legumbre: ["frijol", "lenteja", "garbanzo", "legumbre"],
  aguacate: ["aguacate", "palta"],
  limon: ["limon", "citrico"],
  naranja: ["naranja", "citrico"],
  manzana: ["manzana"],
  pera: ["pera"],
  tomate: ["tomate"],
  maiz: ["maiz"],
  tevVerde: ["te verde", "cafeina"]
};

export const RECIPES: Recipe[] = [
  {
    id: "avena",
    name: "Avena con manzana y canela",
    time: "10 min",
    servings: "1 porción",
    ingredients: [
      "½ taza de avena en hojuelas",
      "1 taza de agua (o leche de soya sin azúcar)",
      "1 manzana en cubitos",
      "Canela al gusto",
      "1 cucharada de nueces picadas (opcional)"
    ],
    steps: [
      "Hierve el agua en una olla pequeña.",
      "Agrega la avena y cocina 5 minutos a fuego bajo, moviendo de vez en cuando.",
      "Añade la manzana y la canela, y cocina 2 minutos más.",
      "Sirve tibia y, si quieres, con las nueces por encima."
    ],
    tip: "No le agregues azúcar ni miel: la manzana ya aporta dulzor.",
    keywords: [...K.avena, ...K.manzana, ...K.nuez, "canela"]
  },
  {
    id: "pescado",
    name: "Pescado al horno con verduras",
    time: "35 min",
    servings: "2 porciones",
    ingredients: [
      "2 filetes de pescado (salmón o el que prefieras)",
      "1 calabacín en rodajas",
      "1 zanahoria en rodajas finas",
      "1 tomate en rodajas",
      "1 cucharada de aceite de oliva",
      "Jugo de ½ limón",
      "Ajo, orégano y pimienta al gusto, con muy poca sal"
    ],
    steps: [
      "Calienta el horno a 180 °C.",
      "Pon las verduras en una bandeja y úntalas con la mitad del aceite.",
      "Coloca encima los filetes con el limón, el ajo, el orégano y el resto del aceite.",
      "Hornea de 20 a 25 minutos, hasta que el pescado se desmenuce con un tenedor."
    ],
    tip: "Usa poca sal: el limón y las hierbas dan mucho sabor.",
    keywords: [...K.pescado, ...K.limon, ...K.tomate, "oliva", "aceituna", "calabacin", "zanahoria", "ajo"]
  },
  {
    id: "garbanzos",
    name: "Ensalada de garbanzos",
    time: "15 min",
    servings: "2 porciones",
    ingredients: [
      "1 taza de garbanzos cocidos y escurridos",
      "1 tomate picado",
      "½ pepino en cubos",
      "¼ de cebolla morada picada",
      "¼ de aguacate",
      "Jugo de 1 limón",
      "1 cucharadita de aceite de oliva",
      "Cilantro o perejil al gusto"
    ],
    steps: [
      "Mezcla los garbanzos, el tomate, el pepino y la cebolla en un recipiente.",
      "Mezcla el limón con el aceite y agrégalo a la ensalada.",
      "Añade el cilantro o el perejil y revuelve.",
      "Agrega el aguacate en cubos al final, para que no se deshaga."
    ],
    tip: "Si usas garbanzos de lata, enjuágalos antes para quitar el exceso de sal.",
    keywords: [...K.legumbre, ...K.tomate, ...K.aguacate, ...K.limon, "pepino", "cebolla", "oliva", "aceituna", "cilantro", "perejil"]
  },
  {
    id: "lentejas",
    name: "Lentejas guisadas con verduras",
    time: "40 min",
    servings: "4 porciones",
    ingredients: [
      "1 taza de lentejas",
      "4 tazas de agua",
      "1 zanahoria picada",
      "1 tomate picado",
      "¼ de cebolla picada",
      "1 diente de ajo",
      "1 cucharada de aceite de oliva",
      "1 hoja de laurel y muy poca sal"
    ],
    steps: [
      "Lava las lentejas y cuécelas en el agua con la hoja de laurel por 25 minutos.",
      "Aparte, sofríe en el aceite la cebolla, el ajo y el tomate por 5 minutos.",
      "Agrega ese sofrito y la zanahoria a las lentejas.",
      "Cocina 10 minutos más, hasta que todo esté suave, y sirve."
    ],
    tip: "Las lentejas no necesitan remojo. Acompáñalas con arroz integral o una tortilla de maíz.",
    keywords: [...K.legumbre, ...K.tomate, "zanahoria", "cebolla", "ajo", "oliva", "aceituna", "laurel"]
  },
  {
    id: "tostada",
    name: "Tostada integral con aguacate y tomate",
    time: "5 min",
    servings: "1 porción",
    ingredients: [
      "1 rebanada de pan integral",
      "¼ de aguacate maduro",
      "2 rodajas de tomate",
      "Unas gotas de limón",
      "Pimienta al gusto"
    ],
    steps: [
      "Tuesta el pan.",
      "Machaca el aguacate con unas gotas de limón y úntalo sobre el pan.",
      "Coloca el tomate encima y agrega pimienta."
    ],
    tip: "Puedes acompañarla con un huevo cocido, con moderación si tu LDL está alto.",
    keywords: [...K.gluten, ...K.aguacate, ...K.tomate, ...K.limon]
  },
  {
    id: "licuado-verde",
    name: "Licuado verde",
    time: "5 min",
    servings: "1 porción",
    ingredients: [
      "1 taza de agua",
      "1 puñado de espinaca",
      "½ pepino",
      "1 tallo de apio",
      "½ manzana verde",
      "Jugo de ½ limón"
    ],
    steps: [
      "Lava bien las verduras y la fruta.",
      "Licúa todo con el agua hasta que quede suave.",
      "Sirve de inmediato, sin azúcar."
    ],
    tip: "Si tomas warfarina o acenocumarol, consulta a tu médico antes de tomarlo seguido: la espinaca tiene vitamina K.",
    keywords: ["espinaca", "pepino", "apio", ...K.manzana, ...K.limon]
  }
];

const m = (type: MealType, text: string, keywords: string[] = [], recipeId?: string): MenuMeal => ({
  type,
  text,
  keywords,
  recipeId
});

export const MENU_DAYS: MenuDay[] = [
  {
    key: "lunes",
    label: "Lunes",
    short: "Lun",
    meals: [
      m("desayuno", "Avena con manzana y canela, y té verde sin azúcar.", K.tevVerde, "avena"),
      m("colacion", "1 naranja.", K.naranja),
      m("almuerzo", "Pescado al horno con verduras y 3 a 4 cucharadas de arroz integral.", ["arroz"], "pescado"),
      m("cena", "Ensalada de garbanzos y una tortilla de maíz.", K.maiz, "garbanzos")
    ]
  },
  {
    key: "martes",
    label: "Martes",
    short: "Mar",
    meals: [
      m("desayuno", "Tostada integral con aguacate y tomate, y agua o infusión sin azúcar.", [], "tostada"),
      m("colacion", "Un puñado pequeño de almendras (unas 10).", K.nuez),
      m("almuerzo", "Lentejas guisadas con verduras y una tortilla de maíz.", K.maiz, "lentejas"),
      m("cena", "Pollo sin piel a la plancha con ensalada de lechuga y pepino.", [...K.pollo, "lechuga", "pepino"])
    ]
  },
  {
    key: "miercoles",
    label: "Miércoles",
    short: "Mié",
    meals: [
      m("desayuno", "Frijoles cocidos con una tortilla de maíz y una pera.", [...K.legumbre, ...K.maiz, ...K.pera]),
      m("colacion", "Yogur descremado sin azúcar con manzana en cubos.", [...K.lacteo, ...K.manzana]),
      m("almuerzo", "Atún al natural con ensalada de tomate y pepino, y papa cocida.", [...K.pescado, ...K.tomate, "pepino", "papa"]),
      m("cena", "Sopa de verduras (zanahoria, güisquil y ejote) con un huevo cocido, con moderación.", [...K.huevo, "zanahoria", "guisquil", "ejote"])
    ]
  },
  {
    key: "jueves",
    label: "Jueves",
    short: "Jue",
    meals: [
      m("desayuno", "Avena con manzana y canela.", [], "avena"),
      m("colacion", "Zanahoria y pepino en tiras con limón.", [...K.limon, "zanahoria", "pepino"]),
      m("almuerzo", "Frijoles cocidos con arroz integral y verduras al vapor (brócoli y zanahoria).", [...K.legumbre, "arroz", "brocoli", "zanahoria"]),
      m("cena", "Crema de verduras (calabacín y zanahoria) con una rebanada de pan integral.", [...K.gluten, "calabacin", "zanahoria"])
    ]
  },
  {
    key: "viernes",
    label: "Viernes",
    short: "Vie",
    meals: [
      m("desayuno", "Licuado verde y una rebanada de pan integral.", K.gluten, "licuado-verde"),
      m("colacion", "1 pera.", K.pera),
      m("almuerzo", "Pescado a la plancha (salmón o el que prefieras) con brócoli y papa cocida.", [...K.pescado, "brocoli", "papa"]),
      m("cena", "Ensalada de garbanzos.", [], "garbanzos")
    ]
  },
  {
    key: "sabado",
    label: "Sábado",
    short: "Sáb",
    meals: [
      m("desayuno", "Tostada integral con aguacate y tomate.", [], "tostada"),
      m("colacion", "1 naranja.", K.naranja),
      m("almuerzo", "Lentejas guisadas con verduras y arroz integral.", ["arroz"], "lentejas"),
      m("cena", "Pollo sin piel hervido con verduras (zanahoria, ejote y güisquil).", [...K.pollo, "zanahoria", "ejote", "guisquil"])
    ]
  },
  {
    key: "domingo",
    label: "Domingo",
    short: "Dom",
    meals: [
      m("desayuno", "Avena con manzana y canela, con nueces picadas.", [], "avena"),
      m("colacion", "Un puñado pequeño de nueces.", K.nuez),
      m("almuerzo", "Pescado al horno con verduras.", [], "pescado"),
      m("cena", "Frijoles cocidos con aguacate y una tortilla de maíz.", [...K.legumbre, ...K.aguacate, ...K.maiz])
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