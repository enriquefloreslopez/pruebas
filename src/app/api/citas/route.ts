import { NextResponse } from "next/server";
import { getNegocio } from "@/data/catalogo";
import { fechaValida, formatoFecha, horariosFuturos, limpiarOrigen } from "@/lib/agenda";
import { db } from "@/lib/db";
import { apartar } from "@/lib/reservas";
import { emailFrom, getResend, ownerEmail } from "@/lib/services";
import { formatPrice, whatsappLink } from "@/lib/site";
import { cleanPhone, cleanText, escapeHtml, isEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // Campo trampa contra bots.
  if (body?.website) return NextResponse.json({ ok: true });

  const negocio = getNegocio(cleanText(body?.negocio, 80));
  if (!negocio) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });

  const servicio = negocio.servicios.find((s) => s.id === body?.servicio);
  const fecha = cleanText(body?.fecha, 10);
  const hora = cleanText(body?.hora, 5);
  const cliente = cleanText(body?.nombre, 80);
  const telefono = cleanPhone(body?.telefono);
  const email = cleanText(body?.email, 254).toLowerCase();
  const origen = limpiarOrigen(body?.origen);

  const errores: string[] = [];
  if (!servicio) errores.push("Elige un servicio.");
  if (!fechaValida(negocio, fecha).ok || !horariosFuturos(negocio, fecha).includes(hora)) {
    errores.push("Elige una fecha y hora disponibles.");
  }
  if (cliente.length < 2) errores.push("Escribe tu nombre.");
  if (!telefono) errores.push("Escribe un WhatsApp de 10 dígitos.");
  if (email && !isEmail(email)) errores.push("El correo no es válido.");
  if (errores.length) return NextResponse.json({ error: errores.join(" ") }, { status: 400 });

  const sql = await db().catch((error) => {
    console.error("Base de datos no disponible", error);
    return null;
  });
  if (!sql) {
    return NextResponse.json(
      { error: "La agenda en línea no está disponible. Escríbenos por WhatsApp." },
      { status: 503 },
    );
  }

  const id = await apartar(sql, negocio, {
    servicio: servicio!,
    fecha,
    hora,
    cliente,
    telefono: telefono!,
    email: email || null,
    origen,
  });

  if (!id) {
    return NextResponse.json(
      { error: "Ese horario se acaba de ocupar. Elige otro, por favor." },
      { status: 409 },
    );
  }

  const cuando = `${formatoFecha(fecha)} a las ${hora}`;
  const resumen = `${servicio!.nombre} (${formatPrice(servicio!.precio)}) el ${cuando}`;
  await avisarPorCorreo({ negocioNombre: negocio.nombre, negocioEmail: negocio.email, resumen, cliente, telefono: telefono!, email, origen });

  return NextResponse.json({
    ok: true,
    id,
    resumen,
    whatsapp: whatsappLink(
      `Hola, soy ${cliente}. Aparté ${resumen} en ${negocio.nombre}. ¡Nos vemos!`,
      negocio.whatsapp,
    ),
  });
}

async function avisarPorCorreo(datos: {
  negocioNombre: string;
  negocioEmail?: string;
  resumen: string;
  cliente: string;
  telefono: string;
  email: string;
  origen: string;
}) {
  const resend = getResend();
  const destinos = [datos.negocioEmail, ownerEmail].filter((d): d is string => !!d);
  if (!resend || destinos.length === 0) return;

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: destinos,
    ...(datos.email && { replyTo: datos.email }),
    subject: `Nueva cita en ${datos.negocioNombre}`,
    html: `<h2>Nueva cita</h2><ul>
      <li><b>Cita:</b> ${escapeHtml(datos.resumen)}</li>
      <li><b>Cliente:</b> ${escapeHtml(datos.cliente)}</li>
      <li><b>WhatsApp:</b> ${escapeHtml(datos.telefono)}</li>
      ${datos.email ? `<li><b>Correo:</b> ${escapeHtml(datos.email)}</li>` : ""}
      <li><b>Llegó por:</b> ${escapeHtml(datos.origen)}</li>
    </ul>`,
  });
  if (error) console.error("No se pudo avisar de la cita", error);
}
