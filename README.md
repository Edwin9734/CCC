# Control de Colesterol para Adultos Mayores

Aplicación web en español para registro manual de HDL, LDL y triglicéridos con Supabase como base de datos y autenticación.

## Incluye

- Interfaz pensada para adultos mayores
- Next.js + TypeScript + Tailwind
- Preparación para Supabase Auth y RLS
- Pantallas base para acceso, panel, mediciones, medicamentos y reportes

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Siguiente paso

1. Instalar dependencias con `npm install`.
2. Ejecutar el SQL de [supabase/schema.sql](supabase/schema.sql) en el proyecto de Supabase.
3. Crear registros reales con Supabase Auth y enlazar lectura/escritura desde la app.