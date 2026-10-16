import { NextResponse, type NextRequest } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { ahoraEn, ESTADOS, sumarDias, zonaDe, type Estado } from "@/lib/agenda";
import { puedeVerPanel } from "@/lib/acceso";
import { db, SELECT_CITA, type Cita } from "@/lib/db";

// Citas del negocio desde hace 7 días hasta 30 días adelante.
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("negocio") ?? "";
  const negocio = getNegocio(slug);
  if (!negocio || !puedeVerPanel(slug, request.nextUrl.searchParams.get("k"))) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }

  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Base de datos no configurada." }, { status: 503 });

  const hoy = ahoraEn(zonaDe(negocio)).fecha;
  const citas = await sql<Cita[]>`
    select ${sql.unsafe(SELECT_CITA)} from citas
    where negocio = ${slug} and fecha between ${sumarDias(hoy, -7)} and ${sumarDias(hoy, 30)}
    order by fecha, hora, creada
  `;
  return NextResponse.json({ hoy, citas });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.negocio === "string" ? body.negocio : "";
  if (!getNegocio(slug) || !puedeVerPanel(slug, body?.k)) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }
  if (!ESTADOS.includes(body?.estado) || typeof body?.id !== "string") {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Base de datos no configurada." }, { status: 503 });

  const filas = await sql`
    update citas set estado = ${body.estado as Estado}, actualizada = now()
    where id = ${body.id}::uuid and negocio = ${slug}
    returning id
  `.catch(() => []);
  if (filas.length === 0) return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
