import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Encabezado, JsonLd } from "@/components/Encabezado";
import { Reservar } from "@/components/Reservar";
import { SiteFooter } from "@/components/SiteFooter";
import { getCategoria, getCiudad, getNegocio, negocios } from "@/data/catalogo";
import { zonaDe } from "@/lib/agenda";
import { formatPrice, site, whatsappLink } from "@/lib/site";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SCHEMA_DIAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function generateStaticParams() {
  return negocios.map((n) => ({ slug: n.slug }));
}

async function cargar(params: PageProps<"/n/[slug]">["params"]) {
  const negocio = getNegocio((await params).slug);
  const ciudad = negocio && getCiudad(negocio.ciudad);
  const categoria = negocio && getCategoria(negocio.categoria);
  if (!negocio || !ciudad || !categoria) notFound();
  return { negocio, ciudad, categoria };
}

export async function generateMetadata({ params }: PageProps<"/n/[slug]">): Promise<Metadata> {
  const { negocio, ciudad, categoria } = await cargar(params);
  return {
    title: `${negocio.nombre}: ${categoria.singular.toLowerCase()} en ${ciudad.nombre} · Aparta tu cita`,
    description: `${negocio.descripcion} ${negocio.direccion}, ${negocio.colonia}, ${ciudad.nombre}. Precios desde ${formatPrice(
      Math.min(...negocio.servicios.map((s) => s.precio)),
    )}.`,
    robots: negocio.demo ? { index: false } : undefined,
  };
}

export default async function PaginaNegocio({ params }: PageProps<"/n/[slug]">) {
  const { negocio, ciudad, categoria } = await cargar(params);
  const direccion = `${negocio.direccion}, ${negocio.colonia}, ${ciudad.nombre}, ${ciudad.estado}`;
  const mapa = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": categoria.schemaType,
          name: negocio.nombre,
          description: negocio.descripcion,
          telephone: `+${negocio.whatsapp}`,
          address: {
            "@type": "PostalAddress",
            streetAddress: negocio.direccion,
            addressLocality: ciudad.nombre,
            addressRegion: ciudad.estado,
            addressCountry: "MX",
          },
          priceRange: `${formatPrice(Math.min(...negocio.servicios.map((s) => s.precio)))} - ${formatPrice(
            Math.max(...negocio.servicios.map((s) => s.precio)),
          )}`,
          openingHoursSpecification: Object.entries(negocio.horario)
            .filter(([, rango]) => rango)
            .map(([dia, rango]) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: SCHEMA_DIAS[Number(dia)],
              opens: rango![0],
              closes: rango![1],
            })),
          makesOffer: negocio.servicios.map((s) => ({
            "@type": "Offer",
            price: s.precio,
            priceCurrency: "MXN",
            itemOffered: { "@type": "Service", name: s.nombre },
          })),
        }}
      />
      <Encabezado />
      {negocio.demo && (
        <div className="bg-stone-900 px-4 py-2 text-center text-sm text-white">
          Negocio de ejemplo para mostrar cómo funciona {site.name}.
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>{" "}
          /{" "}
          <Link href={`/${ciudad.slug}/${categoria.slug}`} className="hover:underline">
            {categoria.nombre} en {ciudad.nombre}
          </Link>
        </nav>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">
              {categoria.singular} · {negocio.colonia}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{negocio.nombre}</h1>
            <p className="mt-3 text-stone-700">{negocio.descripcion}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {negocio.destacados.map((d) => (
                <li key={d} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-stone-200">
                  {d}
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg font-bold">Servicios y precios</h2>
            <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
              {negocio.servicios.map((s) => (
                <li key={s.id} className="flex justify-between px-4 py-3">
                  <span>
                    {s.nombre} <span className="text-sm text-stone-500">· {s.minutos} min</span>
                  </span>
                  <span className="font-semibold">{formatPrice(s.precio)}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg font-bold">Horario</h2>
            <dl className="mt-3 space-y-1 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <div key={d} className="flex justify-between border-b border-stone-200 py-1.5">
                  <dt className="text-stone-600">{DIAS[d]}</dt>
                  <dd className="font-medium">
                    {negocio.horario[d] ? `${negocio.horario[d]![0]} a ${negocio.horario[d]![1]}` : "Cerrado"}
                  </dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-8 text-lg font-bold">Ubicación</h2>
            <p className="mt-1 text-stone-700">{direccion}</p>
            <iframe
              title={`Mapa de ${negocio.nombre}`}
              src={mapa}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mt-3 h-64 w-full rounded-2xl border-0"
            />
            <a
              href={whatsappLink(`Hola, tengo una pregunta para ${negocio.nombre}.`, negocio.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-teal-700 underline"
            >
              ¿Dudas? Escríbeles por WhatsApp
            </a>
          </div>

          <section id="apartar" className="h-fit min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 lg:sticky lg:top-20">
            <h2 className="mb-5 text-2xl font-bold">Aparta tu lugar</h2>
            <Reservar slug={negocio.slug} zona={zonaDe(negocio)} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
