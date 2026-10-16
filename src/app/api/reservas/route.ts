import { NextResponse } from "next/server";
import {
  addDays,
  demoBusiness,
  formatDate,
  getService,
  slotsFor,
  todayInBusinessZone,
} from "@/lib/demo";
import { formatPrice, whatsappLink } from "@/lib/site";
import { emailFrom, getResend, ownerEmail } from "@/lib/services";
import { cleanPhone, cleanText, escapeHtml, isEmail } from "@/lib/validation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Campo trampa contra bots.
  if (body?.website) return NextResponse.json({ ok: true });

  const name = cleanText(body?.name, 80);
  const phone = cleanPhone(body?.phone);
  const email = cleanText(body?.email, 254).toLowerCase();
  const service = getService(cleanText(body?.service, 40));
  const date = cleanText(body?.date, 10);
  const time = cleanText(body?.time, 5);

  const today = todayInBusinessZone();
  const errors: string[] = [];
  if (name.length < 2) errors.push("Escribe tu nombre.");
  if (!phone) errors.push("Escribe un teléfono de 10 dígitos.");
  if (email && !isEmail(email)) errors.push("El correo no es válido.");
  if (!service) errors.push("Elige un servicio.");
  if (!DATE_RE.test(date) || date < today || date > addDays(today, demoBusiness.maxDaysAhead)) {
    errors.push("Elige una fecha válida.");
  } else if (!slotsFor(date).includes(time)) {
    errors.push("Elige un horario disponible.");
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const when = `${formatDate(date)} a las ${time}`;
  const summary = `${service!.name} (${formatPrice(service!.price)}) el ${when}`;
  const confirmUrl = whatsappLink(
    `Hola, soy ${name}. Acabo de reservar ${summary} en ${demoBusiness.name}. ¿Me confirman?`,
  );

  const resend = getResend();
  let emailSent = false;
  if (resend) {
    const details = `<ul>
      <li><b>Servicio:</b> ${escapeHtml(service!.name)}</li>
      <li><b>Fecha:</b> ${escapeHtml(when)}</li>
      <li><b>Cliente:</b> ${escapeHtml(name)}</li>
      <li><b>Teléfono:</b> ${escapeHtml(phone!)}</li>
      ${email ? `<li><b>Correo:</b> ${escapeHtml(email)}</li>` : ""}
    </ul>`;

    const sends = [];
    if (ownerEmail) {
      sends.push(
        resend.emails.send({
          from: emailFrom,
          to: ownerEmail,
          ...(email && { replyTo: email }),
          subject: `Nueva cita: ${service!.name}, ${when}`,
          html: `<h2>Nueva cita en ${escapeHtml(demoBusiness.name)}</h2>${details}`,
        }),
      );
    }
    if (email) {
      sends.push(
        resend.emails.send({
          from: emailFrom,
          to: email,
          subject: `Tu cita en ${demoBusiness.name}`,
          html: `<h2>¡Gracias, ${escapeHtml(name)}!</h2>
            <p>Recibimos tu solicitud de cita. Te confirmaremos por WhatsApp.</p>${details}
            <p>${escapeHtml(demoBusiness.address)}</p>`,
        }),
      );
    }

    const results = await Promise.allSettled(sends);
    emailSent = results.length > 0 && results.every(
      (result) => result.status === "fulfilled" && !result.value.error,
    );
    if (!emailSent) console.error("Fallo al enviar correos de la cita", results);
  }

  return NextResponse.json({ ok: true, summary, confirmUrl, emailSent });
}
