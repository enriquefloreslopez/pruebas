import "server-only";
import postgres from "postgres";
import type { Estado } from "@/lib/agenda";

export type Cita = {
  id: string;
  negocio: string;
  servicio_id: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  email: string | null;
  estado: Estado;
  origen: string;
  minutos: number | null;
  tipo: "cita" | "bloqueo";
  creada: string;
};

let sql: postgres.Sql | null = null;
let esquema: Promise<unknown> | null = null;

function conexion(): postgres.Sql | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) return null;
  sql ??= postgres(url, {
    max: 3,
    idle_timeout: 20,
    // Las fechas se manejan como texto "YYYY-MM-DD" para evitar cambios de zona horaria.
    types: { date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x } },
  });
  return sql;
}

// Devuelve la conexión con la tabla lista, o null si no hay base de datos configurada.
export async function db(): Promise<postgres.Sql | null> {
  const s = conexion();
  if (!s) return null;
  esquema ??= s`
    create table if not exists citas (
      id uuid primary key default gen_random_uuid(),
      negocio text not null,
      servicio_id text not null,
      servicio text not null,
      precio integer not null,
      fecha date not null,
      hora text not null,
      cliente text not null,
      telefono text not null,
      email text,
      estado text not null default 'nueva',
      origen text not null default 'directo',
      creada timestamptz not null default now(),
      actualizada timestamptz not null default now()
    );
    create index if not exists citas_negocio_fecha on citas (negocio, fecha);
    alter table citas add column if not exists minutos integer;
    alter table citas add column if not exists tipo text not null default 'cita';
  `.simple().catch((error) => {
    esquema = null;
    throw error;
  });
  await esquema;
  return s;
}

export const SELECT_CITA = `id, negocio, servicio_id, servicio, precio, fecha, hora, cliente,
  telefono, email, estado, origen, minutos, tipo, creada`;
