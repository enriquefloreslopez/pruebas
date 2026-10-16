import "server-only";
import Stripe from "stripe";
import { Resend } from "resend";

let stripe: Stripe | null = null;
let resend: Resend | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe ??= new Stripe(key);
  return stripe;
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend ??= new Resend(key);
  return resend;
}

// Remitente de los correos. Con "onboarding@resend.dev" Resend solo entrega
// a tu propio correo; para enviar a clientes verifica tu dominio en Resend.
export const emailFrom = process.env.RESEND_FROM_EMAIL ?? "CitaLista <onboarding@resend.dev>";

// Correo del dueño, donde llegan avisos de citas y de ventas.
export const ownerEmail = process.env.OWNER_EMAIL ?? "";
