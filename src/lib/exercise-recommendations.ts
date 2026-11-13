// Rutinas de ejercicio recomendadas según el estado de cada persona.
// Son orientativas: no reemplazan la indicación del médico.
import { CARDIAC_CLEARANCE_KEYS } from "@/lib/plan-profile";

export interface ExerciseProfile {
  age: number | null;
  sex: "female" | "male" | "other" | null;
  bmi: number | null;
  conditions: string[]; // claves de health-conditions marcadas como «Padece»
  conditionLabels: string[];
  ldl: string | null; // estado de la última medición (NORMAL, HIGH, …)
  tg: string | null;
  hdl: string | null;
  critical: boolean;
  goalMinutes: number;
}

export type AgeGroup = "nino" | "joven" | "adulto" | "mayor";
export type Sex = "female" | "male";
export type Place = "casa" | "oficina" | "calle";

// Condiciones que se pueden combinar libremente en el explorador.
export type ConditionKey =
  | "sobrepeso"
  | "obesidad"
  | "ldl"
  | "tg"
  | "hdl"
  | "diabetes"
  | "presion"
  | "corazon"
  | "asma"
  | "articulaciones"
  | "espalda"
  | "animo"
  | "sedentario"
  | "embarazo";

export type AudienceKey = ConditionKey | "ninos" | "adolescentes" | "senoritas" | "jovenes" | "mujeres" | "hombres" | "mayores";

export interface Combo {
  age: AgeGroup | null;
  sex: Sex | null;
  conditions: ConditionKey[];
}

export const AGE_GROUPS: { key: AgeGroup; label: string; hint: string }[] = [
  { key: "nino", label: "Niño o niña", hint: "Hasta 11 años" },
  { key: "joven", label: "Joven", hint: "De 12 a 29 años" },
  { key: "adulto", label: "Adulto", hint: "De 30 a 59 años" },
  { key: "mayor", label: "Adulto mayor", hint: "60 años o más" }
];

export const PLACES: { key: Place; label: string }[] = [
  { key: "casa", label: "Casa" },
  { key: "oficina", label: "Oficina o escuela" },
  { key: "calle", label: "Calle o parque" }
];

export const CONDITION_GROUPS: { title: string; items: { key: ConditionKey; label: string; hint: string }[] }[] = [
  {
    title: "Peso y lípidos",
    items: [
      { key: "sobrepeso", label: "Sobrepeso", hint: "IMC de 25 a 29.9" },
      { key: "obesidad", label: "Obesidad", hint: "IMC de 30 o más" },
      { key: "ldl", label: "Colesterol alto", hint: "LDL fuera de meta" },
      { key: "tg", label: "Triglicéridos altos", hint: "150 mg/dL o más" },
      { key: "hdl", label: "HDL bajo", hint: "Colesterol bueno bajo" }
    ]
  },
  {
    title: "Enfermedades",
    items: [
      { key: "diabetes", label: "Diabetes o prediabetes", hint: "Cuida la glucosa" },
      { key: "presion", label: "Presión alta", hint: "Sin cargar mucho peso" },
      { key: "corazon", label: "Enfermedad del corazón", hint: "Con autorización médica" },
      { key: "asma", label: "Asma o EPOC", hint: "Cuida la respiración" },
      { key: "articulaciones", label: "Dolor de articulaciones", hint: "Artritis, osteoporosis o gota" },
      { key: "espalda", label: "Dolor de espalda", hint: "Espalda baja o cuello" },
      { key: "animo", label: "Ánimo y estrés", hint: "Depresión o ansiedad" }
    ]
  },
  {
    title: "Situación",
    items: [
      { key: "sedentario", label: "Empezando de cero", hint: "Si casi no te mueves" },
      { key: "embarazo", label: "Embarazo", hint: "Con permiso de tu médico" }
    ]
  }
];

const CONDITION_LABEL = Object.fromEntries(CONDITION_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.label]))) as Record<ConditionKey, string>;

export const AUDIENCE_LABEL: Record<AudienceKey, string> = {
  ...CONDITION_LABEL,
  ninos: "Niños",
  adolescentes: "Adolescentes",
  senoritas: "Señoritas",
  jovenes: "Jóvenes con lípidos normales",
  mujeres: "Señoras",
  hombres: "Hombres de edad media",
  mayores: "Adultos mayores"
};

export type GoalKey = "tg" | "hdl" | "ldl" | "peso" | "glucosa" | "fuerza" | "equilibrio" | "flexibilidad" | "respiracion" | "animo";

export const GOALS: { key: GoalKey; label: string }[] = [
  { key: "tg", label: "Bajar triglicéridos" },
  { key: "hdl", label: "Subir HDL" },
  { key: "ldl", label: "Ayudar al LDL" },
  { key: "peso", label: "Bajar de peso" },
  { key: "glucosa", label: "Controlar glucosa" },
  { key: "fuerza", label: "Ganar fuerza" },
  { key: "equilibrio", label: "Equilibrio" },
  { key: "flexibilidad", label: "Flexibilidad" },
  { key: "respiracion", label: "Respiración" },
  { key: "animo", label: "Ánimo" }
];

export type Intensity = "suave" | "moderada" | "vigorosa";

export interface RoutineStep {
  name: string;
  minutes: number;
  how: string;
}

export interface Routine {
  id: string;
  name: string;
  activityType: string; // tipo de Hábitos > Actividad al guardarla
  intensity: Intensity;
  days: string;
  places: Place[];
  goals: GoalKey[];
  forWho: AudienceKey[];
  avoid: AudienceKey[];
  onlyAges?: AgeGroup[]; // solo se muestra para estas edades
  requires?: AudienceKey[]; // solo se muestra si la persona tiene todas estas
  steps: RoutineStep[];
  caution?: string;
}

const warm = (minutes = 5): RoutineStep => ({ name: "Calentar", minutes, how: "Camina despacio y mueve hombros, cadera y tobillos en círculos." });
const cool = (minutes = 5): RoutineStep => ({ name: "Estirar", minutes, how: "Estira piernas, brazos y espalda sin rebotar. Respira profundo." });
const GROWN: AgeGroup[] = ["joven", "adulto", "mayor"];
const NO_KIDS_NO_SENIORS: AgeGroup[] = ["joven", "adulto"];

export const ROUTINES: Routine[] = [
  // ---------- Caminar ----------
  {
    id: "caminata-suave",
    name: "Caminata suave",
    activityType: "caminata",
    intensity: "suave",
    days: "5 días por semana",
    places: ["calle", "casa"],
    goals: ["tg", "hdl", "glucosa", "animo"],
    forWho: ["mayores", "obesidad", "corazon", "asma", "presion", "sedentario", "articulaciones", "embarazo", "espalda"],
    avoid: [],
    steps: [warm(), { name: "Caminar", minutes: 15, how: "A un paso en el que puedas cantar o conversar sin esfuerzo." }, cool()]
  },
  {
    id: "caminata-ligera",
    name: "Caminata a paso ligero",
    activityType: "caminata",
    intensity: "moderada",
    days: "5 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "ldl", "peso", "glucosa"],
    forWho: ["mujeres", "hombres", "ldl", "tg", "hdl", "sobrepeso", "diabetes", "senoritas", "embarazo"],
    avoid: [],
    steps: [warm(), { name: "Caminar rápido", minutes: 20, how: "Más rápido que de paseo: puedes hablar, pero no cantar." }, cool()]
  },
  {
    id: "intervalos",
    name: "Caminata con intervalos",
    activityType: "caminata",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "peso"],
    forWho: ["jovenes", "hombres", "mujeres", "senoritas", "tg", "hdl", "sobrepeso"],
    avoid: ["corazon", "mayores", "obesidad", "embarazo"],
    steps: [warm(), { name: "Rápido y lento", minutes: 20, how: "Alterna 2 minutos rápido y 2 minutos despacio, 5 veces." }, cool()],
    caution: "Si te falta el aire para hablar, quédate en el paso lento."
  },
  {
    id: "parque-bancas",
    name: "Paseo por el parque con descansos",
    activityType: "caminata",
    intensity: "suave",
    days: "4 a 5 días por semana",
    places: ["calle"],
    goals: ["tg", "glucosa", "animo", "equilibrio"],
    forWho: ["mayores", "obesidad", "corazon", "asma", "articulaciones", "sedentario"],
    avoid: [],
    steps: [
      { name: "Primer tramo", minutes: 8, how: "Camina hasta la siguiente banca a paso cómodo." },
      { name: "Descanso activo", minutes: 3, how: "Sentado en la banca, mueve tobillos y respira profundo." },
      { name: "Segundo tramo", minutes: 8, how: "Sigue caminando; si puedes, un poco más que el primero." },
      { name: "Regreso tranquilo", minutes: 6, how: "Vuelve despacio, mirando el paisaje." }
    ],
    caution: "Lleva agua, sombrero y tu teléfono."
  },
  {
    id: "nordica",
    name: "Caminata con bastones",
    activityType: "caminata",
    intensity: "moderada",
    days: "3 a 4 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "fuerza", "equilibrio"],
    forWho: ["mayores", "articulaciones", "sobrepeso", "obesidad", "hdl", "tg", "espalda"],
    avoid: ["corazon"],
    onlyAges: ["adulto", "mayor"],
    steps: [warm(), { name: "Caminar con bastones", minutes: 20, how: "Apoya el bastón contrario al pie que avanza; empuja con los brazos." }, cool()],
    caution: "Los bastones quitan peso a rodillas y cadera. Pide que te ajusten la altura."
  },
  {
    id: "mandados",
    name: "Hacer mandados a pie",
    activityType: "caminata",
    intensity: "suave",
    days: "Cuando salgas",
    places: ["calle"],
    goals: ["tg", "glucosa", "animo"],
    forWho: ["sedentario", "mayores", "mujeres", "hombres", "diabetes", "presion"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Ir caminando", minutes: 12, how: "Ve a la tienda, al mercado o a la farmacia a pie." },
      { name: "Volver con la bolsa repartida", minutes: 12, how: "Reparte el peso en las dos manos y camina erguido." }
    ]
  },
  {
    id: "bus-parada",
    name: "Bajar del bus una parada antes",
    activityType: "caminata",
    intensity: "moderada",
    days: "Todos los días hábiles",
    places: ["calle", "oficina"],
    goals: ["tg", "hdl", "peso"],
    forWho: ["hombres", "mujeres", "senoritas", "jovenes", "sedentario", "tg", "sobrepeso"],
    avoid: [],
    onlyAges: GROWN,
    steps: [{ name: "Ida", minutes: 10, how: "Bájate una parada antes y camina a paso firme." }, { name: "Regreso", minutes: 10, how: "Al volver, haz lo mismo." }]
  },
  {
    id: "almuerzo",
    name: "Caminata en la hora de almuerzo",
    activityType: "caminata",
    intensity: "moderada",
    days: "Todos los días hábiles",
    places: ["oficina", "calle"],
    goals: ["glucosa", "tg", "animo"],
    forWho: ["diabetes", "tg", "ldl", "hombres", "mujeres", "jovenes", "senoritas", "sedentario"],
    avoid: [],
    onlyAges: GROWN,
    steps: [{ name: "Salir a caminar", minutes: 15, how: "Después de comer, da una vuelta a la cuadra o por los pasillos." }]
  },
  {
    id: "bajo-techo",
    name: "Caminata bajo techo",
    activityType: "caminata",
    intensity: "suave",
    days: "Días de lluvia, frío o calor",
    places: ["calle"],
    goals: ["tg", "glucosa", "respiracion"],
    forWho: ["asma", "mayores", "corazon", "obesidad", "sedentario", "embarazo"],
    avoid: [],
    steps: [warm(), { name: "Vueltas en el centro comercial o mercado", minutes: 20, how: "Camina por los pasillos sin parar en las vitrinas." }, cool(3)],
    caution: "Ideal si el aire frío o el polvo te dan tos."
  },
  {
    id: "perro",
    name: "Paseo con tu mascota",
    activityType: "caminata",
    intensity: "suave",
    days: "Todos los días",
    places: ["calle"],
    goals: ["animo", "tg", "glucosa"],
    forWho: ["mayores", "sedentario", "animo", "mujeres", "hombres", "adolescentes"],
    avoid: [],
    steps: [{ name: "Paseo", minutes: 20, how: "Saca a pasear a tu perro (o al de un vecino) a paso cómodo." }]
  },
  {
    id: "familia",
    name: "Paseo en familia",
    activityType: "caminata",
    intensity: "suave",
    days: "Fines de semana",
    places: ["calle"],
    goals: ["animo", "tg"],
    forWho: ["ninos", "mayores", "mujeres", "hombres", "animo", "embarazo"],
    avoid: [],
    steps: [{ name: "Caminar juntos", minutes: 30, how: "Vayan al parque o a la plaza. Que el más lento marque el paso." }]
  },
  {
    id: "subida",
    name: "Caminata en subida suave",
    activityType: "caminata",
    intensity: "moderada",
    days: "2 a 3 días por semana",
    places: ["calle"],
    goals: ["hdl", "tg", "peso", "fuerza"],
    forWho: ["hombres", "mujeres", "jovenes", "senoritas", "hdl", "tg"],
    avoid: ["corazon", "asma"],
    steps: [warm(), { name: "Cuesta suave", minutes: 15, how: "Busca una calle con poca pendiente; sube y baja varias veces." }, cool()]
  },
  {
    id: "senderismo",
    name: "Senderismo suave",
    activityType: "caminata",
    intensity: "moderada",
    days: "1 vez por semana",
    places: ["calle"],
    goals: ["hdl", "tg", "animo", "fuerza"],
    forWho: ["jovenes", "senoritas", "hombres", "mujeres", "adolescentes", "animo"],
    avoid: ["corazon", "embarazo"],
    steps: [warm(), { name: "Sendero", minutes: 45, how: "Un sendero fácil, con buen calzado y en compañía." }, cool()],
    caution: "Lleva agua, protector solar y avisa a dónde vas."
  },
  {
    id: "despues-comer",
    name: "Paseo después de comer",
    activityType: "caminata",
    intensity: "suave",
    days: "Después de cada comida",
    places: ["casa", "oficina", "calle"],
    goals: ["glucosa", "tg"],
    forWho: ["diabetes", "tg", "mayores", "sedentario", "sobrepeso", "embarazo"],
    avoid: [],
    steps: [{ name: "Paseo corto", minutes: 10, how: "Camina 10 minutos al terminar de comer: ayuda con la glucosa y los triglicéridos." }]
  },
  {
    id: "telefono",
    name: "Caminar mientras hablas por teléfono",
    activityType: "caminata",
    intensity: "suave",
    days: "En cada llamada",
    places: ["oficina", "casa"],
    goals: ["tg", "glucosa"],
    forWho: ["sedentario", "sobrepeso", "tg", "diabetes", "hombres", "mujeres"],
    avoid: [],
    onlyAges: GROWN,
    steps: [{ name: "Llamadas de pie", minutes: 10, how: "Cada vez que hables por teléfono, levántate y camina por el pasillo." }]
  },

  // ---------- Correr y deportes ----------
  {
    id: "trote",
    name: "Trote suave",
    activityType: "caminata",
    intensity: "vigorosa",
    days: "3 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "peso"],
    forWho: ["jovenes", "senoritas", "hombres", "adolescentes", "hdl", "tg"],
    avoid: ["corazon", "obesidad", "mayores", "articulaciones", "asma", "embarazo"],
    steps: [warm(), { name: "Trotar", minutes: 15, how: "Trote suave; si te cansas, camina un minuto y sigue." }, cool()]
  },
  {
    id: "correr",
    name: "Correr 30 minutos",
    activityType: "caminata",
    intensity: "vigorosa",
    days: "3 días por semana",
    places: ["calle"],
    goals: ["hdl", "tg", "peso", "animo"],
    forWho: ["jovenes", "senoritas", "adolescentes", "hdl"],
    avoid: ["corazon", "obesidad", "sobrepeso", "mayores", "articulaciones", "asma", "embarazo", "presion"],
    onlyAges: NO_KIDS_NO_SENIORS,
    steps: [warm(), { name: "Correr", minutes: 30, how: "A un ritmo constante en el que aún puedas decir frases cortas." }, cool()]
  },
  {
    id: "deporte",
    name: "Deporte en equipo",
    activityType: "otra",
    intensity: "vigorosa",
    days: "3 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "peso", "animo"],
    forWho: ["adolescentes", "jovenes", "senoritas", "ninos"],
    avoid: ["corazon", "mayores", "obesidad", "articulaciones", "embarazo"],
    onlyAges: ["nino", "joven", "adulto"],
    steps: [warm(), { name: "Partido o práctica", minutes: 40, how: "Fútbol, básquet, voleibol o el deporte que te guste." }, cool()]
  },
  {
    id: "circuito-parque",
    name: "Circuito en el parque",
    activityType: "otra",
    intensity: "vigorosa",
    days: "2 a 3 días por semana",
    places: ["calle"],
    goals: ["fuerza", "hdl", "peso"],
    forWho: ["jovenes", "hombres", "senoritas", "adolescentes"],
    avoid: ["corazon", "mayores", "obesidad", "embarazo", "presion", "articulaciones"],
    onlyAges: NO_KIDS_NO_SENIORS,
    steps: [
      warm(),
      { name: "Flexiones en banca", minutes: 4, how: "Manos en la banca, cuerpo recto, 10 veces." },
      { name: "Subir al escalón", minutes: 4, how: "Sube y baja de un escalón firme, cambiando de pierna." },
      { name: "Sentadillas", minutes: 4, how: "15 veces, con la espalda recta." },
      { name: "Trote entre estaciones", minutes: 6, how: "Trota suave de una estación a otra, 3 vueltas." },
      cool()
    ]
  },
  {
    id: "cuerda",
    name: "Saltar la cuerda",
    activityType: "otra",
    intensity: "vigorosa",
    days: "3 días por semana",
    places: ["casa", "calle"],
    goals: ["hdl", "tg", "peso"],
    forWho: ["ninos", "adolescentes", "jovenes", "senoritas"],
    avoid: ["obesidad", "articulaciones", "mayores", "corazon", "embarazo", "espalda"],
    onlyAges: ["nino", "joven", "adulto"],
    steps: [warm(3), { name: "Saltos", minutes: 10, how: "30 segundos saltando y 30 segundos descansando." }, cool(3)],
    caution: "Salta bajito, sobre la punta de los pies y en piso que no sea duro."
  },
  {
    id: "patinar",
    name: "Patines, patineta o scooter",
    activityType: "otra",
    intensity: "moderada",
    days: "2 a 3 días por semana",
    places: ["calle"],
    goals: ["equilibrio", "animo", "peso"],
    forWho: ["ninos", "adolescentes"],
    avoid: ["mayores", "articulaciones", "corazon", "embarazo"],
    onlyAges: ["nino", "joven"],
    steps: [{ name: "Rodar", minutes: 30, how: "En un parque o calle cerrada, con casco y rodilleras." }]
  },
  {
    id: "natacion",
    name: "Nadar por largos",
    activityType: "natacion",
    intensity: "vigorosa",
    days: "2 a 3 días por semana",
    places: ["calle"],
    goals: ["hdl", "tg", "peso", "respiracion"],
    forWho: ["jovenes", "adolescentes", "senoritas", "asma", "sobrepeso", "hdl", "espalda"],
    avoid: ["corazon"],
    onlyAges: ["nino", "joven", "adulto"],
    steps: [warm(), { name: "Largos", minutes: 25, how: "Nada un largo y descansa 30 segundos; repite." }, cool()]
  },
  {
    id: "agua",
    name: "Caminar o nadar en el agua",
    activityType: "natacion",
    intensity: "moderada",
    days: "2 a 3 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "peso", "flexibilidad"],
    forWho: ["obesidad", "sobrepeso", "articulaciones", "asma", "mayores", "ninos", "embarazo", "espalda"],
    avoid: [],
    steps: [warm(), { name: "En el agua", minutes: 20, how: "Camina en la piscina o nada suave, a tu ritmo." }, cool()],
    caution: "Si tienes asma, el aire húmedo de la piscina suele ayudar; lleva tu inhalador."
  },
  {
    id: "aquaerobicos",
    name: "Aeróbicos en el agua",
    activityType: "natacion",
    intensity: "moderada",
    days: "2 días por semana",
    places: ["calle"],
    goals: ["tg", "hdl", "fuerza", "flexibilidad"],
    forWho: ["mayores", "obesidad", "articulaciones", "embarazo", "mujeres", "espalda"],
    avoid: [],
    onlyAges: GROWN,
    steps: [warm(), { name: "Clase en la piscina", minutes: 30, how: "Mueve brazos y piernas contra el agua siguiendo al instructor." }, cool()]
  },
  {
    id: "bicicleta",
    name: "Bicicleta suave",
    activityType: "bicicleta",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["casa", "calle"],
    goals: ["tg", "hdl", "peso", "glucosa"],
    forWho: ["sobrepeso", "obesidad", "articulaciones", "tg", "diabetes", "ninos", "adolescentes"],
    avoid: [],
    steps: [warm(), { name: "Pedalear", minutes: 20, how: "Fija o normal, sin subidas fuertes y a ritmo constante." }, cool()],
    caution: "Si tienes poco equilibrio, usa bicicleta fija."
  },

  // ---------- En casa ----------
  {
    id: "silla",
    name: "Ejercicios con silla",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "3 días por semana",
    places: ["casa", "oficina"],
    goals: ["fuerza", "equilibrio", "glucosa"],
    forWho: ["mayores", "obesidad", "articulaciones", "corazon", "sedentario"],
    avoid: [],
    steps: [
      { name: "Calentar sentado", minutes: 3, how: "Sentado, mueve brazos y marcha con los pies." },
      { name: "Sentarse y levantarse", minutes: 4, how: "Levántate de la silla sin usar las manos si puedes. 10 veces, descansa y repite." },
      { name: "Brazos arriba", minutes: 4, how: "Sube los brazos al frente y a los lados, 10 veces cada uno." },
      { name: "Puntas de pie", minutes: 4, how: "Apoyado en el respaldo, sube y baja en puntas de pie, 10 veces." }
    ]
  },
  {
    id: "cama",
    name: "Ejercicios en la cama para empezar",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "Todas las mañanas",
    places: ["casa"],
    goals: ["fuerza", "flexibilidad"],
    forWho: ["mayores", "corazon", "obesidad", "sedentario", "articulaciones", "espalda"],
    avoid: [],
    onlyAges: ["adulto", "mayor"],
    steps: [
      { name: "Tobillos", minutes: 2, how: "Acostado, dibuja círculos con los pies, 10 hacia cada lado." },
      { name: "Deslizar talones", minutes: 3, how: "Dobla una rodilla deslizando el talón y estírala; 10 con cada pierna." },
      { name: "Puente pequeño", minutes: 3, how: "Rodillas dobladas, sube un poco la cadera y baja despacio, 8 veces." },
      { name: "Brazos al techo", minutes: 2, how: "Sube y baja los brazos respirando profundo." }
    ]
  },
  {
    id: "marcha",
    name: "Marcha en el lugar con música",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "Todos los días",
    places: ["casa", "oficina"],
    goals: ["tg", "glucosa", "animo"],
    forWho: ["mayores", "obesidad", "sedentario", "corazon", "asma", "embarazo"],
    avoid: [],
    steps: [
      { name: "Marcha lenta", minutes: 3, how: "Levanta las rodillas a tu ritmo, apoyado en una silla si lo necesitas." },
      { name: "Marcha con brazos", minutes: 6, how: "Agrega los brazos al ritmo de una canción alegre." },
      { name: "Bajar el ritmo", minutes: 3, how: "Marcha cada vez más despacio y respira." }
    ]
  },
  {
    id: "sala-10",
    name: "Rutina de 10 minutos en la sala",
    activityType: "ejercicios_casa",
    intensity: "moderada",
    days: "Todos los días",
    places: ["casa"],
    goals: ["tg", "hdl", "peso", "glucosa"],
    forWho: ["sobrepeso", "tg", "mujeres", "hombres", "sedentario", "diabetes", "senoritas"],
    avoid: ["corazon"],
    steps: [
      { name: "Marcha", minutes: 2, how: "Marcha levantando rodillas y brazos." },
      { name: "Paso lateral con brazos", minutes: 2, how: "Da un paso al lado abriendo los brazos, sin saltar." },
      { name: "Sentadilla a silla", minutes: 2, how: "Siéntate y levántate de una silla, sin parar." },
      { name: "Golpes al aire", minutes: 2, how: "Lanza golpes suaves al frente, alternando brazos." },
      { name: "Respirar y estirar", minutes: 2, how: "Baja el ritmo y estira." }
    ]
  },
  {
    id: "aerobicos",
    name: "Aeróbicos de bajo impacto",
    activityType: "baile",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["casa"],
    goals: ["tg", "hdl", "peso", "animo"],
    forWho: ["senoritas", "mujeres", "sobrepeso", "tg", "hdl", "animo"],
    avoid: ["corazon"],
    onlyAges: GROWN,
    steps: [warm(), { name: "Clase en video", minutes: 20, how: "Sigue un video de aeróbicos sin saltos: siempre un pie en el piso." }, cool()]
  },
  {
    id: "baile",
    name: "Baile en casa",
    activityType: "baile",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["casa"],
    goals: ["tg", "hdl", "animo", "peso"],
    forWho: ["mujeres", "senoritas", "adolescentes", "animo", "sobrepeso", "ninos", "tg", "hdl"],
    avoid: [],
    steps: [warm(), { name: "Bailar", minutes: 15, how: "Pon tu música favorita y muévete sin parar." }, cool()]
  },
  {
    id: "fuerza",
    name: "Fuerza con bandas o tu peso",
    activityType: "ejercicios_casa",
    intensity: "moderada",
    days: "2 días por semana",
    places: ["casa"],
    goals: ["fuerza", "glucosa", "peso"],
    forWho: ["hombres", "mujeres", "diabetes", "sobrepeso", "jovenes", "adolescentes"],
    avoid: ["corazon"],
    onlyAges: GROWN,
    steps: [
      warm(),
      { name: "Sentadillas", minutes: 4, how: "Como si te sentaras en una silla, 10 a 12 veces, 2 rondas." },
      { name: "Flexiones en pared", minutes: 4, how: "Apoya las manos en la pared y dobla los codos, 10 veces." },
      { name: "Remo con banda", minutes: 4, how: "Jala la banda hacia ti juntando la espalda, 12 veces." },
      cool()
    ],
    caution: "No aguantes la respiración al hacer fuerza: suelta el aire al esforzarte."
  },
  {
    id: "botellas",
    name: "Pesas caseras con botellas",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "2 a 3 días por semana",
    places: ["casa", "oficina"],
    goals: ["fuerza", "glucosa", "equilibrio"],
    forWho: ["mayores", "mujeres", "diabetes", "articulaciones", "presion", "sedentario"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Bíceps", minutes: 3, how: "Con una botella de agua en cada mano, dobla los codos 12 veces." },
      { name: "Hombros", minutes: 3, how: "Sube las botellas por encima de la cabeza, 10 veces." },
      { name: "Brazos a los lados", minutes: 3, how: "Abre los brazos hasta la altura del hombro, 10 veces." },
      { name: "Sentadilla con botellas", minutes: 3, how: "Siéntate y levántate de la silla con las botellas, 8 veces." }
    ],
    caution: "Empieza con botellas de medio litro. Suelta el aire al subir."
  },
  {
    id: "escalon",
    name: "Subir y bajar un escalón",
    activityType: "ejercicios_casa",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["casa"],
    goals: ["hdl", "tg", "fuerza", "peso"],
    forWho: ["hombres", "mujeres", "jovenes", "sobrepeso", "hdl"],
    avoid: ["articulaciones", "corazon"],
    onlyAges: GROWN,
    steps: [warm(3), { name: "Escalón", minutes: 12, how: "Sube con un pie, luego el otro, y baja. Cambia de pierna cada minuto." }, cool(3)],
    caution: "Usa el primer escalón de la escalera y agárrate del pasamanos."
  },
  {
    id: "plancha",
    name: "Abdomen y plancha",
    activityType: "ejercicios_casa",
    intensity: "moderada",
    days: "2 a 3 días por semana",
    places: ["casa"],
    goals: ["fuerza"],
    forWho: ["jovenes", "senoritas", "hombres", "adolescentes", "espalda"],
    avoid: ["embarazo", "presion", "corazon"],
    onlyAges: NO_KIDS_NO_SENIORS,
    steps: [
      warm(3),
      { name: "Plancha en rodillas", minutes: 3, how: "Apoya antebrazos y rodillas, cuerpo recto, 20 segundos y descansa." },
      { name: "Perro y pájaro", minutes: 4, how: "En cuatro apoyos, estira un brazo y la pierna contraria; alterna." },
      { name: "Puente", minutes: 3, how: "Boca arriba, sube la cadera y baja despacio, 12 veces." },
      cool(3)
    ]
  },
  {
    id: "pilates",
    name: "Pilates suave en el piso",
    activityType: "estiramientos",
    intensity: "suave",
    days: "2 a 3 días por semana",
    places: ["casa"],
    goals: ["fuerza", "flexibilidad", "equilibrio"],
    forWho: ["espalda", "mujeres", "senoritas", "jovenes", "animo"],
    avoid: ["embarazo"],
    onlyAges: GROWN,
    steps: [
      { name: "Respiración costal", minutes: 3, how: "Boca arriba, respira llevando el aire a las costillas." },
      { name: "Báscula de pelvis", minutes: 4, how: "Pega la espalda baja al piso y suelta, despacio." },
      { name: "Elevación de piernas", minutes: 5, how: "De lado, sube y baja la pierna de arriba, 12 por lado." },
      { name: "Estiramiento del gato", minutes: 3, how: "En cuatro apoyos, curva y arquea la espalda." }
    ]
  },
  {
    id: "quehaceres",
    name: "Quehaceres a buen ritmo",
    activityType: "otra",
    intensity: "moderada",
    days: "2 a 3 días por semana",
    places: ["casa"],
    goals: ["tg", "peso", "fuerza"],
    forWho: ["mujeres", "hombres", "sobrepeso", "tg", "sedentario"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Barrer y trapear", minutes: 15, how: "Sin parar y con música; cambia de mano." },
      { name: "Lavar el carro o el patio", minutes: 15, how: "Moviéndote todo el tiempo. Dobla las rodillas al agacharte." }
    ]
  },
  {
    id: "jardineria",
    name: "Jardinería y casa en movimiento",
    activityType: "jardineria",
    intensity: "suave",
    days: "2 a 3 días por semana",
    places: ["casa"],
    goals: ["fuerza", "animo", "flexibilidad"],
    forWho: ["mayores", "mujeres", "animo", "sedentario"],
    avoid: [],
    steps: [{ name: "Moverse con propósito", minutes: 30, how: "Riega, barre o arregla plantas sin parar. Agáchate doblando las rodillas." }]
  },
  {
    id: "nietos",
    name: "Jugar con tus hijos o nietos",
    activityType: "otra",
    intensity: "moderada",
    days: "Cuando puedas",
    places: ["casa", "calle"],
    goals: ["animo", "tg", "equilibrio"],
    forWho: ["mujeres", "hombres", "mayores", "animo"],
    avoid: ["corazon"],
    onlyAges: GROWN,
    steps: [{ name: "Jugar", minutes: 20, how: "Pelota, escondite o ronda: deja que ellos te pongan a correr." }]
  },
  {
    id: "prenatal",
    name: "Ejercicios suaves para el embarazo",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "3 a 5 días por semana",
    places: ["casa"],
    goals: ["fuerza", "flexibilidad", "respiracion"],
    forWho: ["embarazo"],
    avoid: [],
    onlyAges: NO_KIDS_NO_SENIORS,
    requires: ["embarazo"],
    steps: [
      { name: "Caminar en casa", minutes: 5, how: "Camina despacio por la casa moviendo los brazos." },
      { name: "Báscula de pelvis de pie", minutes: 4, how: "Espalda contra la pared, lleva la pelvis adelante y atrás." },
      { name: "Sentadilla con apoyo", minutes: 4, how: "Agarrada de una mesa, baja un poco y sube, 8 veces." },
      { name: "Respirar profundo", minutes: 4, how: "Sentada, inhala por la nariz y suelta largo por la boca." }
    ],
    caution: "Con permiso de tu médico. Después del cuarto mes no te acuestes boca arriba y evita saltos."
  },

  // ---------- Oficina ----------
  {
    id: "pausa-activa",
    name: "Pausa activa en el escritorio",
    activityType: "estiramientos",
    intensity: "suave",
    days: "Cada 1 a 2 horas",
    places: ["oficina"],
    goals: ["flexibilidad", "glucosa", "animo"],
    forWho: ["sedentario", "presion", "animo", "hombres", "mujeres", "jovenes", "senoritas", "espalda", "diabetes"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Cuello y hombros", minutes: 2, how: "Gira los hombros atrás y lleva la oreja al hombro, sin forzar." },
      { name: "Manos y muñecas", minutes: 1, how: "Abre y cierra las manos; gira las muñecas." },
      { name: "Espalda sentado", minutes: 2, how: "Entrelaza los dedos y estira los brazos al techo; luego gira el tronco." },
      { name: "De pie y caminar", minutes: 3, how: "Levántate, ve por agua o camina por el pasillo." }
    ]
  },
  {
    id: "piernas-escritorio",
    name: "Piernas activas bajo el escritorio",
    activityType: "ejercicios_casa",
    intensity: "suave",
    days: "Varias veces al día",
    places: ["oficina", "casa"],
    goals: ["glucosa", "fuerza"],
    forWho: ["diabetes", "sedentario", "obesidad", "embarazo", "mayores", "presion"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Talón y punta", minutes: 2, how: "Sentado, sube las puntas y luego los talones, 20 veces." },
      { name: "Rodillas arriba", minutes: 2, how: "Sube una rodilla y luego la otra, como marchando sentado." },
      { name: "Estirar piernas", minutes: 2, how: "Estira una pierna al frente 5 segundos; alterna." },
      { name: "Apretar glúteos", minutes: 1, how: "Aprieta 5 segundos y suelta, 10 veces." }
    ],
    caution: "Ayuda a la circulación si pasas mucho tiempo sentado."
  },
  {
    id: "fuerza-oficina",
    name: "Fuerza sin salir de la oficina",
    activityType: "ejercicios_casa",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["oficina", "casa"],
    goals: ["fuerza", "glucosa", "tg"],
    forWho: ["sedentario", "diabetes", "sobrepeso", "hombres", "mujeres", "jovenes", "tg"],
    avoid: ["corazon"],
    onlyAges: GROWN,
    steps: [
      { name: "Sentarse y levantarse", minutes: 3, how: "De tu silla (sin rueditas), 12 veces." },
      { name: "Flexiones en el escritorio", minutes: 3, how: "Manos en el borde del escritorio, dobla los codos 10 veces." },
      { name: "Sentadilla contra la pared", minutes: 2, how: "Espalda en la pared, baja un poco y aguanta 15 segundos." },
      { name: "Puntas de pie", minutes: 2, how: "Sube y baja agarrado del escritorio, 15 veces." }
    ]
  },
  {
    id: "espalda-silla",
    name: "Espalda sana en la silla",
    activityType: "estiramientos",
    intensity: "suave",
    days: "Todos los días",
    places: ["oficina", "casa"],
    goals: ["flexibilidad", "fuerza"],
    forWho: ["espalda", "articulaciones", "sedentario", "mayores", "embarazo"],
    avoid: [],
    onlyAges: GROWN,
    steps: [
      { name: "Sentarse derecho", minutes: 1, how: "Pies en el piso, cadera atrás y hombros relajados." },
      { name: "Gato sentado", minutes: 2, how: "Manos en las rodillas, curva la espalda y luego ábrela." },
      { name: "Giro suave", minutes: 2, how: "Gira el tronco a cada lado agarrando el respaldo." },
      { name: "Inclinarse al frente", minutes: 2, how: "Deja caer el tronco entre las piernas y sube despacio." }
    ]
  },
  {
    id: "respiracion-oficina",
    name: "Respiración antiestrés",
    activityType: "otra",
    intensity: "suave",
    days: "Cuando te sientas tenso",
    places: ["oficina", "casa", "calle"],
    goals: ["animo", "respiracion"],
    forWho: ["animo", "presion", "corazon", "asma", "embarazo"],
    avoid: [],
    steps: [
      { name: "Respiración en caja", minutes: 3, how: "Inhala en 4, aguanta en 4, suelta en 4 y espera en 4." },
      { name: "Soltar los hombros", minutes: 2, how: "Sube los hombros al inhalar y déjalos caer al soltar." },
      { name: "Exhalación larga", minutes: 3, how: "Suelta el aire el doble de lento de lo que lo tomas." }
    ]
  },
  {
    id: "escaleras",
    name: "Subir escaleras con calma",
    activityType: "otra",
    intensity: "moderada",
    days: "3 días por semana",
    places: ["casa", "oficina", "calle"],
    goals: ["hdl", "fuerza", "tg"],
    forWho: ["hombres", "mujeres", "jovenes", "hdl"],
    avoid: ["corazon", "articulaciones", "obesidad", "mayores"],
    steps: [warm(3), { name: "Escaleras", minutes: 8, how: "Sube y baja agarrado del pasamanos, descansando arriba." }, cool(3)]
  },

  // ---------- Estiramientos, equilibrio y respiración ----------
  {
    id: "estiramientos",
    name: "Estiramientos y movilidad",
    activityType: "estiramientos",
    intensity: "suave",
    days: "Todos los días",
    places: ["casa", "oficina"],
    goals: ["flexibilidad", "animo"],
    forWho: ["mayores", "articulaciones", "animo", "sedentario", "mujeres", "hombres", "presion", "espalda", "embarazo"],
    avoid: [],
    steps: [
      { name: "Cuello y hombros", minutes: 4, how: "Gira despacio cuello y hombros, sin forzar." },
      { name: "Espalda y cadera", minutes: 5, how: "Inclínate al frente y a los lados, apoyado si lo necesitas." },
      { name: "Piernas", minutes: 6, how: "Estira la parte de atrás de las piernas y las pantorrillas, 20 segundos cada una." }
    ]
  },
  {
    id: "despertar",
    name: "Estiramientos al despertar",
    activityType: "estiramientos",
    intensity: "suave",
    days: "Todas las mañanas",
    places: ["casa"],
    goals: ["flexibilidad", "animo"],
    forWho: ["mayores", "articulaciones", "espalda", "animo", "sedentario"],
    avoid: [],
    steps: [
      { name: "En la cama", minutes: 3, how: "Estírate como gato: brazos arriba y puntas de los pies lejos." },
      { name: "Rodillas al pecho", minutes: 2, how: "Abraza una rodilla y luego la otra." },
      { name: "Sentado en la orilla", minutes: 3, how: "Gira hombros y cuello antes de pararte despacio." }
    ]
  },
  {
    id: "equilibrio",
    name: "Equilibrio para prevenir caídas",
    activityType: "estiramientos",
    intensity: "suave",
    days: "3 días por semana",
    places: ["casa"],
    goals: ["equilibrio", "fuerza"],
    forWho: ["mayores", "articulaciones"],
    avoid: [],
    steps: [
      { name: "Un pie", minutes: 4, how: "Junto a una pared, párate en un pie 10 segundos y cambia." },
      { name: "Talón con punta", minutes: 4, how: "Camina en línea recta poniendo el talón delante de la punta." },
      { name: "Pasos de lado", minutes: 4, how: "Da pasos a los lados apoyado en una mesa." },
      cool(3)
    ],
    caution: "Hazlo siempre cerca de algo firme para apoyarte."
  },
  {
    id: "tai-chi",
    name: "Tai chi o yoga suave",
    activityType: "estiramientos",
    intensity: "suave",
    days: "3 días por semana",
    places: ["casa", "calle"],
    goals: ["equilibrio", "flexibilidad", "animo", "respiracion"],
    forWho: ["mayores", "animo", "presion", "articulaciones", "espalda"],
    avoid: [],
    steps: [{ name: "Respirar y moverse", minutes: 5, how: "De pie, sube los brazos al inhalar y bájalos al exhalar." }, { name: "Posturas suaves", minutes: 15, how: "Sigue un video de tai chi o yoga para principiantes, sin forzar." }]
  },
  {
    id: "respiracion",
    name: "Respiración y paseo lento",
    activityType: "otra",
    intensity: "suave",
    days: "Todos los días",
    places: ["casa", "oficina", "calle"],
    goals: ["respiracion", "animo"],
    forWho: ["asma", "animo", "corazon", "mayores", "presion", "embarazo"],
    avoid: [],
    steps: [
      { name: "Respiración con la panza", minutes: 4, how: "Mano en la panza: inhala por la nariz inflándola y suelta despacio." },
      { name: "Labios fruncidos", minutes: 3, how: "Suelta el aire como soplando una vela, el doble de lento que al inhalar." },
      { name: "Paseo lento", minutes: 8, how: "Camina despacio coordinando pasos y respiración." }
    ],
    caution: "Ten tu inhalador a la mano y evita el frío, el humo y el polvo."
  },

  // ---------- Para niños ----------
  {
    id: "juegos",
    name: "Juegos activos",
    activityType: "otra",
    intensity: "vigorosa",
    days: "Todos los días",
    places: ["casa", "calle"],
    goals: ["peso", "fuerza", "animo"],
    forWho: ["ninos"],
    avoid: ["corazon"],
    onlyAges: ["nino"],
    steps: [
      { name: "Saltar la cuerda", minutes: 10, how: "Por turnos, con descansos cortos." },
      { name: "Pelota o escondite", minutes: 30, how: "Juegos que hagan correr y reír." },
      { name: "Ronda o baile", minutes: 20, how: "Para terminar moviéndose en grupo." }
    ],
    caution: "Los niños necesitan al menos 60 minutos de juego activo al día."
  },
  {
    id: "animales",
    name: "Circuito de animales",
    activityType: "otra",
    intensity: "vigorosa",
    days: "Todos los días",
    places: ["casa", "calle"],
    goals: ["fuerza", "equilibrio", "peso"],
    forWho: ["ninos", "obesidad", "sobrepeso"],
    avoid: ["corazon"],
    onlyAges: ["nino"],
    steps: [
      { name: "Oso", minutes: 3, how: "Camina en cuatro patas con las rodillas sin tocar el piso." },
      { name: "Rana", minutes: 3, how: "Saltitos agachado, como rana." },
      { name: "Cangrejo", minutes: 3, how: "Boca arriba con manos y pies en el piso, camina de lado." },
      { name: "Flamenco", minutes: 3, how: "Parado en un pie, ¿quién aguanta más?" },
      { name: "Canguro", minutes: 3, how: "Saltos con los pies juntos." }
    ]
  },
  {
    id: "congelados",
    name: "Baile congelado",
    activityType: "baile",
    intensity: "moderada",
    days: "Todos los días",
    places: ["casa"],
    goals: ["animo", "peso", "equilibrio"],
    forWho: ["ninos", "adolescentes", "asma", "animo"],
    avoid: [],
    onlyAges: ["nino", "joven"],
    steps: [{ name: "Bailar y congelarse", minutes: 15, how: "Bailen con música; cuando se detenga, todos quietos como estatuas." }]
  },
  {
    id: "globos",
    name: "Soplar burbujas y globos",
    activityType: "otra",
    intensity: "suave",
    days: "Todos los días",
    places: ["casa", "calle"],
    goals: ["respiracion", "animo"],
    forWho: ["ninos", "asma"],
    avoid: [],
    onlyAges: ["nino"],
    steps: [
      { name: "Burbujas", minutes: 4, how: "Sopla burbujas largas y lentas." },
      { name: "Globo en el aire", minutes: 6, how: "Mantengan un globo en el aire sin que toque el piso." },
      { name: "Respirar como globo", minutes: 3, how: "Infla la panza al tomar aire y desínflala despacio." }
    ]
  },
  {
    id: "patio",
    name: "Rayuela y carreras en el patio",
    activityType: "otra",
    intensity: "vigorosa",
    days: "3 a 5 días por semana",
    places: ["casa", "calle"],
    goals: ["equilibrio", "peso", "animo"],
    forWho: ["ninos"],
    avoid: ["corazon"],
    onlyAges: ["nino"],
    steps: [
      { name: "Rayuela", minutes: 10, how: "Dibujen el avioncito con yeso y salten por turnos." },
      { name: "Carreras cortas", minutes: 10, how: "Carreras de una pared a otra, con descansos." },
      { name: "Lanzar y atrapar", minutes: 10, how: "Con una pelota, cada vez más lejos." }
    ]
  }
];

export function routineMinutes(routine: Routine) {
  return routine.steps.reduce((sum, step) => sum + step.minutes, 0);
}

export function ageGroupOf(age: number | null): AgeGroup | null {
  if (age === null) return null;
  if (age < 12) return "nino";
  if (age < 30) return "joven";
  if (age < 60) return "adulto";
  return "mayor";
}

// Convierte los datos de la persona en una combinación (edad, sexo y condiciones).
export function comboFromProfile(profile: ExerciseProfile): Combo {
  const conditions = new Set<ConditionKey>();
  const has = (...keys: string[]) => keys.some((key) => profile.conditions.includes(key));
  if (profile.bmi !== null) {
    if (profile.bmi >= 30) conditions.add("obesidad");
    else if (profile.bmi >= 25) conditions.add("sobrepeso");
  }
  if (has("obesidad")) {
    conditions.delete("sobrepeso");
    conditions.add("obesidad");
  }
  if (has("asma_epoc", "apnea")) conditions.add("asma");
  if ((profile.ldl && profile.ldl !== "NORMAL") || has("colesterol_familiar")) conditions.add("ldl");
  if (profile.tg && profile.tg !== "NORMAL") conditions.add("tg");
  if (profile.hdl === "LOW") conditions.add("hdl");
  if (has("diabetes", "prediabetes")) conditions.add("diabetes");
  if (has("hipertension")) conditions.add("presion");
  if (has(...CARDIAC_CLEARANCE_KEYS)) conditions.add("corazon");
  if (has("artritis", "osteoporosis", "gota")) conditions.add("articulaciones");
  if (has("depresion_ansiedad")) conditions.add("animo");
  const sex = profile.sex === "female" || profile.sex === "male" ? profile.sex : null;
  return { age: ageGroupOf(profile.age), sex, conditions: Array.from(conditions) };
}

// A qué grupos pertenece una combinación.
export function audiencesOfCombo(combo: Combo): AudienceKey[] {
  const list = new Set<AudienceKey>(combo.conditions);
  const lipidsNormal = !combo.conditions.some((key) => key === "ldl" || key === "tg" || key === "hdl");
  if (combo.age === "nino") list.add("ninos");
  if (combo.age === "joven") {
    list.add("adolescentes");
    if (lipidsNormal) list.add("jovenes");
    if (combo.sex === "female") list.add("senoritas");
  }
  if (combo.age === "adulto") {
    if (combo.sex !== "male") list.add("mujeres");
    if (combo.sex !== "female") list.add("hombres");
  }
  if (combo.age === "mayor") list.add("mayores");
  return Array.from(list);
}

export function audiencesOf(profile: ExerciseProfile) {
  return audiencesOfCombo(comboFromProfile(profile));
}

// Qué conviene trabajar según sus valores y enfermedades.
export function needsOf(audiences: AudienceKey[]): GoalKey[] {
  const needs = new Set<GoalKey>();
  if (audiences.includes("tg")) needs.add("tg");
  if (audiences.includes("hdl")) needs.add("hdl");
  if (audiences.includes("ldl")) needs.add("ldl");
  if (audiences.includes("sobrepeso") || audiences.includes("obesidad")) needs.add("peso");
  if (audiences.includes("diabetes")) needs.add("glucosa");
  if (audiences.includes("mayores")) needs.add("equilibrio");
  if (audiences.includes("asma")) needs.add("respiracion");
  if (audiences.includes("articulaciones") || audiences.includes("espalda")) needs.add("flexibilidad");
  if (audiences.includes("animo")) needs.add("animo");
  return Array.from(needs);
}

// Por qué no conviene una rutina (o null si está bien para la persona).
export function avoidReason(routine: Routine, audiences: AudienceKey[]) {
  const hits = routine.avoid.filter((key) => audiences.includes(key));
  return hits.length > 0 ? hits.map((key) => AUDIENCE_LABEL[key].toLowerCase()).join(", ") : null;
}

// Para quién de la combinación es ideal la rutina.
export function matchesOf(routine: Routine, audiences: AudienceKey[]) {
  return routine.forWho.filter((key) => audiences.includes(key)).map((key) => AUDIENCE_LABEL[key]);
}

export function fitsPerson(routine: Routine, audiences: AudienceKey[], age: AgeGroup | null) {
  if (routine.onlyAges && age !== null && !routine.onlyAges.includes(age)) return false;
  if (routine.requires && !routine.requires.every((key) => audiences.includes(key))) return false;
  return true;
}

export function scoreRoutine(routine: Routine, audiences: AudienceKey[], needs: GoalKey[]) {
  if (avoidReason(routine, audiences)) return -1;
  const fit = routine.forWho.filter((key) => audiences.includes(key)).length * 3;
  const goals = routine.goals.filter((key) => needs.includes(key)).length * 2;
  const careful = audiences.some((key) => key === "mayores" || key === "corazon" || key === "obesidad" || key === "embarazo");
  return fit + goals + (routine.intensity === "suave" && careful ? 2 : 0);
}

// Ordena las rutinas para cualquier combinación. Siempre devuelve sugerencias:
// si pocas encajan de lleno, completa con rutinas suaves y seguras.
export function rankFor(audiences: AudienceKey[], age: AgeGroup | null) {
  const needs = needsOf(audiences);
  const eligible = ROUTINES.filter((routine) => fitsPerson(routine, audiences, age));
  const avoided = eligible.filter((routine) => avoidReason(routine, audiences));
  const scored = eligible
    .filter((routine) => !avoidReason(routine, audiences))
    .map((routine) => ({ routine, score: scoreRoutine(routine, audiences, needs) }))
    .sort((a, b) => b.score - a.score);
  const good = scored.filter((item) => item.score > 0).map((item) => item.routine);
  const rest = scored.filter((item) => item.score <= 0).map((item) => item.routine);
  let list: Routine[];
  if (audiences.length === 0) list = scored.map((item) => item.routine);
  else if (good.length >= 8) list = good;
  else list = [...good, ...rest.filter((routine) => routine.intensity === "suave"), ...(good.length === 0 ? rest.filter((routine) => routine.intensity !== "suave") : [])];
  return { needs, list, avoided };
}

export function recommendedFor(profile: ExerciseProfile) {
  const combo = comboFromProfile(profile);
  // Con la edad exacta se afina el grupo «joven»: adolescente (12 a 17) o joven adulto (18 a 29).
  const age = profile.age;
  const audiences = audiencesOfCombo(combo).filter((key) => {
    if (age === null) return true;
    if (key === "adolescentes") return age < 18;
    if (key === "jovenes") return age >= 18;
    if (key === "senoritas") return age >= 15;
    return true;
  });
  return { combo, audiences, ...rankFor(audiences, combo.age) };
}

// Semana sugerida: alterna las mejores rutinas y deja días de descanso.
export function weekPlan(routines: Routine[], audiences: AudienceKey[]) {
  const restDays = audiences.includes("mayores") || audiences.includes("corazon") || audiences.includes("obesidad") ? [3, 6] : [6];
  const picks = routines.slice(0, 4);
  let next = 0;
  return Array.from({ length: 7 }, (_, index) => {
    if (restDays.includes(index) || picks.length === 0) return null;
    const routine = picks[next % picks.length];
    next += 1;
    return routine;
  });
}
