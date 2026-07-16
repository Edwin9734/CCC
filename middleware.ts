import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedRoutes = ["/dashboard", "/mediciones", "/medicamentos", "/reportes"];

export async function middleware(request: NextRequest) {
  // 1. Creamos una respuesta base
  let response = NextResponse.next({ request });

  // 2. Inicializamos el cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // A) Actualizamos las cookies en la petición entrante para que getUser() pueda leerlas al instante
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // B) Regeneramos la respuesta con la petición actualizada para que Next.js propague los headers correctamente
          response = NextResponse.next({ request });

          // C) Seteamos las cookies en la respuesta final que va hacia el navegador del usuario
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // 3. Obtenemos el usuario de forma segura (esto detonará setAll si el token expiró)
  const { data } = await supabase.auth.getUser();
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  // 4. Verificación de ruta protegida
  if (isProtected && !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Agregamos también la ruta raíz por si acaso, pero el matcher que tienes ya cubre las subrutas perfectamente.
  matcher: ["/dashboard/:path*", "/mediciones/:path*", "/medicamentos/:path*", "/reportes/:path*"]
};