import { NextResponse, type NextRequest } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { db } from "@/lib/db";
import { avances, buscarCodigo, linkInvitacion, primerNombre, programaDe } from "@/lib/referidos";

// Información pública de un código: quién invita (solo su primer nombre), premios y avance.
export async function GET(request: NextRequest) {
  const codigo = (request.nextUrl.searchParams.get("r") ?? "").toUpperCase();
  const sql = await db().catch(() => null);
  if (!sql) return NextResponse.json({ error: "No disponible." }, { status: 503 });

  const fila = await buscarCodigo(sql, codigo);
  const negocio = fila && getNegocio(fila.negocio);
  if (!fila || !negocio) return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });

  const programa = await programaDe(negocio.slug);
  if (!programa.activo) return NextResponse.json({ error: "El programa no está activo." }, { status: 404 });

  const avance = (await avances(sql, negocio.slug, programa.meta, [fila.telefono])).get(fila.telefono);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  return NextResponse.json({
    negocio: { slug: negocio.slug, nombre: negocio.nombre },
    quien: primerNombre(fila.nombre),
    premioRecomienda: programa.premioRecomienda,
    premioAmigo: programa.premioAmigo,
    meta: programa.meta,
    amigos: avance?.amigos ?? 0,
    disponibles: avance?.disponibles ?? 0,
    canjeados: avance?.canjeados ?? 0,
    link: linkInvitacion(base, negocio.slug, fila.codigo),
  });
}
