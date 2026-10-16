// Negocio ficticio para la demo que se enseña a los clientes potenciales.

export const demoBusiness = {
  name: "Estética Bella Luna",
  slogan: "Cortes, color y uñas con cita, sin esperas.",
  address: "Av. Juárez 120, Centro, Ciudad de México",
  timeZone: "America/Mexico_City",
  hours: [
    { days: "Lunes a viernes", time: "10:00 a 19:00" },
    { days: "Sábado", time: "10:00 a 15:00" },
    { days: "Domingo", time: "Cerrado" },
  ],
  services: [
    { id: "corte", name: "Corte de cabello", duration: "45 min", price: 250 },
    { id: "tinte", name: "Tinte completo", duration: "2 h", price: 900 },
    { id: "manicure", name: "Manicure gelish", duration: "1 h", price: 350 },
    { id: "pedicure", name: "Pedicure spa", duration: "1 h", price: 400 },
    { id: "peinado", name: "Peinado para evento", duration: "1 h", price: 550 },
  ],
  // Horarios que se ofrecen para reservar.
  weekdaySlots: ["10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00"],
  saturdaySlots: ["10:00", "11:00", "12:00", "13:00", "14:00"],
  maxDaysAhead: 60,
};

export type DemoService = (typeof demoBusiness.services)[number];

export function getService(id: string): DemoService | undefined {
  return demoBusiness.services.find((service) => service.id === id);
}

// Día de la semana (0 = domingo) de una fecha "YYYY-MM-DD".
export function dayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function slotsFor(date: string): string[] {
  const day = dayOfWeek(date);
  if (day === 0) return [];
  if (day === 6) return demoBusiness.saturdaySlots;
  return demoBusiness.weekdaySlots;
}

// Fecha de hoy en la zona horaria del negocio, como "YYYY-MM-DD".
export function todayInBusinessZone(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: demoBusiness.timeZone }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
