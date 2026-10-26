// Alimentos que ya tienen una foto real (archivo public/foods/<id>.webp).
// Los demás usan la ilustración provisional public/foods/<id>.svg.
// Cuando me entregues tus fotos, te devuelvo este archivo actualizado.
export const PHOTO_IDS: string[] = [];

const PHOTO_SET = new Set(PHOTO_IDS);

export function foodImageSrc(id: string): string {
  return PHOTO_SET.has(id) ? `/foods/${id}.webp` : `/foods/${id}.svg`;
}

// Crédito que se muestra al pie de la guía de alimentación (null = no se muestra nada).
export const FOOD_IMAGE_CREDIT: string | null = "Ilustraciones provisionales de Twemoji (CC BY 4.0).";