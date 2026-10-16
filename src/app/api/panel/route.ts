import { NextResponse, type NextRequest } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { ahoraEn, ESTADOS, horariosDelDia, sumarDias, zonaDe, type Estado } from "@/lib/agenda";
import { puedeVerPanel } from "@/lib/acceso";
import { db, SELECT_CITA, type Cita } from "@/lib/db";
import { apartar, bloquear } from "@/lib/reservas";
import { cleanPhone, cleanText } from "@/lib/validation";

// Citas del negocio desde hace 7 días hasta 30 días adelante, y visitas atendidas por cliente.
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("negocio") ?? "";
  const negocio = getNegocio(slug);
  if (!negocio || !puedeVerPanel(slug, request.nextUrl.searchParams.get("k"))) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }

  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Base de datos no configurada." }, { status: 503 });

  const hoy = ahoraEn(zonaDe(negocio)).fecha;
  const [citas, visitas] = await Promise.all([
    sql<Cita[]>`
      select ${sql.unsafe(SELECT_CITA)} from citas
      where negocio = ${slug} and fecha between ${sumarDias(hoy, -7)} and ${sumarDias(hoy, 30)}
      order by fecha, hora, creada
    `,
    sql<{ telefono: string; total: number }[]>`
      select telefono, count(*)::int as total from citas
      where negocio = ${slug} and tipo = 'cita' and estado = 'atendida' and telefono <> ''
      group by telefono
    `,
  ]);
  return NextResponse.json({
    hoy,
    citas,
    visitas: Object.fromEntries(visitas.map((v) => [v.telefono, v.total])),
  });
}

// Alta desde el panel: una cita de mostrador o teléfono, o un bloqueo de horario.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.negocio === "string" ? body.negocio : "";
  const negocio = getNegocio(slug);
  if (!negocio || !puedeVerPanel(slug, body?.k)) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }

  const fecha = cleanText(body?.fecha, 10);
  const hora = cleanText(body?.hora, 5);
  const hoy = ahoraEn(zonaDe(negocio)).fecha;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoy || fecha > sumarDias(hoy, 30)) {
    return NextResponse.json({ error: "Elige una fecha entre hoy y los próximos 30 días." }, { status: 400 });
  }
  if (!horariosDelDia(negocio, fecha).includes(hora)) {
    return NextResponse.json({ error: "Ese horario está fuera del horario del negocio." }, { status: 400 });
  }

  const sql = await db();
  if (!sql) return NextResponse.json({ error: "Base de datos no configurada." }, { status: 503 });

  if (body?.tipo === "bloqueo") {
    const minutos = Number(body?.minutos);
    if (!Number.isInteger(minutos) || minutos < negocio.intervalo || minutos > 16 * 60) {
      return NextResponse.json({ error: "Duración no válida." }, { status: 400 });
    }
    const motivo = cleanText(body?.motivo, 40) || "Bloqueado";
    const id = await bloquear(sql, negocio, { fecha, hora, minutos, motivo });
    return NextResponse.json({ ok: true, id });
  }

  const servicio = negocio.servicios.find((s) => s.id === body?.servicio);
  const cliente = cleanText(body?.nombre, 80);
  const telefono = body?.telefono ? cleanPhone(body.telefono) : "";
  if (!servicio || cliente.length < 2 || telefono === null) {
    return NextResponse.json({ error: "Revisa el servicio, el nombre y el teléfono." }, { status: 400 });
  }
  const id = await apartar(sql, negocio, {
    servicio,
    fecha,
    hora,
    cliente,
    telefono,
    email: null,
    origen: body?.origen === "telefono" ? "telefono" : "mostrador",
    estado: "confirmada",
  });
  if (!id) {
    return NextResponse.json({ error: "No hay lugar en ese horario para ese servicio." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id });
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
