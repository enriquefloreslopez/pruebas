import { NextResponse } from "next/server";
import { formatPrice, getPlan } from "@/lib/site";
import { emailFrom, getResend, getStripe, ownerEmail } from "@/lib/services";
import { escapeHtml } from "@/lib/validation";

// Stripe llama a esta ruta cuando alguien termina de pagar.
// Regístrala en Stripe > Developers > Webhooks con el evento checkout.session.completed.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma no válida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const plan = getPlan(session.metadata?.plan ?? "");
    const customer = session.customer_details;
    const resend = getResend();

    if (resend && ownerEmail) {
      const rows = [
        ["Plan", plan?.name ?? "Desconocido"],
        ["Monto", formatPrice((session.amount_total ?? 0) / 100)],
        ["Cliente", customer?.name ?? ""],
        ["Correo", customer?.email ?? ""],
        ["Teléfono", customer?.phone ?? ""],
      ];
      const { error } = await resend.emails.send({
        from: emailFrom,
        to: ownerEmail,
        subject: `Nueva venta: plan ${plan?.name ?? ""}`,
        html: `<h2>¡Nueva venta!</h2><ul>${rows
          .map(([label, value]) => `<li><b>${label}:</b> ${escapeHtml(value)}</li>`)
          .join("")}</ul>`,
      });
      if (error) console.error("No se pudo avisar de la venta", error);
    }
  }

  return NextResponse.json({ received: true });
}
