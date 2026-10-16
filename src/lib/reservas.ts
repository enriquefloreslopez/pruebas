import "server-only";
import type postgres from "postgres";
import type { Negocio, Servicio } from "@/data/catalogo";
import { horariosLibres, type Ocupante } from "@/lib/agenda";

export async function ocupantesDelDia(sql: postgres.Sql | postgres.TransactionSql, negocio: string, fecha: string) {
  return sql<Ocupante[]>`
    select hora, minutos, tipo, estado, servicio_id from citas
    where negocio = ${negocio} and fecha = ${fecha} and estado <> 'cancelada'
  `;
}

type DatosCita = {
  servicio: Servicio;
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  email: string | null;
  origen: string;
  estado?: "nueva" | "confirmada";
};

// Aparta una cita si el servicio completo cabe en ese horario. Devuelve el id o null si ya no hay lugar.
export async function apartar(sql: postgres.Sql, negocio: Negocio, datos: DatosCita): Promise<string | null> {
  return sql.begin(async (tx) => {
    // Un candado por negocio y día evita que dos personas aparten el mismo lugar a la vez.
    await tx`select pg_advisory_xact_lock(hashtext(${`${negocio.slug}|${datos.fecha}`}))`;
    const ocupantes = await ocupantesDelDia(tx, negocio.slug, datos.fecha);
    const libre = horariosLibres(negocio, datos.fecha, ocupantes, datos.servicio.minutos).find(
      (h) => h.hora === datos.hora,
    )?.libre;
    if (!libre) return null;
    const [fila] = await tx<{ id: string }[]>`
      insert into citas (negocio, servicio_id, servicio, precio, minutos, fecha, hora, cliente, telefono, email, origen, estado)
      values (${negocio.slug}, ${datos.servicio.id}, ${datos.servicio.nombre}, ${datos.servicio.precio},
              ${datos.servicio.minutos}, ${datos.fecha}, ${datos.hora}, ${datos.cliente}, ${datos.telefono},
              ${datos.email}, ${datos.origen}, ${datos.estado ?? "nueva"})
      returning id
    `;
    return fila.id;
  });
}

// Bloquea un horario (comida, día libre…): ocupa todos los lugares durante esos minutos.
export async function bloquear(
  sql: postgres.Sql,
  negocio: Negocio,
  datos: { fecha: string; hora: string; minutos: number; motivo: string },
): Promise<string> {
  const [fila] = await sql<{ id: string }[]>`
    insert into citas (negocio, servicio_id, servicio, precio, minutos, fecha, hora, cliente, telefono, origen, estado, tipo)
    values (${negocio.slug}, '_bloqueo', 'Bloqueo', 0, ${datos.minutos}, ${datos.fecha}, ${datos.hora},
            ${datos.motivo}, '', 'panel', 'confirmada', 'bloqueo')
    returning id
  `;
  return fila.id;
}
