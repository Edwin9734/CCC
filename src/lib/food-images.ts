// Alimentos que ya tienen una foto real (archivo public/foods/<id>.webp).
// Los demás usan la ilustración provisional public/foods/<id>.svg.
export const PHOTO_IDS: string[] = [
  "avena",
  "frijoles",
  "lentejas",
  "salmon",
  "sardina",
  "aguacate",
  "mani",
  "almendras",
  "aceite-oliva",
  "manzana",
  "naranja",
  "pera",
  "lechuga",
  "ayote",
  "platano",
  "pollo-sin-piel",
  "huevo",
  "leche",
  "frituras",
  "salchicha",
  "tocino",
  "jamon",
  "chorizo",
  "higado",
  "rinon",
  "menudencias",
  "margarina",
  "manteca",
  "crema",
  "chicharron",
  "reposteria",
  "galletas",
  "pasteles",
  "pupusas",
  "helados",
  "camarones",
  "mariscos",
  "pan-blanco",
  "arroz-blanco",
  "azucar",
  "agua",
  "te-verde",
  "licuado-verde",
  "licuado-avena",
  "jugo-tomate",
  "jugo-naranja",
  "agua-jamaica",
  "gaseosas",
  "jugos-industriales",
  "energeticas",
  "cerveza",
  "ron",
  "licores",
  "frappes",
  "cafe-crema",
  "leche-entera",
  "toronja",
  "arroz-integral",
  "tortilla-maiz",
  "pan-integral",
  "papa",
  "tomate",
  "pepino",
  "zanahoria",
  "guisquil",
  "ejote",
  "brocoli",
  "cebolla",
  "apio",
  "espinaca",
  "limon",
  "ajo",
  "cilantro",
  "perejil",
  "canela",
  "laurel",
  "oregano",
  "pimienta"
];

const PHOTO_SET = new Set(PHOTO_IDS);

export function hasFoodPhoto(id: string): boolean {
  return PHOTO_SET.has(id);
}

export function foodImageSrc(id: string): string {
  return PHOTO_SET.has(id) ? `/foods/${id}.webp` : `/foods/${id}.svg`;
}

// Crédito que se muestra al pie de la guía de alimentación (null = no se muestra nada).
// Los íconos de la barra inferior también son de Twemoji, así que el crédito se mantiene.
export const FOOD_IMAGE_CREDIT: string | null = "Íconos de Twemoji (CC BY 4.0).";