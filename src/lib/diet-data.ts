export type DietCategory = "foods-good" | "foods-avoid" | "drinks-good" | "drinks-avoid" | "others";
export type TrafficLight = "green" | "yellow" | "red";

export interface DietItem {
  id: string;
  name: string;
  category: DietCategory;
  level: TrafficLight;
  why: string;
  portion: string;
  warning?: string;
}

export const TRAFFIC_LABEL: Record<TrafficLight, string> = {
  green: "Consumir con frecuencia",
  yellow: "Con moderación",
  red: "Evitar"
};

const ALCOHOL_WHY = "El alcohol en exceso sube los triglicéridos.";
const ALCOHOL_PORTION = "Evitar, o consultar a tu médico si se puede en pequeñas cantidades.";
const FLAVOR_PORTION = "Para sazonar, al gusto.";

export const DIET_ITEMS: DietItem[] = [
  // ---------------------------------------------------------------- ALIMENTOS RECOMENDADOS
  {
    id: "avena",
    name: "Avena",
    category: "foods-good",
    level: "green",
    why: "Contiene fibra soluble (betaglucanos) que ayuda a reducir el colesterol LDL.",
    portion: "1 taza cocida al día, sin azúcar añadida."
  },
  {
    id: "frijoles",
    name: "Frijoles",
    category: "foods-good",
    level: "green",
    why: "Tienen mucha fibra soluble y proteína vegetal, y pueden sustituir a las carnes grasosas.",
    portion: "½ a 1 taza, 3 a 4 veces por semana. Mejor cocidos en casa que refritos con manteca."
  },
  {
    id: "lentejas",
    name: "Lentejas",
    category: "foods-good",
    level: "green",
    why: "Aportan fibra soluble y proteína vegetal, y no tienen colesterol.",
    portion: "½ a 1 taza, 2 a 3 veces por semana."
  },
  {
    id: "salmon",
    name: "Salmón",
    category: "foods-good",
    level: "green",
    why: "Aporta omega-3, que ayuda a bajar los triglicéridos.",
    portion: "2 porciones por semana, al horno, a la plancha o hervido."
  },
  {
    id: "sardina",
    name: "Sardina",
    category: "foods-good",
    level: "green",
    why: "Aporta omega-3, que ayuda a bajar los triglicéridos, y es una opción económica.",
    portion: "2 porciones por semana, al horno o hervida. Si es enlatada, escúrrela: puede tener mucha sal."
  },
  {
    id: "aguacate",
    name: "Aguacate",
    category: "foods-good",
    level: "green",
    why: "Aporta grasas saludables que reemplazan a las grasas saturadas.",
    portion: "¼ a ½ unidad al día."
  },
  {
    id: "mani",
    name: "Maní",
    category: "foods-good",
    level: "green",
    why: "Aporta grasas saludables y fibra, y puede ayudar a reducir el LDL cuando reemplaza alimentos con grasa saturada.",
    portion: "Un puñado pequeño (unos 30 g) al día, sin sal ni azúcar. Es calórico, no conviene pasarse."
  },
  {
    id: "almendras",
    name: "Almendras",
    category: "foods-good",
    level: "green",
    why: "Tienen grasas saludables y fibra, y pueden ayudar a reducir el LDL.",
    portion: "Un puñado pequeño (unas 10 almendras) al día, sin sal ni azúcar. Son calóricas, no conviene pasarse."
  },
  {
    id: "aceite-oliva",
    name: "Aceite de oliva",
    category: "foods-good",
    level: "green",
    why: "Sustituye a la margarina y la manteca por grasas insaturadas.",
    portion: "1 a 2 cucharadas al día."
  },
  {
    id: "manzana",
    name: "Manzana",
    category: "foods-good",
    level: "green",
    why: "Tiene pectina, una fibra soluble que ayuda a reducir el colesterol.",
    portion: "1 a 2 al día, entera y con cáscara si se puede."
  },
  {
    id: "naranja",
    name: "Naranja",
    category: "foods-good",
    level: "green",
    why: "Tiene pectina, una fibra soluble que ayuda a reducir el colesterol, y vitamina C.",
    portion: "1 a 2 al día, mejor entera que en jugo."
  },
  {
    id: "pera",
    name: "Pera",
    category: "foods-good",
    level: "green",
    why: "Tiene pectina, una fibra soluble que ayuda a reducir el colesterol.",
    portion: "1 a 2 al día, entera y con cáscara si se puede."
  },
  {
    id: "lechuga",
    name: "Lechuga",
    category: "foods-good",
    level: "green",
    why: "Aporta fibra y agua con muy pocas calorías, y no tiene colesterol.",
    portion: "Al menos 1 plato al día, en ensalada. Aliña con limón y un poco de aceite de oliva, no con aderezos cremosos."
  },
  {
    id: "ayote",
    name: "Ayote",
    category: "foods-good",
    level: "green",
    why: "Aporta fibra y vitaminas con pocas calorías, y no tiene colesterol.",
    portion: "½ a 1 taza, varias veces por semana, en sopa, crema o al vapor, sin mantequilla ni crema."
  },
  {
    id: "platano",
    name: "Plátano",
    category: "foods-good",
    level: "green",
    why: "Aporta fibra y potasio, y es una buena fruta para la colación.",
    portion: "1 pequeño, hervido o al horno. No frito."
  },
  {
    id: "pollo-sin-piel",
    name: "Pollo sin piel",
    category: "foods-good",
    level: "yellow",
    why: "Es una proteína magra, pero la piel concentra grasa saturada.",
    portion: "Una porción del tamaño de la palma de la mano, al horno, a la plancha o hervido."
  },
  {
    id: "huevo",
    name: "Huevo",
    category: "foods-good",
    level: "yellow",
    why: "La yema tiene colesterol, así que si el LDL está alto conviene moderarlo.",
    portion: "Pregunta a tu médico cuántos por semana. Mejor cocidos o pochados que fritos."
  },
  {
    id: "leche",
    name: "Leche descremada",
    category: "foods-good",
    level: "yellow",
    why: "Da calcio con menos grasa saturada que la leche entera.",
    portion: "1 a 2 vasos al día."
  },

  // ---------------------------------------------------------------- ALIMENTOS A EVITAR
  {
    id: "frituras",
    name: "Frituras",
    category: "foods-avoid",
    level: "red",
    why: "Aumentan las grasas saturadas y trans, que suben el LDL.",
    portion: "Evitar. Preferir horno, plancha o vapor."
  },
  {
    id: "salchicha",
    name: "Salchicha",
    category: "foods-avoid",
    level: "red",
    why: "Es alta en grasa saturada y en sal.",
    portion: "Evitar, o dejarla como excepción ocasional."
  },
  {
    id: "tocino",
    name: "Tocino",
    category: "foods-avoid",
    level: "red",
    why: "Es alto en grasa saturada y en sal.",
    portion: "Evitar, o dejarlo como excepción ocasional."
  },
  {
    id: "jamon",
    name: "Jamón",
    category: "foods-avoid",
    level: "red",
    why: "Es alto en sal y suele tener grasa saturada.",
    portion: "Evitar, o dejarlo como excepción ocasional."
  },
  {
    id: "chorizo",
    name: "Chorizo",
    category: "foods-avoid",
    level: "red",
    why: "Es alto en grasa saturada y en sal.",
    portion: "Evitar, o dejarlo como excepción ocasional."
  },
  {
    id: "higado",
    name: "Hígado",
    category: "foods-avoid",
    level: "red",
    why: "Tiene cantidades muy altas de colesterol.",
    portion: "Evitar."
  },
  {
    id: "rinon",
    name: "Riñón",
    category: "foods-avoid",
    level: "red",
    why: "Tiene cantidades muy altas de colesterol.",
    portion: "Evitar."
  },
  {
    id: "menudencias",
    name: "Menudencias",
    category: "foods-avoid",
    level: "red",
    why: "Tienen cantidades muy altas de colesterol.",
    portion: "Evitar."
  },
  {
    id: "margarina",
    name: "Margarina",
    category: "foods-avoid",
    level: "red",
    why: "Muchas margarinas en barra tienen grasas saturadas o trans, que suben el LDL.",
    portion: "Evitar. Sustituir por aceite de oliva. Si la usas, elige una sin grasas trans (revisa la etiqueta)."
  },
  {
    id: "manteca",
    name: "Manteca",
    category: "foods-avoid",
    level: "red",
    why: "Es una grasa saturada que eleva el LDL.",
    portion: "Evitar. Sustituir por aceite de oliva."
  },
  {
    id: "crema",
    name: "Crema",
    category: "foods-avoid",
    level: "red",
    why: "Es una grasa saturada que eleva el LDL.",
    portion: "Evitar. Para dar cremosidad, usa leche descremada."
  },
  {
    id: "chicharron",
    name: "Chicharrón",
    category: "foods-avoid",
    level: "red",
    why: "Tiene mucha grasa saturada.",
    portion: "Evitar."
  },
  {
    id: "reposteria",
    name: "Repostería industrial",
    category: "foods-avoid",
    level: "red",
    why: "Puede tener grasas trans y mucha azúcar, que sube los triglicéridos.",
    portion: "Evitar."
  },
  {
    id: "galletas",
    name: "Galletas",
    category: "foods-avoid",
    level: "red",
    why: "Las industriales suelen tener grasas trans, azúcar y harina refinada.",
    portion: "Evitar, o dejarlas como excepción ocasional."
  },
  {
    id: "pasteles",
    name: "Pasteles",
    category: "foods-avoid",
    level: "red",
    why: "Tienen mucha azúcar y grasa saturada.",
    portion: "Evitar."
  },
  {
    id: "pupusas",
    name: "Pupusas",
    category: "foods-avoid",
    level: "yellow",
    why: "Son de maíz, pero se hacen en comal con aceite o manteca y suelen llevar queso o chicharrón, que aportan grasa saturada.",
    portion:
      "Con moderación: 1 o 2, de frijol o de verduras, hechas con poco aceite y sin chicharrón ni mucho queso. Acompáñalas con ensalada."
  },
  {
    id: "helados",
    name: "Helados",
    category: "foods-avoid",
    level: "red",
    why: "Tienen grasa saturada y mucha azúcar.",
    portion: "Evitar."
  },
  {
    id: "camarones",
    name: "Camarones",
    category: "foods-avoid",
    level: "yellow",
    why: "Tienen colesterol, aunque poca grasa saturada.",
    portion: "Con moderación y sin freír."
  },
  {
    id: "mariscos",
    name: "Mariscos",
    category: "foods-avoid",
    level: "yellow",
    why: "Tienen colesterol, aunque poca grasa saturada.",
    portion: "Con moderación y sin freír."
  },
  {
    id: "pan-blanco",
    name: "Pan blanco",
    category: "foods-avoid",
    level: "yellow",
    why: "Los carbohidratos refinados pueden subir los triglicéridos.",
    portion: "Moderar. Preferir pan integral."
  },
  {
    id: "arroz-blanco",
    name: "Arroz blanco",
    category: "foods-avoid",
    level: "yellow",
    why: "Los carbohidratos refinados pueden subir los triglicéridos.",
    portion: "Moderar (3 a 4 cucharadas). Preferir arroz integral."
  },
  {
    id: "azucar",
    name: "Azúcar",
    category: "foods-avoid",
    level: "yellow",
    why: "El azúcar añadida puede subir los triglicéridos.",
    portion: "Moderar. Endulza poco y prefiere las bebidas sin azúcar."
  },

  // ---------------------------------------------------------------- BEBIDAS RECOMENDADAS
  {
    id: "agua",
    name: "Agua natural",
    category: "drinks-good",
    level: "green",
    why: "Hidrata sin azúcar ni grasa.",
    portion: "6 a 8 vasos al día."
  },
  {
    id: "te-verde",
    name: "Té verde sin azúcar",
    category: "drinks-good",
    level: "green",
    why: "No aporta calorías y algunos estudios sugieren un efecto modesto sobre el LDL.",
    portion: "1 a 3 tazas al día, sin azúcar. Contiene cafeína."
  },
  {
    id: "licuado-verde",
    name: "Licuado verde (pepino, apio, espinaca)",
    category: "drinks-good",
    level: "green",
    why: "Aporta fibra y vitaminas con muy pocas calorías.",
    portion: "1 vaso al día, sin azúcar."
  },
  {
    id: "licuado-avena",
    name: "Licuado de avena con fruta",
    category: "drinks-good",
    level: "green",
    why: "La avena aporta fibra soluble que ayuda a reducir el colesterol.",
    portion: "1 vaso al día, preparado con agua o leche descremada y sin azúcar."
  },
  {
    id: "jugo-tomate",
    name: "Jugo de tomate natural sin sal",
    category: "drinks-good",
    level: "green",
    why: "Aporta potasio y antioxidantes con pocas calorías.",
    portion: "1 vaso pequeño al día. Revisa que no tenga sal añadida."
  },
  {
    id: "jugo-naranja",
    name: "Jugo natural de naranja",
    category: "drinks-good",
    level: "yellow",
    why: "Aporta vitamina C y potasio, pero el azúcar de la fruta sube rápido. Es mejor comer la fruta entera.",
    portion: "1 vaso pequeño (½ taza), recién hecho y sin azúcar añadida."
  },
  {
    id: "agua-jamaica",
    name: "Agua de jamaica sin azúcar",
    category: "drinks-good",
    level: "yellow",
    why: "Algunos estudios sugieren efectos modestos sobre las grasas en sangre.",
    portion: "1 vaso al día, sin azúcar.",
    warning: "Puede bajar la presión arterial. Si tomas medicamentos para la presión, consulta a tu médico."
  },

  // ---------------------------------------------------------------- BEBIDAS A EVITAR
  {
    id: "gaseosas",
    name: "Gaseosas",
    category: "drinks-avoid",
    level: "red",
    why: "Tienen mucha azúcar, que eleva los triglicéridos y aporta calorías vacías.",
    portion: "Evitar. Cambiar por agua con limón."
  },
  {
    id: "jugos-industriales",
    name: "Jugos y néctares industrializados",
    category: "drinks-avoid",
    level: "red",
    why: "Tienen azúcar añadida y casi nada de fibra.",
    portion: "Evitar."
  },
  {
    id: "energeticas",
    name: "Bebidas energéticas",
    category: "drinks-avoid",
    level: "red",
    why: "Tienen mucha azúcar y cafeína.",
    portion: "Evitar."
  },
  {
    id: "cerveza",
    name: "Cerveza",
    category: "drinks-avoid",
    level: "red",
    why: ALCOHOL_WHY,
    portion: ALCOHOL_PORTION
  },
  {
    id: "ron",
    name: "Ron",
    category: "drinks-avoid",
    level: "red",
    why: ALCOHOL_WHY,
    portion: ALCOHOL_PORTION
  },
  {
    id: "licores",
    name: "Licores",
    category: "drinks-avoid",
    level: "red",
    why: ALCOHOL_WHY,
    portion: ALCOHOL_PORTION
  },
  {
    id: "frappes",
    name: "Frappés",
    category: "drinks-avoid",
    level: "red",
    why: "Combinan azúcar, calorías y grasa saturada.",
    portion: "Evitar. El café solo o con leche descremada sin azúcar es mejor opción."
  },
  {
    id: "cafe-crema",
    name: "Café con crema y azúcar",
    category: "drinks-avoid",
    level: "red",
    why: "Combina azúcar y grasa saturada.",
    portion: "Evitar. El café solo o con leche descremada sin azúcar es mejor opción."
  },
  {
    id: "leche-entera",
    name: "Leche entera",
    category: "drinks-avoid",
    level: "yellow",
    why: "Tiene más grasa saturada que la leche descremada.",
    portion: "Preferir leche descremada."
  },
  {
    id: "toronja",
    name: "Jugo de toronja (pomelo)",
    category: "drinks-avoid",
    level: "yellow",
    why: "No es malo por sí mismo, pero puede interferir con algunos medicamentos.",
    portion: "Consultar antes de tomarlo.",
    warning:
      "Puede interactuar con algunos medicamentos para el colesterol, como atorvastatina o simvastatina. Consulta a tu médico o farmacéutico antes de tomarlo."
  },

  // ---------------------------------------------------------------- VERDURAS, CEREALES Y CONDIMENTOS
  {
    id: "arroz-integral",
    name: "Arroz integral",
    category: "others",
    level: "green",
    why: "Tiene más fibra que el arroz blanco.",
    portion: "3 a 4 cucharadas por comida."
  },
  {
    id: "tortilla-maiz",
    name: "Tortilla de maíz",
    category: "others",
    level: "green",
    why: "Aporta fibra y no tiene colesterol.",
    portion: "1 a 2 tortillas por comida."
  },
  {
    id: "pan-integral",
    name: "Pan integral",
    category: "others",
    level: "green",
    why: "Tiene más fibra que el pan blanco.",
    portion: "1 a 2 rebanadas por comida."
  },
  {
    id: "papa",
    name: "Papa",
    category: "others",
    level: "yellow",
    why: "Aporta energía y potasio, pero es rica en almidón.",
    portion: "1 papa mediana, cocida o al horno. Evita freírla."
  },
  {
    id: "tomate",
    name: "Tomate",
    category: "others",
    level: "green",
    why: "Aporta vitaminas y antioxidantes con muy pocas calorías.",
    portion: "1 a 2 al día, en ensalada o cocido."
  },
  {
    id: "pepino",
    name: "Pepino",
    category: "others",
    level: "green",
    why: "Aporta agua y fibra con muy pocas calorías.",
    portion: "En ensalada o en licuados, cuando quieras."
  },
  {
    id: "zanahoria",
    name: "Zanahoria",
    category: "others",
    level: "green",
    why: "Aporta fibra y vitamina A con pocas calorías.",
    portion: "1 a 2 al día, cruda o cocida."
  },
  {
    id: "guisquil",
    name: "Güisquil",
    category: "others",
    level: "green",
    why: "Aporta fibra y agua con pocas calorías.",
    portion: "½ a 1 taza, cocido en sopa o al vapor."
  },
  {
    id: "ejote",
    name: "Ejote",
    category: "others",
    level: "green",
    why: "Aporta fibra y vitaminas con pocas calorías.",
    portion: "½ a 1 taza, al vapor o en sopa."
  },
  {
    id: "brocoli",
    name: "Brócoli",
    category: "others",
    level: "green",
    why: "Aporta fibra y vitaminas con pocas calorías.",
    portion: "½ a 1 taza, al vapor o en sopa.",
    warning: "Si tomas warfarina o acenocumarol, come cantidades constantes y avisa a tu médico: tiene vitamina K."
  },
  {
    id: "cebolla",
    name: "Cebolla",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa.",
    portion: "Cruda o cocida, al gusto."
  },
  {
    id: "apio",
    name: "Apio",
    category: "others",
    level: "green",
    why: "Aporta agua y fibra con muy pocas calorías.",
    portion: "En sopas, licuados o ensaladas."
  },
  {
    id: "espinaca",
    name: "Espinaca",
    category: "others",
    level: "green",
    why: "Aporta fibra, hierro y vitaminas con muy pocas calorías.",
    portion: "1 plato en ensalada o ½ taza cocida.",
    warning: "Si tomas warfarina o acenocumarol, come cantidades constantes y avisa a tu médico: tiene vitamina K."
  },
  {
    id: "limon",
    name: "Limón",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa y aporta vitamina C.",
    portion: "Para aliñar ensaladas y pescados, en lugar de aderezos cremosos."
  },
  {
    id: "ajo",
    name: "Ajo",
    category: "others",
    level: "green",
    why: "Da sabor sin sal.",
    portion: FLAVOR_PORTION
  },
  {
    id: "cilantro",
    name: "Cilantro",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa.",
    portion: FLAVOR_PORTION
  },
  {
    id: "perejil",
    name: "Perejil",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa.",
    portion: FLAVOR_PORTION
  },
  {
    id: "canela",
    name: "Canela",
    category: "others",
    level: "green",
    why: "Da un sabor dulce sin necesidad de azúcar.",
    portion: "Una pizca en avena, frutas o infusiones."
  },
  {
    id: "laurel",
    name: "Hoja de laurel",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa.",
    portion: "1 hoja al cocinar frijoles, lentejas o sopas. Se retira antes de servir."
  },
  {
    id: "oregano",
    name: "Orégano",
    category: "others",
    level: "green",
    why: "Da sabor sin sal ni grasa.",
    portion: FLAVOR_PORTION
  },
  {
    id: "pimienta",
    name: "Pimienta",
    category: "others",
    level: "green",
    why: "Da sabor sin sal.",
    portion: FLAVOR_PORTION
  }
];

export const DIET_ITEM_BY_ID = new Map<string, DietItem>(
  DIET_ITEMS.map((item) => [item.id, item] as [string, DietItem])
);