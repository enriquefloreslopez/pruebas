// Catálogo de la plataforma: ciudades, categorías y negocios.
// Para sumar un negocio nuevo basta con agregarlo a `negocios` (con su permiso).

export type Ciudad = {
  slug: string;
  nombre: string;
  estado: string;
  timeZone: string;
};

export type Categoria = {
  slug: string;
  nombre: string;
  singular: string;
  emoji: string;
  // Tipo de schema.org para que Google y los asistentes de IA entiendan el negocio.
  schemaType: string;
  descripcion: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  minutos: number;
  precio: number;
};

// Horario por día de la semana (0 = domingo). null = cerrado.
export type Horario = Record<number, [string, string] | null>;

export type Negocio = {
  slug: string;
  nombre: string;
  categoria: string;
  ciudad: string;
  // true para los negocios de ejemplo que se usan en demostraciones.
  demo?: boolean;
  descripcion: string;
  direccion: string;
  colonia: string;
  whatsapp: string;
  // Correo donde el negocio recibe el aviso de cada cita (opcional).
  email?: string;
  // Cuántas citas puede atender al mismo tiempo (sillas, cabinas, doctores).
  capacidad: number;
  // Cada cuántos minutos se ofrece un horario.
  intervalo: number;
  horario: Horario;
  servicios: Servicio[];
  destacados: string[];
};

export const ciudades: Ciudad[] = [
  { slug: "salamanca", nombre: "Salamanca", estado: "Guanajuato", timeZone: "America/Mexico_City" },
];

export const categorias: Categoria[] = [
  {
    slug: "barberias",
    nombre: "Barberías",
    singular: "Barbería",
    emoji: "💈",
    schemaType: "HairSalon",
    descripcion: "Cortes, fades, barba y afeitado clásico.",
  },
  {
    slug: "esteticas",
    nombre: "Estéticas",
    singular: "Estética",
    emoji: "💇‍♀️",
    schemaType: "BeautySalon",
    descripcion: "Corte, color, peinados y tratamientos.",
  },
  {
    slug: "unas",
    nombre: "Uñas",
    singular: "Salón de uñas",
    emoji: "💅",
    schemaType: "NailSalon",
    descripcion: "Manicure, pedicure, gelish y acrílico.",
  },
];

const lunesASabado = (abre: string, cierra: string, sabadoCierra = cierra): Horario => ({
  0: null,
  1: [abre, cierra],
  2: [abre, cierra],
  3: [abre, cierra],
  4: [abre, cierra],
  5: [abre, cierra],
  6: [abre, sabadoCierra],
});

export const negocios: Negocio[] = [
  {
    slug: "barberia-el-patron-demo",
    nombre: "Barbería El Patrón",
    categoria: "barberias",
    ciudad: "salamanca",
    demo: true,
    descripcion:
      "Barbería de ejemplo para mostrar cómo funciona la plataforma. Cortes clásicos y modernos, barba y afeitado con toalla caliente.",
    direccion: "Av. Juárez 120",
    colonia: "Centro",
    whatsapp: "524641011451",
    capacidad: 2,
    intervalo: 30,
    horario: lunesASabado("10:00", "20:00", "16:00"),
    servicios: [
      { id: "corte", nombre: "Corte clásico", minutos: 30, precio: 120 },
      { id: "fade", nombre: "Fade / degradado", minutos: 45, precio: 150 },
      { id: "barba", nombre: "Arreglo de barba", minutos: 30, precio: 90 },
      { id: "combo", nombre: "Corte + barba", minutos: 60, precio: 220 },
    ],
    destacados: ["Toalla caliente", "Estacionamiento cerca", "Pago con tarjeta"],
  },
  {
    slug: "estetica-bella-luna-demo",
    nombre: "Estética Bella Luna",
    categoria: "esteticas",
    ciudad: "salamanca",
    demo: true,
    descripcion: "Estética de ejemplo. Cortes, color y peinados con cita, sin esperas.",
    direccion: "Morelos 210",
    colonia: "Centro",
    whatsapp: "524641011451",
    capacidad: 1,
    intervalo: 60,
    horario: lunesASabado("10:00", "19:00", "15:00"),
    servicios: [
      { id: "corte", nombre: "Corte de cabello", minutos: 45, precio: 250 },
      { id: "tinte", nombre: "Tinte completo", minutos: 120, precio: 900 },
      { id: "peinado", nombre: "Peinado para evento", minutos: 60, precio: 550 },
    ],
    destacados: ["Productos profesionales", "Atención con cita"],
  },
];

export function getCiudad(slug: string) {
  return ciudades.find((c) => c.slug === slug);
}

export function getCategoria(slug: string) {
  return categorias.find((c) => c.slug === slug);
}

export function getNegocio(slug: string) {
  return negocios.find((n) => n.slug === slug);
}

export function negociosDe(ciudad: string, categoria: string) {
  return negocios.filter((n) => n.ciudad === ciudad && n.categoria === categoria);
}

// Combinaciones ciudad/categoría que tienen al menos un negocio.
export function seccionesActivas() {
  const vistas = new Set<string>();
  return negocios.flatMap((n) => {
    const clave = `${n.ciudad}/${n.categoria}`;
    if (vistas.has(clave)) return [];
    vistas.add(clave);
    return [{ ciudad: n.ciudad, categoria: n.categoria }];
  });
}
