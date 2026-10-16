import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { demoBusiness } from "@/lib/demo";
import { formatPrice, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: `${demoBusiness.name} · Demo de ${site.name}`,
  description: demoBusiness.slogan,
};

export default function DemoEstetica() {
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(demoBusiness.address)}&output=embed`;

  return (
    <>
      <div className="bg-stone-900 px-4 py-2 text-center text-sm text-white">
        Esto es una demo de {site.name}.{" "}
        <Link href="/#precios" className="font-semibold underline underline-offset-2">
          Quiero una así para mi negocio
        </Link>
      </div>

      <header className="bg-rose-50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold tracking-widest text-rose-700 uppercase">Estética</p>
          <h1 className="mt-2 text-4xl font-bold text-rose-950 sm:text-6xl">{demoBusiness.name}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-700">{demoBusiness.slogan}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#reservar" className="rounded-full bg-rose-600 px-7 py-3.5 font-semibold text-white hover:bg-rose-700">
              Reservar cita
            </a>
            <a
              href={whatsappLink(`Hola, quiero información de ${demoBusiness.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-7 py-3.5 font-semibold text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-3xl font-bold">Servicios</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {demoBusiness.services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between rounded-2xl bg-white p-5 ring-1 ring-stone-200"
              >
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-stone-500">{service.duration}</p>
                </div>
                <p className="font-bold text-rose-700">{formatPrice(service.price)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="reservar" className="scroll-mt-4 bg-white py-16">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold">Reserva tu cita</h2>
            <p className="mt-2 mb-8 text-stone-600">Elige servicio, día y hora. Te confirmamos por WhatsApp.</p>
            <BookingForm />
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Horarios</h2>
            <dl className="mt-6 space-y-3">
              {demoBusiness.hours.map((row) => (
                <div key={row.days} className="flex justify-between border-b border-stone-200 pb-3">
                  <dt className="text-stone-600">{row.days}</dt>
                  <dd className="font-semibold">{row.time}</dd>
                </div>
              ))}
            </dl>
            <h2 className="mt-10 text-3xl font-bold">Dónde estamos</h2>
            <p className="mt-4 text-stone-700">{demoBusiness.address}</p>
          </div>
          <iframe
            title={`Mapa de ${demoBusiness.name}`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-2xl border-0 md:h-full"
          />
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        {demoBusiness.name} · Página creada con{" "}
        <Link href="/" className="font-semibold text-teal-700">
          {site.name}
        </Link>
        {" · "}
        <Link href="/privacidad" className="underline underline-offset-2">
          Aviso de privacidad
        </Link>
      </footer>
    </>
  );
}
