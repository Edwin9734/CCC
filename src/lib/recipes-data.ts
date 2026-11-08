import { getFoodKeywords } from "@/lib/diet-allergens";

export type RecipeTag = "bajar" | "economica" | "saludable" | "refaccion" | "licuado" | "fresco" | "jugo";

export interface Ingredient {
  text: string;
  foodId?: string; // alimento de diet-data.ts, para mostrar su imagen
}

export interface Recipe {
  id: string;
  name: string;
  description: string; // se muestra debajo de la imagen de la receta
  tags: RecipeTag[];
  time: string;
  servings: string;
  ingredients: string[]; // solo el texto de cada ingrediente (se usa al imprimir)
  ingredientItems: Ingredient[];
  steps: string[];
  tip?: string;
  keywords: string[];
}

interface RecipeInput extends Omit<Recipe, "ingredients" | "ingredientItems" | "keywords"> {
  ingredients: (string | [string, string])[]; // "texto" o ["texto", idDelAlimento]
  allergens?: string[]; // palabras de alergia de ingredientes que no están en la guía
}

export const RECIPE_FILTERS: { key: RecipeTag | "todas"; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "bajar", label: "Bajar colesterol" },
  { key: "economica", label: "Económicas" },
  { key: "saludable", label: "Saludables" },
  { key: "refaccion", label: "Refacciones" },
  { key: "licuado", label: "Licuados" },
  { key: "fresco", label: "Frescos" },
  { key: "jugo", label: "Jugos" }
];

export const RECIPE_TAG_LABEL: Record<RecipeTag, string> = {
  bajar: "Ayuda con el colesterol",
  economica: "Económica",
  saludable: "Saludable",
  refaccion: "Refacción",
  licuado: "Licuado",
  fresco: "Fresco",
  jugo: "Jugo"
};

export const DRINK_TAGS: RecipeTag[] = ["licuado", "fresco", "jugo"];

const recipe = ({ ingredients, allergens = [], ...rest }: RecipeInput): Recipe => {
  const items: Ingredient[] = ingredients.map((item) =>
    typeof item === "string" ? { text: item } : { text: item[0], foodId: item[1] }
  );

  return {
    ...rest,
    ingredients: items.map((item) => item.text),
    ingredientItems: items,
    keywords: Array.from(
      new Set([...items.flatMap((item) => (item.foodId ? getFoodKeywords(item.foodId) : [])), ...allergens])
    )
  };
};

const NUT_SEEDS = ["semilla", "pepita", "pepitoria", "ajonjoli", "sesamo"];

export const RECIPES: Recipe[] = [
  // ---------------------------------------------------------------- PLATOS
  recipe({
    id: "mosh",
    name: "Mosh de avena con manzana",
    description: "Un desayuno calientito y rendidor. La fibra de la avena ayuda a reducir el colesterol malo.",
    tags: ["bajar", "economica"],
    time: "15 min",
    servings: "2 porciones",
    ingredients: [
      ["1 taza de avena en hojuelas", "avena"],
      ["3 tazas de agua", "agua"],
      ["1 manzana picada", "manzana"],
      ["1 raja de canela", "canela"],
      ["½ taza de leche descremada (opcional)", "leche"]
    ],
    steps: [
      "Hierve el agua con la raja de canela.",
      "Agrega la avena y cocina a fuego bajo por 8 minutos, moviendo de vez en cuando.",
      "Añade la manzana y cocina 3 minutos más.",
      "Si quieres, agrega la leche, retira la canela y sirve caliente."
    ],
    tip: "No le agregues azúcar: la manzana y la canela ya le dan sabor."
  }),
  recipe({
    id: "frijoles-parados",
    name: "Frijoles parados con chirmol",
    description: "Frijol negro sin manteca, con mucha fibra para cuidar tu colesterol y a bajo costo.",
    tags: ["bajar", "economica"],
    time: "1 h 30 min",
    servings: "6 porciones",
    ingredients: [
      ["1 libra de frijol negro", "frijoles"],
      ["8 tazas de agua", "agua"],
      ["½ cebolla", "cebolla"],
      ["2 dientes de ajo", "ajo"],
      ["3 tomates para el chirmol", "tomate"],
      ["Cilantro picado", "cilantro"],
      ["Jugo de 1 limón", "limon"],
      "Muy poca sal"
    ],
    steps: [
      "Limpia y lava los frijoles. Déjalos en remojo durante la noche y bota esa agua.",
      "Cuécelos en agua limpia con la cebolla y el ajo hasta que estén suaves, cerca de 1 hora y 15 minutos.",
      "Para el chirmol, asa los tomates en el comal, machácalos y mézclalos con cilantro y limón.",
      "Agrega muy poca sal a los frijoles y sírvelos con el chirmol encima."
    ],
    tip: "Se conservan 3 días en refrigeración. Evita la manteca y el frijol volteado frito."
  }),
  recipe({
    id: "lentejas",
    name: "Lentejas guisadas con verduras",
    description: "Plato rendidor, lleno de fibra y proteína vegetal, sin grasa de carne.",
    tags: ["bajar", "economica"],
    time: "40 min",
    servings: "4 porciones",
    ingredients: [
      ["1 taza de lentejas", "lentejas"],
      ["4 tazas de agua", "agua"],
      ["1 zanahoria picada", "zanahoria"],
      ["1 tomate picado", "tomate"],
      ["¼ de cebolla picada", "cebolla"],
      ["1 diente de ajo", "ajo"],
      ["1 cucharada de aceite de oliva", "aceite-oliva"],
      ["1 hoja de laurel", "laurel"],
      "Muy poca sal"
    ],
    steps: [
      "Lava las lentejas y cuécelas en el agua con el laurel por 25 minutos.",
      "Aparte, sofríe en el aceite la cebolla, el ajo y el tomate por 5 minutos.",
      "Agrega el sofrito y la zanahoria a las lentejas.",
      "Cocina 10 minutos más, hasta que todo esté suave."
    ],
    tip: "Las lentejas no necesitan remojo. Acompáñalas con una tortilla de maíz."
  }),
  recipe({
    id: "mojarra",
    name: "Mojarra al horno con limón",
    description: "Pescado sin freír, bajo en grasa saturada: una buena opción en lugar de carnes grasosas.",
    tags: ["bajar"],
    time: "35 min",
    servings: "2 porciones",
    ingredients: [
      "2 mojarras limpias, medianas",
      ["1 zanahoria en rodajas finas", "zanahoria"],
      ["1 güisquil en tiras", "guisquil"],
      ["1 tomate en rodajas", "tomate"],
      ["1 cucharada de aceite de oliva", "aceite-oliva"],
      ["Jugo de 1 limón", "limon"],
      ["2 dientes de ajo picados", "ajo"],
      ["Orégano al gusto", "oregano"],
      ["Pimienta al gusto", "pimienta"]
    ],
    steps: [
      "Calienta el horno a 180 °C.",
      "Pon las verduras en una bandeja y úntalas con la mitad del aceite.",
      "Unta las mojarras con limón, ajo, orégano, pimienta y el resto del aceite, y colócalas encima.",
      "Hornea de 25 a 30 minutos, hasta que el pescado se desprenda fácilmente."
    ],
    tip: "Puedes prepararla en papel aluminio sobre el comal si no tienes horno.",
    allergens: ["pescado", "mojarra"]
  }),
  recipe({
    id: "sardinas-tomate",
    name: "Sardinas guisadas con tomate",
    description: "Económicas y ricas en omega 3, una grasa buena que ayuda con los triglicéridos.",
    tags: ["bajar", "economica"],
    time: "15 min",
    servings: "2 porciones",
    ingredients: [
      ["1 lata de sardinas en agua o en tomate", "sardina"],
      ["2 tomates picados", "tomate"],
      ["¼ de cebolla en tiras", "cebolla"],
      ["1 cucharadita de aceite de oliva", "aceite-oliva"],
      ["Jugo de ½ limón", "limon"],
      ["Tortillas de maíz para acompañar", "tortilla-maiz"]
    ],
    steps: [
      "Escurre las sardinas. Si traen mucha salsa, enjuágalas para quitar sal.",
      "Sofríe la cebolla en el aceite y agrega el tomate. Cocina 5 minutos.",
      "Añade las sardinas con cuidado y calienta 3 minutos.",
      "Agrega el limón y sirve con tortilla de maíz."
    ],
    tip: "No le pongas sal: las sardinas de lata ya traen."
  }),
  recipe({
    id: "casamiento",
    name: "Casamiento de arroz integral y frijol",
    description: "La combinación de arroz y frijol, con más fibra gracias al arroz integral.",
    tags: ["bajar", "economica"],
    time: "20 min",
    servings: "4 porciones",
    ingredients: [
      ["2 tazas de arroz integral cocido", "arroz-integral"],
      ["2 tazas de frijol cocido y escurrido", "frijoles"],
      ["¼ de cebolla picada", "cebolla"],
      ["1 diente de ajo picado", "ajo"],
      ["1 cucharada de aceite de oliva", "aceite-oliva"],
      ["Cilantro picado", "cilantro"]
    ],
    steps: [
      "Sofríe la cebolla y el ajo en el aceite por 3 minutos.",
      "Agrega el frijol y deja calentar 3 minutos.",
      "Incorpora el arroz y mezcla con cuidado por 5 minutos.",
      "Termina con cilantro y sirve."
    ],
    tip: "Es una forma ideal de aprovechar el arroz y el frijol del día anterior."
  }),
  recipe({
    id: "caldo-pollo",
    name: "Caldo de pollo con verduras",
    description: "Reconfortante y ligero. Al quitar la piel del pollo se reduce mucho la grasa.",
    tags: ["saludable", "economica"],
    time: "50 min",
    servings: "4 porciones",
    ingredients: [
      ["4 piezas de pollo sin piel", "pollo-sin-piel"],
      ["8 tazas de agua", "agua"],
      ["2 güisquiles en trozos", "guisquil"],
      ["2 zanahorias en trozos", "zanahoria"],
      ["2 papas medianas en trozos", "papa"],
      ["1 taza de ejotes", "ejote"],
      ["½ cebolla", "cebolla"],
      ["2 dientes de ajo", "ajo"],
      ["Cilantro", "cilantro"],
      "Muy poca sal"
    ],
    steps: [
      "Cuece el pollo en el agua con la cebolla y el ajo por 25 minutos.",
      "Retira la espuma y la grasa que suba a la superficie.",
      "Agrega la zanahoria y la papa. Cocina 10 minutos.",
      "Añade el güisquil y los ejotes, y cocina 10 minutos más. Termina con cilantro."
    ],
    tip: "Evita los consomés en cubo: tienen mucha sal. El ajo y el cilantro dan buen sabor."
  }),
  recipe({
    id: "pepian-ligero",
    name: "Pepián de pollo ligero",
    description: "El sabor del pepián tradicional, con pollo sin piel y sin manteca.",
    tags: ["saludable"],
    time: "1 h 10 min",
    servings: "6 porciones",
    ingredients: [
      ["6 piezas de pollo sin piel", "pollo-sin-piel"],
      ["6 tomates", "tomate"],
      "4 miltomates",
      ["1 cebolla", "cebolla"],
      ["3 dientes de ajo", "ajo"],
      "2 cucharadas de pepitoria",
      "1 cucharada de ajonjolí",
      "1 chile guaque y 1 chile pasa, sin semillas",
      ["2 güisquiles en trozos", "guisquil"],
      ["2 papas en trozos", "papa"],
      ["1 raja de canela", "canela"]
    ],
    steps: [
      "Cuece el pollo con agua y un poco de cebolla por 25 minutos. Guarda el caldo.",
      "Tuesta en el comal, sin aceite, la pepitoria, el ajonjolí y los chiles.",
      "Asa los tomates, miltomates, cebolla y ajo. Licúa todo con la canela y un poco de caldo.",
      "Cocina el recado 10 minutos, agrega el pollo y las verduras, y deja 20 minutos a fuego bajo."
    ],
    tip: "Sirve una porción moderada de recado: la pepitoria es grasa buena, pero tiene muchas calorías.",
    allergens: NUT_SEEDS
  }),
  recipe({
    id: "jocon-ligero",
    name: "Jocón de pollo ligero",
    description: "Pollo en salsa verde de miltomate y cilantro, con mucho sabor y poca grasa.",
    tags: ["saludable"],
    time: "50 min",
    servings: "4 porciones",
    ingredients: [
      ["4 piezas de pollo sin piel", "pollo-sin-piel"],
      "1 libra de miltomate",
      "1 manojo de cebollín",
      ["1 manojo de cilantro", "cilantro"],
      ["2 dientes de ajo", "ajo"],
      "2 cucharadas de pepitoria",
      ["1 tortilla de maíz tostada, para espesar", "tortilla-maiz"]
    ],
    steps: [
      "Cuece el pollo con agua por 25 minutos y guarda una taza de caldo.",
      "Licúa el miltomate, el cebollín, el cilantro, el ajo, la pepitoria y la tortilla con el caldo.",
      "Cocina esa salsa 10 minutos, moviendo seguido.",
      "Agrega el pollo y deja 10 minutos a fuego bajo."
    ],
    tip: "Acompáñalo con arroz integral y una porción de verduras.",
    allergens: NUT_SEEDS
  }),
  recipe({
    id: "hilachas-pollo",
    name: "Hilachas de pollo",
    description: "Una versión más sana de las hilachas, con pechuga en lugar de carne de res.",
    tags: ["saludable"],
    time: "50 min",
    servings: "4 porciones",
    ingredients: [
      ["2 pechugas de pollo sin piel", "pollo-sin-piel"],
      ["5 tomates", "tomate"],
      "3 miltomates",
      ["2 papas en cubos", "papa"],
      ["2 zanahorias en cubos", "zanahoria"],
      "1 chile guaque sin semillas",
      ["1 tortilla de maíz, para espesar", "tortilla-maiz"],
      ["2 dientes de ajo", "ajo"]
    ],
    steps: [
      "Cuece el pollo por 25 minutos y deshébralo. Guarda el caldo.",
      "Asa los tomates, miltomates y el chile, y lícualos con ajo, tortilla y un poco de caldo.",
      "Cocina la salsa 10 minutos con la papa y la zanahoria.",
      "Agrega el pollo deshebrado y cocina 10 minutos más."
    ],
    tip: "Sírvelas con arroz integral. Queda bien con poca sal."
  }),
  recipe({
    id: "guisquil-guisado",
    name: "Güisquil guisado con tomate",
    description: "Acompañamiento sencillo y barato, bajo en grasa y con buena cantidad de agua y fibra.",
    tags: ["saludable", "economica"],
    time: "25 min",
    servings: "3 porciones",
    ingredients: [
      ["3 güisquiles en cubos", "guisquil"],
      ["2 tomates picados", "tomate"],
      ["¼ de cebolla picada", "cebolla"],
      ["1 cucharadita de aceite de oliva", "aceite-oliva"],
      ["Orégano al gusto", "oregano"],
      "Muy poca sal"
    ],
    steps: [
      "Cuece los güisquiles en agua por 10 minutos y escúrrelos.",
      "Sofríe la cebolla en el aceite y agrega el tomate. Cocina 5 minutos.",
      "Añade el güisquil y el orégano, y cocina 5 minutos más."
    ]
  }),
  recipe({
    id: "sopa-verduras",
    name: "Sopa de verduras",
    description: "Cena ligera con verduras de temporada, llena sin subir el colesterol.",
    tags: ["saludable", "economica"],
    time: "35 min",
    servings: "4 porciones",
    ingredients: [
      ["6 tazas de agua", "agua"],
      ["1 trozo de ayote en cubos", "ayote"],
      ["1 güisquil en cubos", "guisquil"],
      ["2 zanahorias en rodajas", "zanahoria"],
      ["1 taza de ejotes picados", "ejote"],
      ["1 taza de espinaca", "espinaca"],
      ["1 tomate picado", "tomate"],
      ["¼ de cebolla", "cebolla"],
      ["Cilantro", "cilantro"],
      "Muy poca sal"
    ],
    steps: [
      "Hierve el agua con el tomate y la cebolla por 5 minutos.",
      "Agrega la zanahoria y el ayote. Cocina 10 minutos.",
      "Añade el güisquil y los ejotes, y cocina 10 minutos más.",
      "Incorpora la espinaca y el cilantro 2 minutos antes de servir."
    ],
    tip: "Si tomas warfarina o acenocumarol, come la espinaca en cantidades constantes y avísale a tu médico."
  }),
  recipe({
    id: "tamalitos-chipilin",
    name: "Tamalitos de chipilín",
    description: "El sabor de siempre, preparado con aceite en lugar de manteca.",
    tags: ["saludable"],
    time: "1 h",
    servings: "8 tamalitos",
    ingredients: [
      "2 tazas de masa de maíz",
      "1 taza de hojas de chipilín",
      ["2 cucharadas de aceite de oliva", "aceite-oliva"],
      ["½ taza de agua tibia", "agua"],
      "Hojas de milpa o de plátano",
      "Muy poca sal"
    ],
    steps: [
      "Mezcla la masa con el aceite, el agua y una pizca de sal hasta que quede suave.",
      "Incorpora las hojas de chipilín bien lavadas.",
      "Envuelve porciones pequeñas en las hojas.",
      "Cocínalos al vapor por 40 minutos."
    ],
    tip: "Uno o dos tamalitos son una buena porción. Acompáñalos con chirmol."
  }),

  // ---------------------------------------------------------------- REFACCIONES
  recipe({
    id: "tostada-aguacate",
    name: "Tostadas con frijol y aguacate",
    description: "Una refacción sabrosa, con fibra y grasa buena. Usa tostadas sin freír.",
    tags: ["refaccion", "bajar", "economica"],
    time: "10 min",
    servings: "2 tostadas",
    ingredients: [
      "2 tostadas horneadas o de comal, sin freír",
      ["3 cucharadas de frijol colado sin manteca", "frijoles"],
      ["¼ de aguacate en láminas", "aguacate"],
      ["Unas gotas de limón", "limon"],
      ["Cilantro al gusto", "cilantro"]
    ],
    steps: [
      "Calienta el frijol y úntalo sobre las tostadas.",
      "Coloca el aguacate encima.",
      "Agrega limón y cilantro, y sirve de inmediato."
    ],
    tip: "Si compras tostadas fritas, revisa la etiqueta; las horneadas tienen mucha menos grasa."
  }),
  recipe({
    id: "tostada-guacamol",
    name: "Tostadas de guacamol",
    description: "El guacamol casero aporta grasas buenas que cuidan tu colesterol.",
    tags: ["refaccion", "bajar"],
    time: "10 min",
    servings: "4 tostadas",
    ingredients: [
      "4 tostadas horneadas o de comal, sin freír",
      ["1 aguacate maduro", "aguacate"],
      ["Jugo de 1 limón", "limon"],
      ["¼ de cebolla picada fina", "cebolla"],
      ["Cilantro picado", "cilantro"]
    ],
    steps: [
      "Machaca el aguacate con el limón.",
      "Mezcla la cebolla y el cilantro.",
      "Unta sobre las tostadas justo antes de comer."
    ],
    tip: "Medio aguacate al día es una porción razonable."
  }),
  recipe({
    id: "tostada-chirmol",
    name: "Tostadas con chirmol",
    description: "Ligeras, baratas y con todo el sabor del tomate asado.",
    tags: ["refaccion", "saludable", "economica"],
    time: "15 min",
    servings: "4 tostadas",
    ingredients: [
      "4 tostadas horneadas o de comal, sin freír",
      ["3 tomates", "tomate"],
      ["¼ de cebolla", "cebolla"],
      ["Cilantro picado", "cilantro"],
      ["Jugo de ½ limón", "limon"]
    ],
    steps: [
      "Asa los tomates y la cebolla en el comal.",
      "Machácalos en un molcajete o pícalos finamente.",
      "Agrega el cilantro y el limón, y sirve sobre las tostadas."
    ]
  }),
  recipe({
    id: "platano",
    name: "Plátano al horno con canela",
    description: "Postre natural sin azúcar ni aceite, en lugar del plátano frito.",
    tags: ["refaccion", "saludable", "economica"],
    time: "25 min",
    servings: "1 porción",
    ingredients: [
      ["1 plátano maduro", "platano"],
      ["Canela al gusto", "canela"]
    ],
    steps: [
      "Calienta el horno a 180 °C.",
      "Pela el plátano y córtalo por la mitad a lo largo.",
      "Hornea de 15 a 20 minutos, hasta que esté suave y dorado.",
      "Espolvorea la canela y sirve tibio."
    ],
    tip: "También se puede cocer en agua con canela si no tienes horno."
  }),
  recipe({
    id: "elote-limon",
    name: "Elote cocido con limón",
    description: "Refacción tradicional con fibra. Sin mantequilla ni mayonesa.",
    tags: ["refaccion", "saludable", "economica"],
    time: "30 min",
    servings: "2 porciones",
    ingredients: [
      "2 elotes tiernos",
      ["Agua para cocer", "agua"],
      ["Jugo de 1 limón", "limon"],
      "Una pizca de chile en polvo (opcional)"
    ],
    steps: [
      "Limpia los elotes y cuécelos en agua de 20 a 25 minutos.",
      "Escúrrelos y sírvelos calientes.",
      "Agrega limón y, si quieres, un poco de chile."
    ]
  }),
  recipe({
    id: "fruta-pepita",
    name: "Fruta picada con pepita",
    description: "Fruta fresca con semillas que aportan grasa buena y fibra.",
    tags: ["refaccion", "bajar"],
    time: "10 min",
    servings: "2 porciones",
    ingredients: [
      ["1 manzana picada", "manzana"],
      ["1 pera picada", "pera"],
      "1 taza de papaya picada",
      ["Jugo de ½ limón", "limon"],
      "1 cucharada de pepita de ayote sin sal"
    ],
    steps: [
      "Pica la fruta en cubos y colócala en un plato.",
      "Agrega el limón para que no se oscurezca.",
      "Espolvorea la pepita y sirve."
    ],
    tip: "Una porción al día es suficiente si tus triglicéridos están altos.",
    allergens: NUT_SEEDS
  }),
  recipe({
    id: "mani-tostado",
    name: "Maní tostado sin sal",
    description: "Un puñado pequeño aporta grasas buenas que ayudan a cuidar el corazón.",
    tags: ["refaccion", "bajar", "economica"],
    time: "15 min",
    servings: "4 porciones",
    ingredients: [
      ["1 taza de maní crudo", "mani"],
      ["Canela al gusto (opcional)", "canela"]
    ],
    steps: [
      "Tuesta el maní en un comal a fuego bajo, moviéndolo por 10 minutos.",
      "Déjalo enfriar y quítale la cáscara delgada si quieres.",
      "Guarda en un frasco y sirve un puñado pequeño."
    ],
    tip: "La porción es un puñado pequeño, unas 2 cucharadas. No le agregues sal ni azúcar."
  }),
  recipe({
    id: "pepino-zanahoria",
    name: "Pepino y zanahoria con limón",
    description: "Refacción fresca, crujiente y casi sin calorías.",
    tags: ["refaccion", "saludable", "economica"],
    time: "5 min",
    servings: "2 porciones",
    ingredients: [
      ["1 pepino en tiras", "pepino"],
      ["2 zanahorias en tiras", "zanahoria"],
      ["Jugo de 1 limón", "limon"],
      "Una pizca de pepita molida (opcional)"
    ],
    steps: ["Lava y corta las verduras en tiras.", "Agrega el limón y, si quieres, la pepita molida."],
    allergens: NUT_SEEDS
  }),

  // ---------------------------------------------------------------- LICUADOS
  recipe({
    id: "licuado-verde",
    name: "Licuado verde",
    description: "Verduras con manzana, con fibra y sin azúcar agregada.",
    tags: ["licuado", "saludable"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      ["1 taza de agua", "agua"],
      ["1 puñado de espinaca", "espinaca"],
      ["½ pepino", "pepino"],
      ["1 tallo de apio", "apio"],
      ["½ manzana verde", "manzana"],
      ["Jugo de ½ limón", "limon"]
    ],
    steps: ["Lava bien las verduras y la fruta.", "Licúa todo con el agua hasta que quede suave.", "Sirve sin colar y sin azúcar."],
    tip: "Si tomas warfarina o acenocumarol, consulta a tu médico antes de tomarlo seguido: la espinaca tiene vitamina K."
  }),
  recipe({
    id: "licuado-avena-manzana",
    name: "Licuado de avena y manzana",
    description: "La fibra de la avena y la manzana ayuda a reducir el colesterol malo.",
    tags: ["licuado", "bajar", "economica"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      ["3 cucharadas de avena en hojuelas", "avena"],
      ["1 manzana con cáscara", "manzana"],
      ["1 taza de agua o leche descremada", "leche"],
      ["Canela al gusto", "canela"]
    ],
    steps: ["Remoja la avena por 5 minutos en el líquido.", "Agrega la manzana en trozos y la canela.", "Licúa bien y sirve sin azúcar."]
  }),
  recipe({
    id: "licuado-papaya-avena",
    name: "Licuado de papaya con avena",
    description: "Suave y fácil de digerir, con la fibra que ayuda al colesterol.",
    tags: ["licuado", "bajar", "economica"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      "1 taza de papaya picada",
      ["3 cucharadas de avena en hojuelas", "avena"],
      ["1 taza de agua", "agua"],
      ["Jugo de ½ limón", "limon"]
    ],
    steps: ["Remoja la avena por 5 minutos en el agua.", "Agrega la papaya y el limón.", "Licúa y sirve sin colar."]
  }),
  recipe({
    id: "licuado-pera-chan",
    name: "Licuado de pera con chan",
    description: "El chan aporta fibra y omega 3 vegetal para cuidar tu corazón.",
    tags: ["licuado", "bajar"],
    time: "15 min",
    servings: "1 vaso",
    ingredients: [
      ["1 pera con cáscara", "pera"],
      "1 cucharada de semillas de chan (chía)",
      ["1 taza de agua", "agua"],
      ["Canela al gusto", "canela"]
    ],
    steps: ["Remoja el chan en el agua por 10 minutos.", "Licúa la pera con el agua y la canela.", "Agrega el chan remojado y mezcla."],
    allergens: ["semilla", "chia", "chan"]
  }),
  recipe({
    id: "licuado-banano-mani",
    name: "Licuado de banano, avena y maní",
    description: "Rinde como refacción completa. Con grasa buena del maní y fibra de la avena.",
    tags: ["licuado", "saludable"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      ["½ banano", "platano"],
      ["2 cucharadas de avena en hojuelas", "avena"],
      ["1 cucharada de maní sin sal", "mani"],
      ["1 taza de leche descremada o agua", "leche"]
    ],
    steps: ["Remoja la avena por 5 minutos en el líquido.", "Agrega el banano y el maní.", "Licúa hasta que quede suave."],
    tip: "Usa solo medio banano si tus triglicéridos están altos."
  }),

  // ---------------------------------------------------------------- FRESCOS
  recipe({
    id: "fresco-cebada",
    name: "Fresco de cebada",
    description: "Fresco tradicional. La cebada contiene fibra que ayuda con el colesterol.",
    tags: ["fresco", "bajar", "economica"],
    time: "40 min",
    servings: "6 vasos",
    ingredients: [
      "½ taza de cebada en grano",
      ["8 tazas de agua", "agua"],
      ["1 raja de canela", "canela"],
      ["Jugo de 1 limón", "limon"]
    ],
    steps: [
      "Lava la cebada y hiérvela en el agua con la canela por 30 minutos.",
      "Deja enfriar y licúa una parte si la quieres más espesa.",
      "Agrega el limón y sirve con hielo, sin azúcar."
    ],
    tip: "Contiene gluten. Refrigerado dura 2 días.",
    allergens: ["cebada", "gluten"]
  }),
  recipe({
    id: "fresco-avena",
    name: "Fresco de avena con canela",
    description: "Refrescante y sencillo, con la fibra soluble de la avena.",
    tags: ["fresco", "bajar", "economica"],
    time: "15 min",
    servings: "4 vasos",
    ingredients: [
      ["½ taza de avena en hojuelas", "avena"],
      ["5 tazas de agua", "agua"],
      ["1 raja de canela", "canela"]
    ],
    steps: ["Remoja la avena en el agua con la canela por 10 minutos.", "Retira la canela y licúa.", "Sirve frío, sin colar y sin azúcar."]
  }),
  recipe({
    id: "limonada-chan",
    name: "Limonada con chan",
    description: "Clásica limonada sin azúcar, con semillas llenas de fibra.",
    tags: ["fresco", "bajar", "economica"],
    time: "15 min",
    servings: "4 vasos",
    ingredients: [
      ["Jugo de 4 limones", "limon"],
      ["5 tazas de agua", "agua"],
      "2 cucharadas de semillas de chan (chía)"
    ],
    steps: ["Remoja el chan en el agua por 10 minutos, moviendo a veces.", "Agrega el jugo de limón.", "Sirve frío, sin azúcar."],
    allergens: ["semilla", "chia", "chan"]
  }),
  recipe({
    id: "fresco-jamaica",
    name: "Fresco de rosa de jamaica",
    description: "Sin azúcar, una opción mucho mejor que las gaseosas.",
    tags: ["fresco", "saludable", "economica"],
    time: "20 min",
    servings: "6 vasos",
    ingredients: [
      ["1 taza de flor de jamaica", "agua-jamaica"],
      ["8 tazas de agua", "agua"],
      ["1 raja de canela", "canela"]
    ],
    steps: [
      "Hierve la jamaica con la canela por 5 minutos en 3 tazas de agua.",
      "Deja reposar 10 minutos y cuela.",
      "Agrega el resto del agua y sirve frío."
    ],
    tip: "Puede bajar la presión. Si tomas medicina para la presión, pregunta a tu médico antes de tomarla."
  }),
  recipe({
    id: "fresco-pepino",
    name: "Fresco de pepino con limón",
    description: "Muy refrescante y sin azúcar, ideal para los días de calor.",
    tags: ["fresco", "saludable", "economica"],
    time: "5 min",
    servings: "4 vasos",
    ingredients: [
      ["2 pepinos", "pepino"],
      ["Jugo de 2 limones", "limon"],
      ["5 tazas de agua", "agua"]
    ],
    steps: ["Pela y licúa los pepinos con un poco de agua.", "Agrega el limón y el resto del agua.", "Sirve frío."]
  }),

  // ---------------------------------------------------------------- JUGOS
  recipe({
    id: "jugo-tomate",
    name: "Jugo de tomate natural",
    description: "Sin sal ni azúcar. Mucho más sano que los jugos industrializados.",
    tags: ["jugo", "saludable", "economica"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      ["3 tomates maduros", "tomate"],
      ["½ tallo de apio", "apio"],
      ["Unas gotas de limón", "limon"],
      ["Pimienta al gusto", "pimienta"]
    ],
    steps: ["Lava y parte los tomates y el apio.", "Licúa con un poco de agua.", "Agrega limón y pimienta, y sirve sin colar."]
  }),
  recipe({
    id: "jugo-zanahoria-naranja",
    name: "Jugo de zanahoria y naranja",
    description: "Más verdura que fruta, para disfrutarlo con menos azúcar natural.",
    tags: ["jugo", "saludable"],
    time: "5 min",
    servings: "1 vaso pequeño",
    ingredients: [
      ["2 zanahorias", "zanahoria"],
      ["Jugo de 1 naranja", "naranja"],
      ["½ taza de agua", "agua"]
    ],
    steps: ["Pica las zanahorias.", "Licúalas con el agua y el jugo de naranja.", "Sirve sin colar y sin azúcar."],
    tip: "Con los triglicéridos altos, toma solo un vaso pequeño: incluso el jugo natural tiene azúcar."
  }),
  recipe({
    id: "jugo-remolacha",
    name: "Jugo de remolacha y zanahoria",
    description: "Colorido y lleno de nutrientes, con la fibra de las verduras.",
    tags: ["jugo", "saludable", "economica"],
    time: "5 min",
    servings: "1 vaso pequeño",
    ingredients: [
      "½ remolacha cruda, pelada",
      ["1 zanahoria", "zanahoria"],
      ["Jugo de 1 limón", "limon"],
      ["1 taza de agua", "agua"]
    ],
    steps: ["Pica la remolacha y la zanahoria.", "Licúa con el agua y el limón.", "Sirve sin colar."]
  }),
  recipe({
    id: "jugo-apio-pepino",
    name: "Jugo de apio y pepino",
    description: "Ligero y refrescante, casi sin azúcar natural.",
    tags: ["jugo", "saludable", "economica"],
    time: "5 min",
    servings: "1 vaso",
    ingredients: [
      ["2 tallos de apio", "apio"],
      ["1 pepino", "pepino"],
      ["Jugo de 1 limón", "limon"],
      ["½ taza de agua", "agua"]
    ],
    steps: ["Lava y pica el apio y el pepino.", "Licúa con el agua y el limón.", "Sirve sin colar y sin azúcar."]
  })
];
