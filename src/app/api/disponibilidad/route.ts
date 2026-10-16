import { NextResponse, type NextRequest } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { fechaValida, horariosFuturos } from "@/lib/agenda";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const negocio = getNegocio(request.nextUrl.searchParams.get("negocio") ?? "");
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  if (!negocio) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
  if (!fechaValida(negocio, fecha).ok) {
    return NextResponse.json({ error: "Fecha no válida." }, { status: 400 });
  }

  const horas = horariosFuturos(negocio, fecha);
  const sql = await db().catch(() => null);
  if (!sql) return NextResponse.json({ enLinea: false, horas: [] });

  const ocupadas = await sql<{ hora: string; total: number }[]>`
    select hora, count(*)::int as total from citas
    where negocio = ${negocio.slug} and fecha = ${fecha} and estado <> 'cancelada'
    group by hora
  `;
  const porHora = new Map(ocupadas.map((r) => [r.hora, r.total]));
  return NextResponse.json({
    enLinea: true,
    horas: horas.map((hora) => ({ hora, libre: (porHora.get(hora) ?? 0) < negocio.capacidad })),
  });
}
