import Link from "next/link";
import { Encabezado } from "@/components/Encabezado";
import { SiteFooter } from "@/components/SiteFooter";
import { categorias, ciudades, negocios, seccionesActivas } from "@/data/catalogo";

const pasos = [
  { emoji: "🔎", titulo: "Elige", texto: "Compara negocios, servicios y precios cerca de ti." },
  { emoji: "📅", titulo: "Aparta", texto: "Escoge día y hora libres. Sin llamadas ni esperas." },
  { emoji: "✅", titulo: "Llega", texto: "Tu lugar te espera. Te confirman por WhatsApp." },
];

export default function Inicio() {
  const secciones = seccionesActivas();

  return (
    <>
      <Encabezado />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:pt-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Aparta tu lugar sin hacer fila
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600 text-pretty">
            Barberías, estéticas y más negocios de tu ciudad. Ve horarios libres y aparta en segundos.
          </p>
        </section>

        {ciudades.map((ciudad) => (
          <section key={ciudad.slug} className="mx-auto max-w-6xl px-4 pb-16">
            <h2 className="text-2xl font-bold">
              {ciudad.nombre}, {ciudad.estado}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {categorias.map((cat) => {
                const activa = secciones.some((s) => s.ciudad === ciudad.slug && s.categoria === cat.slug);
                const total = negocios.filter((n) => n.ciudad === ciudad.slug && n.categoria === cat.slug).length;
                const contenido = (
                  <>
                    <span className="text-4xl" aria-hidden="true">
                      {cat.emoji}
                    </span>
                    <span className="mt-3 block text-lg font-semibold">{cat.nombre}</span>
                    <span className="mt-1 block text-sm text-stone-600">{cat.descripcion}</span>
                    <span className="mt-3 block text-sm font-medium text-teal-700">
                      {activa ? `${total} ${total === 1 ? "negocio" : "negocios"} →` : "Muy pronto"}
                    </span>
                  </>
                );
                return activa ? (
                  <Link
                    key={cat.slug}
                    href={`/${ciudad.slug}/${cat.slug}`}
                    className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:ring-teal-600"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div key={cat.slug} className="rounded-2xl bg-white/60 p-6 opacity-70 ring-1 ring-stone-200">
                    {contenido}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
            {pasos.map((paso) => (
              <div key={paso.titulo} className="text-center">
                <p className="text-4xl" aria-hidden="true">
                  {paso.emoji}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{paso.titulo}</h3>
                <p className="mt-1 text-stone-600">{paso.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
