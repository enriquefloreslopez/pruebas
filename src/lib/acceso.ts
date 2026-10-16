import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Llave del panel de cada negocio: se deriva de PANEL_SECRET, así no hay que guardarla.
export function llavePanel(negocio: string): string | null {
  const secreto = process.env.PANEL_SECRET;
  if (!secreto) return null;
  return createHmac("sha256", secreto).update(negocio).digest("base64url").slice(0, 24);
}

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function puedeVerPanel(negocio: string, llave: unknown): boolean {
  const esperada = llavePanel(negocio);
  return !!esperada && typeof llave === "string" && iguales(esperada, llave);
}

export function esAdmin(llave: unknown): boolean {
  const esperada = process.env.ADMIN_KEY;
  return !!esperada && typeof llave === "string" && iguales(esperada, llave);
}
