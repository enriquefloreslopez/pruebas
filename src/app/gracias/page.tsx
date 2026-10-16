import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: `¡Gracias! · ${site.name}`,
  robots: { index: false },
};

export default function Gracias() {
  return (
    <>
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-5xl" aria-hidden="true">
          🎉
        </p>
        <h1 className="mt-4 text-3xl font-bold">¡Pago recibido!</h1>
        <p className="mt-4 text-stone-600">
          Gracias por confiar en {site.name}. Stripe te enviará tu recibo por correo y en menos de
          24 horas te contactamos para empezar a armar tu página.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(`Hola, acabo de contratar ${site.name}. ¿Cuál es el siguiente paso?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Escribirnos por WhatsApp
          </a>
          <Link href="/" className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold">
            Volver al inicio
          </Link>
        </div>
    </main>
    <SiteFooter />
    </>
  );
}
