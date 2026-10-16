import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { ENLACES, SETUP_VACIO, limpiarSetup, type SetupDatos } from "@/lib/setup";

export const etiquetaSetup = (negocio: string) => `setup-${negocio}`;

async function tabla() {
  const sql = await db();
  if (!sql) return null;
  await sql`
    create table if not exists setup (
      negocio text primary key,
      datos jsonb not null default '{}',
      actualizado timestamptz not null default now()
    )
  `;
  return sql;
}

export async function leerSetup(negocio: string): Promise<SetupDatos | null> {
  const sql = await tabla();
  if (!sql) return null;
  const [fila] = await sql<{ datos: unknown }[]>`select datos from setup where negocio = ${negocio}`;
  return fila ? limpiarSetup(fila.datos) : SETUP_VACIO;
}

export async function guardarSetup(negocio: string, datos: SetupDatos): Promise<boolean> {
  const sql = await tabla();
  if (!sql) return false;
  await sql`
    insert into setup (negocio, datos, actualizado) values (${negocio}, ${sql.json(datos)}, now())
    on conflict (negocio) do update set datos = excluded.datos, actualizado = now()
  `;
  return true;
}

// Perfiles públicos del negocio para la página pública (datos estructurados y botones).
// Se guardan en caché y se refrescan al guardar el setup.
export async function perfilesPublicos(negocio: string): Promise<SetupDatos["enlaces"]> {
  "use cache";
  cacheTag(etiquetaSetup(negocio));
  cacheLife("hours");
  try {
    // Si la base de datos no responde rápido, la página se publica sin perfiles.
    const setup = await Promise.race([
      leerSetup(negocio),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (!setup) return {};
    return Object.fromEntries(ENLACES.flatMap(({ id }) => (setup.enlaces[id] ? [[id, setup.enlaces[id]]] : [])));
  } catch {
    return {};
  }
}
