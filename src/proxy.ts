import { NextResponse, type NextRequest } from "next/server";

// Rutas privadas: agenda del negocio, administración y sus APIs.
const PRIVADAS = ["/panel", "/admin", "/api/panel", "/api/admin", "/api/setup"];
// Primeros segmentos que no son páginas de ciudad/categoría.
const RESERVADAS = new Set(["n", "panel", "admin", "api", "r", "_next"]);

const esPrivada = (ruta: string) => PRIVADAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

export function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // Instalación en el local con PANEL_SOLO_LOCAL=true: lo que entra desde internet llega por
  // Cloudflare Tunnel y trae sus encabezados; desde la red del negocio no. Así la agenda solo abre en el local.
  if (process.env.PANEL_SOLO_LOCAL === "true" && esPrivada(ruta)) {
    if (request.headers.has("cf-connecting-ip") || request.headers.has("cf-ray")) {
      return new NextResponse("La agenda de este negocio solo abre desde la red del local.", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  // Instalación de un solo negocio (SOLO_NEGOCIO=slug): todo lleva a su página.
  const solo = process.env.SOLO_NEGOCIO;
  if (solo) {
    const destino = new URL(`/n/${solo}`, request.url);
    const [primero, segundo, tercero] = ruta.split("/").filter(Boolean);
    const otroNegocio =
      ((primero === "n" || primero === "panel") && segundo && segundo !== solo) ||
      (primero === "admin" && segundo === "setup" && tercero && tercero !== solo);
    const listado = !!primero && !!segundo && !tercero && !RESERVADAS.has(primero);
    if (ruta === "/" || otroNegocio || listado) return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  // Todo menos archivos estáticos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
