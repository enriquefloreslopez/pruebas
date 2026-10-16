import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getNegocio, type Negocio } from "@/data/catalogo";
import { esAdmin, llavePanel } from "@/lib/acceso";
import { db } from "@/lib/db";
import { consultasIA, fichaOficial, limpiarSetup, type SetupDatos } from "@/lib/setup";
import { etiquetaSetup, guardarSetup, leerSetup } from "@/lib/setup-db";
import { siteUrl } from "@/lib/site";

type Chequeo = { id: string; texto: string; ok: boolean; ayuda: string };

// Revisiones automáticas: lo que la plataforma puede comprobar por sí sola.
function chequeos(negocio: Negocio, setup: SetupDatos, baseLista: boolean): Chequeo[] {
  const perfiles = (["maps", "bing", "apple", "facebook", "instagram", "tiktok"] as const).filter(
    (id) => setup.enlaces[id],
  ).length;
  const conPrecio = negocio.servicios.filter((s) => s.precio > 0).length;
  return [
    {
      id: "descripcion",
      texto: "Descripción de 120 caracteres o más",
      ok: negocio.descripcion.length >= 120,
      ayuda: "Una buena descripción dice qué hacen, para quién y qué los distingue. La IA la usa para recomendar.",
    },
    {
      id: "servicios",
      texto: "3 servicios o más con precio",
      ok: conPrecio >= 3,
      ayuda: "Las preguntas de precio («¿cuánto cuesta un fade?») son de las más comunes.",
    },
    {
      id: "direccion",
      texto: "Dirección con colonia",
      ok: !!negocio.direccion && !!negocio.colonia,
      ayuda: "La gente pregunta por zona: «barbería en el centro».",
    },
    { id: "whatsapp", texto: "WhatsApp del negocio", ok: /^\d{12,13}$/.test(negocio.whatsapp), ayuda: "Con código de país." },
    {
      id: "correo",
      texto: "Correo para avisos de citas",
      ok: !!negocio.email,
      ayuda: "Opcional: el panel ya muestra las citas en vivo.",
    },
    {
      id: "publica",
      texto: "Página pública e indexable",
      ok: !negocio.demo,
      ayuda: "Los negocios de ejemplo no se muestran a Google. Quita «demo» al dar de alta un negocio real.",
    },
    {
      id: "schema",
      texto: "Datos estructurados para Google e IA",
      ok: true,
      ayuda: "La página ya incluye tipo de negocio, dirección, horario y servicios con precio.",
    },
    {
      id: "perfiles",
      texto: "2 perfiles enlazados o más",
      ok: perfiles >= 2,
      ayuda: "Enlazar Google Maps, Bing y redes le confirma a la IA que es el mismo negocio en todos lados.",
    },
    {
      id: "resenas",
      texto: "Link de reseñas capturado",
      ok: !!setup.enlaces.resenas,
      ayuda: "Activa el botón «Pedir reseña» en la agenda y el QR del mostrador.",
    },
    { id: "base", texto: "Agenda en línea activa", ok: baseLista, ayuda: "Falta conectar la base de datos en Vercel." },
    { id: "panel", texto: "Panel del negocio listo", ok: !!llavePanel(negocio.slug), ayuda: "Falta PANEL_SECRET en Vercel." },
  ];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const negocio = getNegocio(params.get("negocio") ?? "");
  if (!negocio || !esAdmin(params.get("k"))) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }
  const setup = await leerSetup(negocio.slug).catch(() => null);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin ?? siteUrl();
  const llave = llavePanel(negocio.slug);
  return NextResponse.json({
    guardable: setup !== null,
    datos: setup ?? { pasos: {}, enlaces: {}, pruebas: [] },
    chequeos: chequeos(negocio, setup ?? { pasos: {}, enlaces: {}, pruebas: [] }, !!(await db().catch(() => null))),
    ficha: fichaOficial(negocio, base),
    consultas: consultasIA(negocio),
    panel: llave ? `${base}/panel/${negocio.slug}?k=${llave}` : null,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const negocio = getNegocio(typeof body?.negocio === "string" ? body.negocio : "");
  if (!negocio || !esAdmin(body?.k)) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }
  const datos = limpiarSetup(body?.datos);
  const ok = await guardarSetup(negocio.slug, datos).catch(() => false);
  if (!ok) return NextResponse.json({ error: "Falta conectar la base de datos." }, { status: 503 });
  // La página pública del negocio toma los perfiles nuevos en la siguiente visita.
  revalidateTag(etiquetaSetup(negocio.slug), { expire: 0 });
  return NextResponse.json({ ok: true, datos });
}
