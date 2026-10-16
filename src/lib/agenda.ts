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

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const aHora = (minutos: number) =>
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
