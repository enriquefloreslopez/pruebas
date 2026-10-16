import { NextResponse } from "next/server";
import { getResend } from "@/lib/services";
import { cleanText, isEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Campo trampa: los bots lo llenan, las personas no lo ven.
  if (body?.website) return NextResponse.json({ ok: true });

  const email = cleanText(body?.email, 254).toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { error: "El boletín aún no está configurado." },
      { status: 503 },
    );
  }

  const segmentId = process.env.RESEND_SEGMENT_ID;
  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...(segmentId && { segments: [{ id: segmentId }] }),
  });

  if (error) {
    console.error("No se pudo guardar el contacto", error);
    return NextResponse.json(
      { error: "No pudimos registrarte. Intenta de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
