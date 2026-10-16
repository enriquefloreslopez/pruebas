import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Encabezado, JsonLd } from "@/components/Encabezado";
import { SiteFooter } from "@/components/SiteFooter";
import { getCategoria, getCiudad, negociosDe, seccionesActivas, type Negocio } from "@/data/catalogo";
import { formatPrice, site, siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return seccionesActivas();
}

async function cargar(params: PageProps<"/[ciudad]/[categoria]">["params"]) {
  const { ciudad: c, categoria: k } = await params;
  const ciudad = getCiudad(c);
  const categoria = getCategoria(k);
  const lista = negociosDe(c, k);
  if (!ciudad || !categoria || lista.length === 0) notFound();
  return { ciudad, categoria, lista };
}

export async function generateMetadata({ params }: PageProps<"/[ciudad]/[categoria]">): Promise<Metadata> {
  const { ciudad, categoria, lista } = await cargar(params);
  return {
    title: `${categoria.nombre} en ${ciudad.nombre} con precios y citas · ${site.name}`,
    description: `Compara ${categoria.nombre.toLowerCase()} en ${ciudad.nombre}, ${ciudad.estado}: precios, horarios, ubicación y aparta tu cita en línea.`,
    robots: lista.every((n) => n.demo) ? { index: false } : undefined,
  };
}

const desde = (n: Negocio) => Math.min(...n.servicios.map((s) => s.precio));

// Rango de precio por servicio entre todos los negocios de la sección.
function rangos(lista: Negocio[]) {
  const porServicio = new Map<string, number[]>();
  for (const n of lista) {
    for (const s of n.servicios) porServicio.set(s.nombre, [...(porServicio.get(s.nombre) ?? []), s.precio]);
  }
  return [...porServicio.entries()].map(([nombre, precios]) => ({
    nombre,
    min: Math.min(...precios),
    max: Math.max(...precios),
  }));
}

export default async function Seccion({ params }: PageProps<"/[ciudad]/[categoria]">) {
  const { ciudad, categoria, lista } = await cargar(params);
  const precios = rangos(lista);
  const domingo = lista.filter((n) => n.horario[0]);

  const faqs = [
    {
      q: `¿Cuánto cuesta en ${categoria.nombre.toLowerCase()} de ${ciudad.nombre}?`,
      a: precios
        .map((p) => `${p.nombre}: ${p.min === p.max ? formatPrice(p.min) : `${formatPrice(p.min)} a ${formatPrice(p.max)}`}`)
        .join(". "),
    },
    {
      q: `¿Hay ${categoria.nombre.toLowerCase()} abiertas en domingo en ${ciudad.nombre}?`,
      a: domingo.length
        ? `Sí: ${domingo.map((n) => n.nombre).join(", ")}.`
        : `En nuestra lista, ninguna abre en domingo. Aparta tu lugar de lunes a sábado.`,
    },
    {
      q: "¿Cómo aparto mi cita?",
      a: "Elige el negocio, el servicio, el día y la hora libre, y escribe tu nombre y WhatsApp. Es gratis y el negocio recibe tu cita al instante.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${categoria.nombre} en ${ciudad.nombre}`,
            itemListElement: lista.map((n, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${siteUrl()}/n/${n.slug}`,
              name: n.nombre,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
      <Encabezado />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>{" "}
          / {ciudad.nombre} / {categoria.nombre}
        </nav>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          {categoria.emoji} {categoria.nombre} en {ciudad.nombre}
        </h1>
        <p className="mt-2 text-stone-600">
          {categoria.descripcion} Ve precios y horarios libres, y aparta tu lugar en línea.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {lista.map((n) => (
            <li key={n.slug} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-stone-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{n.nombre}</h2>
                  <p className="text-sm text-stone-500">
                    {n.colonia} · desde {formatPrice(desde(n))}
                  </p>
                </div>
                {n.demo && (
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">Ejemplo</span>
                )}
              </div>
              <p className="mt-3 flex-1 text-stone-700">{n.descripcion}</p>
              <p className="mt-3 text-sm text-stone-600">
                {n.servicios.slice(0, 3).map((s) => s.nombre).join(" · ")}
              </p>
              <Link
                href={`/n/${n.slug}`}
                className="mt-5 rounded-full bg-teal-700 px-5 py-3 text-center font-semibold text-white hover:bg-teal-800"
              >
                Ver horarios y apartar
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
          <dl className="mt-6 space-y-5">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-stone-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
