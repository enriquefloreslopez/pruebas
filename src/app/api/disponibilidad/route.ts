import { NextResponse, type NextRequest } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { fechaValida, horariosFuturos, horariosLibres } from "@/lib/agenda";
import { db } from "@/lib/db";
import { ocupantesDelDia } from "@/lib/reservas";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const negocio = getNegocio(params.get("negocio") ?? "");
  const fecha = params.get("fecha") ?? "";
  if (!negocio) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
  if (!fechaValida(negocio, fecha).ok) {
    return NextResponse.json({ error: "Fecha no válida." }, { status: 400 });
  }

  const sql = await db().catch(() => null);
  if (!sql) return NextResponse.json({ enLinea: false, horas: [] });

  const servicio = negocio.servicios.find((s) => s.id === params.get("servicio"));
  const minutos = servicio?.minutos ?? negocio.intervalo;
  const futuras = new Set(horariosFuturos(negocio, fecha));
  const ocupantes = await ocupantesDelDia(sql, negocio.slug, fecha);
  return NextResponse.json({
    enLinea: true,
    horas: horariosLibres(negocio, fecha, ocupantes, minutos).filter((h) => futuras.has(h.hora)),
  });
}
