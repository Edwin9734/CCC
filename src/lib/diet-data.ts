export type DietCategory = "foods-good" | "foods-avoid" | "drinks-good" | "drinks-avoid";
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

export const DIET_ITEMS: DietItem[] = [
  // ALIMENTOS RECOMENDADOS
  {
    id: "avena",
    name: "Avena",
    category: "foods-good",
    level: "green",
    why: "Contiene fibra soluble (betaglucanos) que ayuda a reducir el colesterol LDL.",
    portion: "1 taza cocida al día, sin azúcar añadida."
  },
  {
    id: "legumbres",
    name: "Frijoles, lentejas y garbanzos",
    category: "foods-good",
    level: "green",
    why: "Tienen mucha fibra soluble y proteína vegetal, y pueden sustituir a las carnes grasosas.",
    portion: "½ a 1 taza, 3 a 4 veces por semana."
  },
  {
    id: "pescados-grasos",
    name: "Pescados grasos (salmón, sardina, atún)",
    category: "foods-good",
    level: "green",
    why: "Aportan omega-3, que ayuda a bajar los triglicéridos.",
    portion: "2 porciones por semana, al horno, a la plancha o hervidos."
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
    id: "nueces",
    name: "Nueces y almendras",
    category: "foods-good",
    level: "green",
    why: "Tienen grasas saludables y fibra, y pueden ayudar a reducir el LDL.",
    portion: "Un puñado pequeño (unos 30 g) al día, sin sal ni azúcar. Son calóricas, no conviene pasarse."
  },
  {
    id: "aceite-oliva",
    name: "Aceite de oliva",
    category: "foods-good",
    level: "green",
    why: "Sustituye a la mantequilla y la manteca por grasas insaturadas.",
    portion: "1 a 2 cucharadas al día."
  },
  {
    id: "frutas-pectina",
    name: "Manzana, naranja y pera",
    category: "foods-good",
    level: "green",
    why: "Tienen pectina, una fibra soluble que ayuda a reducir el colesterol.",
    portion: "2 a 3 porciones de fruta al día, enteras y mejor con cáscara cuando se pueda."
  },
  {
    id: "verduras",
    name: "Verduras de hoja verde, berenjena y okra",
    category: "foods-good",
    level: "green",
    why: "Aportan mucha fibra, pocas calorías y nada de colesterol.",
    portion: "Al menos 1 plato al día."
  },
  {
    id: "soya",
    name: "Soya y tofu",
    category: "foods-good",
    level: "green",
    why: "Es proteína vegetal que puede reemplazar carnes con grasa saturada.",
    portion: "Algunas veces por semana."
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
    id: "lacteos-descremados",
    name: "Lácteos descremados",
    category: "foods-good",
    level: "yellow",
    why: "Dan calcio con menos grasa saturada que los lácteos enteros.",
    portion: "1 a 2 porciones al día."
  },

  // ALIMENTOS A EVITAR
  {
    id: "frituras",
    name: "Frituras",
    category: "foods-avoid",
    level: "red",
    why: "Aumentan las grasas saturadas y trans, que suben el LDL.",
    portion: "Evitar. Preferir horno, plancha o vapor."
  },
  {
    id: "embutidos",
    name: "Embutidos (salchicha, tocino, jamón, chorizo)",
    category: "foods-avoid",
    level: "red",
    why: "Son altos en grasa saturada y en sal.",
    portion: "Evitar, o dejarlos como excepción ocasional."
  },
  {
    id: "visceras",
    name: "Vísceras (hígado, riñón, menudencias)",
    category: "foods-avoid",
    level: "red",
    why: "Tienen cantidades muy altas de colesterol.",
    portion: "Evitar."
  },
  {
    id: "mantequilla-manteca",
    name: "Mantequilla, manteca y crema",
    category: "foods-avoid",
    level: "red",
    why: "Son grasas saturadas que elevan el LDL.",
    portion: "Evitar. Sustituir por aceite de oliva."
  },
  {
    id: "carnes-grasosas",
    name: "Carnes grasosas y chicharrón",
    category: "foods-avoid",
    level: "red",
    why: "Tienen mucha grasa saturada.",
    portion: "Evitar."
  },
  {
    id: "reposteria",
    name: "Repostería industrial, galletas y pasteles",
    category: "foods-avoid",
    level: "red",
    why: "Pueden tener grasas trans y mucha azúcar, que sube los triglicéridos.",
    portion: "Evitar."
  },
  {
    id: "comida-rapida",
    name: "Comida rápida",
    category: "foods-avoid",
    level: "red",
    why: "Combina fritura, grasa saturada, sal y azúcar.",
    portion: "Evitar, o dejarla como excepción poco frecuente."
  },
  {
    id: "helados",
    name: "Helados y postres con crema",
    category: "foods-avoid",
    level: "red",
    why: "Tienen grasa saturada y mucha azúcar.",
    portion: "Evitar."
  },
  {
    id: "carne-roja-magra",
    name: "Carne roja magra",
    category: "foods-avoid",
    level: "yellow",
    why: "Tiene menos grasa que las carnes grasosas, pero aún aporta grasa saturada.",
    portion: "Pocas veces por semana y en porciones pequeñas."
  },
  {
    id: "quesos-maduros",
    name: "Quesos maduros",
    category: "foods-avoid",
    level: "yellow",
    why: "Son altos en grasa saturada y en sal.",
    portion: "Porciones pequeñas. Preferir quesos frescos bajos en grasa."
  },
  {
    id: "mariscos",
    name: "Camarones y mariscos",
    category: "foods-avoid",
    level: "yellow",
    why: "Tienen colesterol, aunque poca grasa saturada.",
    portion: "Con moderación y sin freír."
  },
  {
    id: "refinados",
    name: "Pan blanco, arroz blanco y azúcar",
    category: "foods-avoid",
    level: "yellow",
    why: "Los carbohidratos refinados pueden subir los triglicéridos.",
    portion: "Moderar. Preferir versiones integrales."
  },

  // BEBIDAS RECOMENDADAS
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
    portion: "1 vaso pequeño al día. Revisar que no tenga sal añadida."
  },
  {
    id: "leche-vegetal",
    name: "Leche de soya o almendra sin azúcar",
    category: "drinks-good",
    level: "green",
    why: "Es una alternativa sin colesterol a la leche entera.",
    portion: "1 a 2 vasos al día, sin azúcar añadida."
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

  // BEBIDAS A EVITAR
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
    id: "alcohol",
    name: "Alcohol (cerveza, ron, licores)",
    category: "drinks-avoid",
    level: "red",
    why: "El alcohol en exceso sube los triglicéridos.",
    portion: "Evitar, o consultar a tu médico si se puede en pequeñas cantidades."
  },
  {
    id: "frappes",
    name: "Frappés y café con crema y azúcar",
    category: "drinks-avoid",
    level: "red",
    why: "Combinan azúcar, calorías y grasa saturada.",
    portion: "Evitar. El café solo o con leche descremada sin azúcar es mejor opción."
  },
  {
    id: "leche-entera",
    name: "Leche entera y bebidas con crema",
    category: "drinks-avoid",
    level: "yellow",
    why: "Tienen más grasa saturada que las versiones descremadas.",
    portion: "Preferir leche descremada o vegetal sin azúcar."
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
  }
];