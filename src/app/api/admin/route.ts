import { NextResponse, type NextRequest } from "next/server";
import { negocios } from "@/data/catalogo";
import { esAdmin, llavePanel } from "@/lib/acceso";
import { db, SELECT_CITA, type Cita } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!esAdmin(request.nextUrl.searchParams.get("k"))) {
    return NextResponse.json({ error: "Acceso no válido." }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const paneles = negocios.map((n) => {
    const llave = llavePanel(n.slug);
    return {
      slug: n.slug,
      nombre: n.nombre,
      demo: !!n.demo,
      panel: llave ? `${origin}/panel/${n.slug}?k=${llave}` : null,
    };
  });

  const sql = await db();
  if (!sql) return NextResponse.json({ paneles, citas: [], configurada: false });

  const citas = await sql<Cita[]>`
    select ${sql.unsafe(SELECT_CITA)} from citas
    where creada > now() - interval '60 days' and tipo = 'cita'
    order by creada desc
    limit 500
  `;
  return NextResponse.json({ paneles, citas, configurada: true });
}
