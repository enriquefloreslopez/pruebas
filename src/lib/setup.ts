// Setup de un negocio nuevo: pasos para Google, Bing, redes, reseñas y visibilidad en asistentes de IA.
import { getCategoria, getCiudad, type Negocio } from "@/data/catalogo";
import { formatPrice } from "@/lib/site";

export const ENLACES = [
  { id: "maps", nombre: "Google Maps (perfil)", ejemplo: "https://maps.app.goo.gl/…" },
  { id: "resenas", nombre: "Link para dejar reseña en Google", ejemplo: "https://g.page/r/…/review" },
  { id: "bing", nombre: "Bing Places", ejemplo: "https://www.bing.com/maps?…" },
  { id: "apple", nombre: "Apple Maps", ejemplo: "https://maps.apple.com/…" },
  { id: "facebook", nombre: "Facebook", ejemplo: "https://facebook.com/…" },
  { id: "instagram", nombre: "Instagram", ejemplo: "https://instagram.com/…" },
  { id: "tiktok", nombre: "TikTok", ejemplo: "https://tiktok.com/@…" },
] as const;

export type EnlaceId = (typeof ENLACES)[number]["id"];

export type PruebaIA = { fecha: string; asistente: string; consulta: string; aparece: boolean };

export type SetupDatos = {
  pasos: Record<string, boolean>;
  enlaces: Partial<Record<EnlaceId, string>>;
  pruebas: PruebaIA[];
};

export const SETUP_VACIO: SetupDatos = { pasos: {}, enlaces: {}, pruebas: [] };

export type Paso = { id: string; titulo: string; detalle: string; herramienta?: { texto: string; url: string } };
export type Seccion = { id: string; titulo: string; descripcion: string; pasos: Paso[] };

export const SECCIONES: Seccion[] = [
  {
    id: "google",
    titulo: "Perfil de Negocio de Google",
    descripcion: "Lo que la gente ve en Google Maps. También alimenta a Gemini y a Google AI Mode.",
    pasos: [
      {
        id: "google-perfil",
        titulo: "Crear o reclamar el perfil",
        detalle: "Busca el negocio en Google Maps. Si ya existe, reclámalo; si no, créalo con la ficha oficial.",
        herramienta: { texto: "Abrir Google Business", url: "https://business.google.com/" },
      },
      { id: "google-verificar", titulo: "Verificar el perfil", detalle: "Por video, llamada o carta, según lo que pida Google." },
      {
        id: "google-categoria",
        titulo: "Categoría principal y secundarias",
        detalle: "Usa la categoría sugerida en la ficha oficial. Agrega 1 o 2 secundarias relacionadas.",
      },
      {
        id: "google-servicios",
        titulo: "Servicios con precio",
        detalle: "Los mismos servicios y precios que en la plataforma. La IA cita precios concretos.",
      },
      { id: "google-horario", titulo: "Horario idéntico", detalle: "Copia el horario de la ficha oficial, sin cambiar nada." },
      {
        id: "google-fotos",
        titulo: "10 fotos reales o más",
        detalle: "Fachada (para que la encuentren), interior, equipo y trabajos terminados. Nada de fotos de internet.",
      },
      {
        id: "google-link",
        titulo: "Link de reservas y sitio web",
        detalle: "Pon el link con ?ref=google en «Sitio web» y en «Reservas» para medir lo que llega de Google.",
      },
      { id: "google-descripcion", titulo: "Descripción", detalle: "Pega la descripción para Google de la ficha oficial." },
      {
        id: "google-publicacion",
        titulo: "Primera publicación",
        detalle: "Una novedad u oferta con foto. Publicar seguido le dice a Google que el negocio está activo.",
      },
    ],
  },
  {
    id: "directorios",
    titulo: "Bing, Apple y directorios",
    descripcion: "Copilot usa Bing Places y varias fuentes indican que ChatGPT busca con Bing. Casi nadie lo da de alta.",
    pasos: [
      {
        id: "bing-places",
        titulo: "Bing Places",
        detalle: "Entra con la cuenta de Google del negocio e importa el perfil: toma 5 minutos.",
        herramienta: { texto: "Abrir Bing Places", url: "https://www.bingplaces.com/" },
      },
      {
        id: "apple-maps",
        titulo: "Apple Business Connect",
        detalle: "Para aparecer en Apple Maps y Siri en iPhone.",
        herramienta: { texto: "Abrir Apple Business", url: "https://businessconnect.apple.com/" },
      },
      {
        id: "nap-identico",
        titulo: "Mismos datos en todos lados",
        detalle: "Nombre, dirección, teléfono y horario idénticos a la ficha oficial en cada perfil y directorio.",
      },
    ],
  },
  {
    id: "redes",
    titulo: "Redes y WhatsApp",
    descripcion: "Cada red con su link medido, para saber de dónde llegan las citas.",
    pasos: [
      { id: "instagram-bio", titulo: "Instagram: link en la bio", detalle: "Usa el link con ?ref=instagram y la bio sugerida." },
      { id: "facebook-boton", titulo: "Facebook: botón «Reservar»", detalle: "Configura el botón con el link ?ref=facebook." },
      { id: "tiktok-bio", titulo: "TikTok: link en la bio", detalle: "Usa el link con ?ref=tiktok." },
      {
        id: "whatsapp-business",
        titulo: "WhatsApp Business",
        detalle: "Perfil con dirección, horario y link ?ref=whatsapp. Mensaje automático de bienvenida con el link para apartar.",
      },
    ],
  },
  {
    id: "resenas",
    titulo: "Reseñas",
    descripcion: "La señal que más pesa para Google y para los asistentes de IA. Solo reseñas reales.",
    pasos: [
      { id: "qr-mostrador", titulo: "QR de reseñas en el mostrador", detalle: "Imprime el QR de abajo y ponlo donde el cliente paga." },
      {
        id: "pedir-resena",
        titulo: "Pedir reseña a cada cliente atendido",
        detalle: "En la agenda, al marcar una cita como «Atendida» aparece el botón «Pedir reseña» por WhatsApp.",
      },
      { id: "meta-10", titulo: "Meta: 10 reseñas el primer mes", detalle: "Pide que mencionen el servicio: «el mejor fade», «puntuales»…" },
      { id: "responder", titulo: "Responder todas las reseñas", detalle: "En menos de 48 horas, buenas y malas. Google lo toma en cuenta." },
    ],
  },
  {
    id: "ia",
    titulo: "Visibilidad en asistentes de IA",
    descripcion:
      "ChatGPT, Gemini y Perplexity buscan en internet al momento y recomiendan negocios con datos consistentes y buenas reseñas. Nadie puede garantizar aparecer; esto sube las probabilidades.",
    pasos: [
      {
        id: "ia-prueba-inicial",
        titulo: "Prueba inicial",
        detalle: "Haz las consultas de prueba antes de empezar y anota si aparece. Es tu punto de partida.",
      },
      { id: "ia-revision-mensual", titulo: "Revisión mensual", detalle: "Repite las pruebas cada mes y compara." },
    ],
  },
];

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function horarioTexto(negocio: Negocio): string {
  const grupos: { dias: number[]; texto: string }[] = [];
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const r = negocio.horario[d];
    const texto = r ? `${r[0]}–${r[1]}` : "cerrado";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.dias.push(d);
    else grupos.push({ dias: [d], texto });
  }
  return grupos
    .map((g) => {
      const nombre = g.dias.length > 1 ? `${DIAS[g.dias[0]]}–${DIAS[g.dias[g.dias.length - 1]]}` : DIAS[g.dias[0]];
      return `${nombre} ${g.texto}`;
    })
    .join(", ");
}

export function telefonoBonito(whatsapp: string): string {
  const d = whatsapp.replace(/\D/g, "");
  const local = d.slice(-10);
  return `+52 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

const CATEGORIA_GOOGLE: Record<string, string> = {
  barberias: "Barbería",
  esteticas: "Salón de belleza",
  unas: "Salón de manicura y pedicura",
};

// Textos listos para copiar en Google, redes y mensajes.
export function fichaOficial(negocio: Negocio, base: string) {
  const ciudad = getCiudad(negocio.ciudad);
  const categoria = getCategoria(negocio.categoria);
  const link = `${base}/n/${negocio.slug}`;
  const desde = Math.min(...negocio.servicios.map((s) => s.precio));
  const servicios = negocio.servicios.map((s) => `${s.nombre} (${formatPrice(s.precio)})`).join(", ");
  const lugar = `${ciudad?.nombre ?? ""}, ${ciudad?.estado ?? ""}`;

  return {
    nombre: negocio.nombre,
    direccion: `${negocio.direccion}, ${negocio.colonia}, ${lugar}`,
    telefono: telefonoBonito(negocio.whatsapp),
    horario: horarioTexto(negocio),
    sitio: link,
    categoriaGoogle: CATEGORIA_GOOGLE[negocio.categoria] ?? categoria?.singular ?? "",
    descripcionGoogle: `${negocio.descripcion} Estamos en ${negocio.colonia}, ${lugar}. Servicios: ${servicios}. ${
      negocio.destacados.length ? `${negocio.destacados.join(", ")}. ` : ""
    }Horario: ${horarioTexto(negocio)}. Aparta tu cita en línea y sin esperas.`.slice(0, 750),
    bioInstagram: `${categoria?.emoji ?? ""} ${categoria?.singular ?? ""} en ${negocio.colonia}, ${ciudad?.nombre ?? ""}\n⏰ ${horarioTexto(
      negocio,
    ).split(",")[0]}\n💲 Desde ${formatPrice(desde)}\n👇 Aparta tu cita`.slice(0, 150),
    links: Object.fromEntries(
      ["google", "instagram", "facebook", "tiktok", "whatsapp", "qr"].map((canal) => [canal, `${link}?ref=${canal}`]),
    ) as Record<string, string>,
  };
}

export function mensajeResena(negocio: Negocio, cliente: string, link: string) {
  return `¡Gracias por venir a ${negocio.nombre}, ${cliente}! 🙌 ¿Nos ayudas con una reseña? Toma 30 segundos y nos ayuda muchísimo: ${link}`;
}

// Preguntas que la gente le hace a los asistentes de IA, para probar si el negocio aparece.
export function consultasIA(negocio: Negocio): string[] {
  const ciudad = getCiudad(negocio.ciudad);
  const categoria = getCategoria(negocio.categoria);
  const giro = categoria?.singular.toLowerCase() ?? "negocio";
  const lugar = `${ciudad?.nombre ?? ""}, ${ciudad?.estado ?? ""}`;
  const servicio = negocio.servicios[0]?.nombre.toLowerCase() ?? "";
  return [
    `¿Cuál es la mejor ${giro} en ${lugar}?`,
    `Recomiéndame una ${giro} en ${negocio.colonia}, ${ciudad?.nombre ?? ""}`,
    `¿Cuánto cuesta ${servicio} en ${ciudad?.nombre ?? ""}?`,
    `${categoria?.singular ?? ""} abierta el sábado en ${ciudad?.nombre ?? ""} donde pueda reservar en línea`,
  ];
}

export const ASISTENTES = [
  { id: "chatgpt", nombre: "ChatGPT", url: (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}` },
  { id: "perplexity", nombre: "Perplexity", url: (q: string) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
  { id: "google", nombre: "Google", url: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: "bing", nombre: "Bing / Copilot", url: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
] as const;

// Normaliza y valida lo que llega del formulario de setup.
export function limpiarSetup(entrada: unknown): SetupDatos {
  const e = (entrada ?? {}) as Partial<SetupDatos>;
  const idsPasos = new Set(SECCIONES.flatMap((s) => s.pasos.map((p) => p.id)));
  const pasos = Object.fromEntries(
    Object.entries(e.pasos ?? {}).filter(([id, v]) => idsPasos.has(id) && typeof v === "boolean"),
  );
  const enlaces = Object.fromEntries(
    ENLACES.flatMap(({ id }) => {
      const v = (e.enlaces as Record<string, unknown> | undefined)?.[id];
      return typeof v === "string" && /^https:\/\/[^\s<>"]{4,300}$/.test(v.trim()) ? [[id, v.trim()]] : [];
    }),
  );
  const pruebas = (Array.isArray(e.pruebas) ? e.pruebas : [])
    .filter(
      (p): p is PruebaIA =>
        !!p &&
        typeof p.fecha === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(p.fecha) &&
        typeof p.asistente === "string" &&
        typeof p.consulta === "string" &&
        typeof p.aparece === "boolean",
    )
    .slice(-100)
    .map((p) => ({ ...p, asistente: p.asistente.slice(0, 30), consulta: p.consulta.slice(0, 200) }));
  return { pasos, enlaces, pruebas };
}
