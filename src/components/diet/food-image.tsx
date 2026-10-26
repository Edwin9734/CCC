"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { foodImageSrc } from "@/lib/food-images";

// Imagen pequeña de un alimento. El tamaño se da en píxeles base y crece con el control de letra.
// Si el archivo no existe, muestra un ícono de plato.
export function FoodImage({
  id,
  size = 40,
  eager = false,
  rounded = "rounded-xl",
  className
}: {
  id: string;
  size?: number;
  eager?: boolean;
  rounded?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dimension = `${size / 16}rem`;
  const box = { width: dimension, height: dimension };

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={box}
        className={cn("flex shrink-0 items-center justify-center bg-slate-100 text-muted", rounded, className)}
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
      className={cn("shrink-0 object-cover", rounded, className)}
    />
  );
}