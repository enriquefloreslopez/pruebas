import "server-only";
import { randomInt } from "node:crypto";
import type postgres from "postgres";
import { REFERIDOS_VACIO, type ProgramaReferidos } from "@/lib/setup";
import { leerSetup } from "@/lib/setup-db";

// Sin letras ni números que se confundan (O/0, I/1).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nuevoCodigo() {
  return Array.from({ length: 7 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

export async function programaDe(negocio: string): Promise<ProgramaReferidos> {
  const setup = await leerSetup(negocio).catch(() => null);
  return setup?.referidos ?? REFERIDOS_VACIO;
}

// Devuelve el código personal de un cliente; lo crea la primera vez.
export async function codigoDe(sql: postgres.Sql, negocio: string, telefono: string, nombre: string): Promise<string> {
  for (let intento = 0; intento < 5; intento++) {
    const [fila] = await sql<{ codigo: string }[]>`
      insert into referidos (codigo, negocio, telefono, nombre)
      values (${nuevoCodigo()}, ${negocio}, ${telefono}, ${nombre})
      on conflict (negocio, telefono) do update set nombre = excluded.nombre
      returning codigo
    `.catch(() => []);
    if (fila) return fila.codigo;
  }
  throw new Error("No se pudo generar el código de recomendado.");
}

export async function buscarCodigo(sql: postgres.Sql, codigo: string) {
  if (!/^[A-Z2-9]{7}$/.test(codigo)) return null;
  const [fila] = await sql<{ codigo: string; negocio: string; telefono: string; nombre: string }[]>`
    select codigo, negocio, telefono, nombre from referidos where codigo = ${codigo}
  `;
  return fila ?? null;
}

export type Avance = {
  codigo: string;
  nombre: string;
  amigos: number;
  ganados: number;
  canjeados: number;
  disponibles: number;
};

// Un amigo cuenta cuando su PRIMERA visita atendida llegó con el código, y no es la misma persona.
export async function avances(sql: postgres.Sql | postgres.TransactionSql, negocio: string, meta: number, telefonos?: string[]) {
  const filas = await sql<{ codigo: string; telefono: string; nombre: string; amigos: number; canjeados: number }[]>`
    with primeras as (
      select distinct on (telefono) telefono, referido_por from citas
      where negocio = ${negocio} and tipo = 'cita' and estado = 'atendida' and telefono <> ''
      order by telefono, fecha, hora
    )
    select r.codigo, r.telefono, r.nombre,
      (select count(*)::int from primeras p where p.referido_por = r.codigo and p.telefono <> r.telefono) as amigos,
      (select count(*)::int from canjes c where c.negocio = r.negocio and c.telefono = r.telefono) as canjeados
    from referidos r
    where r.negocio = ${negocio} ${telefonos ? sql`and r.telefono in ${sql(telefonos)}` : sql``}
  `;
  return new Map<string, Avance>(
    filas.map((f) => {
      const ganados = Math.floor(f.amigos / meta);
      return [
        f.telefono,
        {
          codigo: f.codigo,
          nombre: f.nombre,
          amigos: f.amigos,
          ganados,
          canjeados: f.canjeados,
          disponibles: Math.max(0, ganados - f.canjeados),
        },
      ];
    }),
  );
}

export function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? "";
}

export function linkInvitacion(base: string, negocio: string, codigo: string) {
  return `${base}/n/${negocio}?ref=amigo&r=${codigo}`;
}
