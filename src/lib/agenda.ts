import type { Negocio } from "@/data/catalogo";
import { getCiudad } from "@/data/catalogo";

export const ESTADOS = ["nueva", "confirmada", "atendida", "no_llego", "cancelada"] as const;
export type Estado = (typeof ESTADOS)[number];

export const DIAS_MAXIMOS = 30;

export function zonaDe(negocio: Negocio): string {
  return getCiudad(negocio.ciudad)?.timeZone ?? "America/Mexico_City";
}

// Fecha ("YYYY-MM-DD") y minutos desde medianoche en la zona horaria del negocio.
export function ahoraEn(timeZone: string, now = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,
    minutos: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

export const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const aHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Horarios que el negocio ofrece en una fecha, sin considerar ocupación.
export function horariosDelDia(negocio: Negocio, fecha: string): string[] {
  const rango = negocio.horario[diaSemana(fecha)];
  if (!rango) return [];
  const [abre, cierra] = rango.map(aMinutos);
  const horas: string[] = [];
  for (let m = abre; m + negocio.intervalo <= cierra; m += negocio.intervalo) {
    horas.push(aHora(m));
  }
  return horas;
}

// Valida que la fecha esté entre hoy y el máximo permitido; devuelve hoy y los minutos actuales.
export function fechaValida(negocio: Negocio, fecha: string) {
  const ahora = ahoraEn(zonaDe(negocio));
  const ok =
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    fecha >= ahora.fecha &&
    fecha <= sumarDias(ahora.fecha, DIAS_MAXIMOS);
  return { ok, ahora };
}

// Quita los horarios de hoy que ya pasaron (con 30 minutos de margen).
export function horariosFuturos(negocio: Negocio, fecha: string): string[] {
  const { ahora } = fechaValida(negocio, fecha);
  const horas = horariosDelDia(negocio, fecha);
  if (fecha !== ahora.fecha) return horas;
  return horas.filter((h) => aMinutos(h) >= ahora.minutos + 30);
}

// Lo mínimo que hace falta saber de una cita o bloqueo para calcular la ocupación.
export type Ocupante = {
  hora: string;
  minutos: number | null;
  tipo: string;
  estado: string;
  servicio_id: string;
};

export function duracionDe(negocio: Negocio, o: Pick<Ocupante, "minutos" | "servicio_id">): number {
  return o.minutos ?? negocio.servicios.find((s) => s.id === o.servicio_id)?.minutos ?? negocio.intervalo;
}

// Cuántos lugares están ocupados en cada horario del día. Un bloqueo ocupa todos los lugares.
export function ocupacionDelDia(negocio: Negocio, fecha: string, ocupantes: Ocupante[]): Map<string, number> {
  const horas = horariosDelDia(negocio, fecha);
  const ocupacion = new Map(horas.map((h) => [h, 0]));
  for (const o of ocupantes) {
    if (o.estado === "cancelada") continue;
    const ini = aMinutos(o.hora);
    const fin = ini + duracionDe(negocio, o);
    const peso = o.tipo === "bloqueo" ? negocio.capacidad : 1;
    for (const h of horas) {
      const m = aMinutos(h);
      if (m < fin && m + negocio.intervalo > ini) ocupacion.set(h, ocupacion.get(h)! + peso);
    }
  }
  return ocupacion;
}

// Para cada horario, si cabe un servicio de `minutos` sin pasar la capacidad ni la hora de cierre.
export function horariosLibres(negocio: Negocio, fecha: string, ocupantes: Ocupante[], minutos: number) {
  const rango = negocio.horario[diaSemana(fecha)];
  if (!rango) return [];
  const cierre = aMinutos(rango[1]);
  const ocupacion = ocupacionDelDia(negocio, fecha, ocupantes);
  const horas = [...ocupacion.keys()];
  return horas.map((hora) => {
    const ini = aMinutos(hora);
    const libre =
      ini + minutos <= cierre &&
      horas
        .filter((h) => aMinutos(h) >= ini && aMinutos(h) < ini + minutos)
        .every((h) => ocupacion.get(h)! < negocio.capacidad);
    return { hora, libre };
  });
}

export function formatoFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
}

// Normaliza el canal de origen (?ref= o utm_source) a un valor corto y seguro.
export function limpiarOrigen(valor: unknown): string {
  if (typeof valor !== "string") return "directo";
  const limpio = valor.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
  return limpio || "directo";
}
