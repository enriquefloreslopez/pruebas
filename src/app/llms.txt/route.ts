import { categorias, ciudades, getCategoria, getCiudad, negocios } from "@/data/catalogo";
import { horarioTexto } from "@/lib/setup";
import { formatPrice, site, siteUrl } from "@/lib/site";

// Resumen del sitio en texto plano para asistentes de IA (formato llms.txt).
export function GET() {
  const base = siteUrl();
  const reales = negocios.filter((n) => !n.demo);
  const lineas = [
    `# ${site.name}`,
    "",
    `> Directorio de negocios locales con citas en línea: ${categorias.map((c) => c.nombre.toLowerCase()).join(", ")} en ${ciudades
      .map((c) => `${c.nombre}, ${c.estado}`)
      .join("; ")}. Cada negocio muestra servicios con precio, horario, ubicación y horarios libres para apartar.`,
    "",
    "## Negocios",
    "",
    ...(reales.length
      ? reales.flatMap((n) => {
          const ciudad = getCiudad(n.ciudad);
          return [
            `### ${n.nombre}`,
            `- Tipo: ${getCategoria(n.categoria)?.singular ?? n.categoria}`,
            `- Dirección: ${n.direccion}, ${n.colonia}, ${ciudad?.nombre}, ${ciudad?.estado}`,
            `- Horario: ${horarioTexto(n)}`,
            `- Servicios: ${n.servicios.map((s) => `${s.nombre} ${formatPrice(s.precio)}`).join("; ")}`,
            `- Destacados: ${n.destacados.join(", ")}`,
            `- Citas en línea: ${base}/n/${n.slug}`,
            "",
          ];
        })
      : ["Próximamente.", ""]),
    "## Secciones",
    "",
    ...ciudades.flatMap((c) =>
      categorias
        .filter((k) => reales.some((n) => n.ciudad === c.slug && n.categoria === k.slug))
        .map((k) => `- [${k.nombre} en ${c.nombre}](${base}/${c.slug}/${k.slug})`),
    ),
  ];
  return new Response(lineas.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
