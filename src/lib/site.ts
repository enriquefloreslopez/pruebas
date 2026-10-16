// Datos del emprendimiento. Cambia aquí el nombre, el contacto y los precios.

export const site = {
  name: "CitaLista",
  tagline: "Tu negocio en internet y tu agenda llena, sin complicaciones.",
  // Número de WhatsApp con código de país, solo dígitos (ej. 5213312345678).
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  currency: "mxn",
};

export type PlanId = "presencia" | "agenda" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  // Monto en pesos (sin centavos).
  price: number;
  interval: "unico" | "mes";
  features: string[];
  highlighted?: boolean;
};

export const plans: Plan[] = [
  {
    id: "presencia",
    name: "Presencia",
    description: "Para que tus clientes te encuentren en Google y te escriban.",
    price: 1990,
    interval: "unico",
    features: [
      "Página web adaptada a celular",
      "Botón directo a tu WhatsApp",
      "Alta y optimización en Google Maps",
      "Mapa, horarios y servicios",
      "Lista en 7 días",
    ],
  },
  {
    id: "agenda",
    name: "Agenda",
    description: "Tus clientes reservan solos, a cualquier hora.",
    price: 499,
    interval: "mes",
    highlighted: true,
    features: [
      "Todo lo de Presencia, sin pago inicial",
      "Agenda en línea las 24 horas",
      "Aviso por correo de cada nueva cita",
      "Confirmación de la cita por WhatsApp",
      "2 cambios al mes en tu página",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Agenda, seguridad y atención prioritaria.",
    price: 899,
    interval: "mes",
    features: [
      "Todo lo de Agenda",
      "Configuración de seguridad de tus cuentas",
      "WhatsApp Business verificado",
      "Guía para evitar fraudes en cobros",
      "Cambios ilimitados y soporte prioritario",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return plans.find((plan) => plan.id === id);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function whatsappLink(message: string, phone = site.whatsapp): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
