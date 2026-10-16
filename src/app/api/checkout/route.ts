import { NextResponse } from "next/server";
import { getPlan, site } from "@/lib/site";
import { getStripe } from "@/lib/services";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Los pagos aún no están configurados." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const plan = getPlan(body?.plan);
  if (!plan) {
    return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const isSubscription = plan.interval === "mes";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      locale: "es",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: site.currency,
            unit_amount: plan.price * 100,
            product_data: { name: `${site.name} · Plan ${plan.name}` },
            ...(isSubscription && { recurring: { interval: "month" as const } }),
          },
        },
      ],
      // En pagos únicos Stripe no crea cliente por defecto; lo pedimos para tener su correo.
      ...(!isSubscription && { customer_creation: "always" as const }),
      phone_number_collection: { enabled: true },
      metadata: { plan: plan.id },
      success_url: `${origin}/gracias`,
      cancel_url: `${origin}/#precios`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error al crear la sesión de Stripe", error);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
