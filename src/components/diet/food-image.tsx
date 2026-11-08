"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { foodImageSrc, hasFoodPhoto } from "@/lib/food-images";

// Imagen de un alimento. El tamaño se da en píxeles base y crece con el control de letra.
// Con "fill" ocupa todo el ancho de su contenedor, en cuadrado.
// Si el archivo no existe, muestra un ícono de plato.
export function FoodImage({
  id,
  size = 40,
  eager = false,
  fill = false,
  rounded = "rounded-xl",
  className
}: {
  id: string;
  size?: number;
  eager?: boolean;
  fill?: boolean;
  rounded?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dimension = `${size / 16}rem`;
  const box = fill ? undefined : { width: dimension, height: dimension };
  const sizing = fill ? "aspect-square w-full" : "shrink-0";

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={box}
        className={cn("flex items-center justify-center bg-slate-100 text-muted", sizing, rounded, className)}
      >
        <UtensilsCrossed className="h-1/2 w-1/2" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={foodImageSrc(id)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      style={box}
      className={cn(sizing, fill && !hasFoodPhoto(id) ? "object-contain p-3" : "object-cover", rounded, className)}
    />
  );
}
