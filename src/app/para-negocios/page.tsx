import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPrice, plans, site, whatsappLink } from "@/lib/site";

const problems = [
  {
    stat: "46%",
    text: "de las pymes en México no tiene página web.",
    source: "Ipsos para Google",
  },
  {
    stat: "92%",
    text: "de las personas investiga en internet antes de elegir un negocio.",
    source: "Google",
  },
  {
    stat: "18–30%",
    text: "de las citas se pierden porque el cliente no llega.",
    source: "Medesk",
  },
];

const steps = [
  {
    title: "Platicamos 15 minutos",
    text: "Nos cuentas tus servicios, precios y horarios. Nada técnico.",
  },
  {
    title: "Armamos todo por ti",
    text: "Tu página, tu perfil en Google Maps y tu agenda en línea, listos en una semana.",
  },
  {
    title: "Tus clientes reservan solos",
    text: "Eligen servicio, día y hora desde el celular, y te llega el aviso al instante.",
  },
];

const audiences = ["Estéticas", "Barberías", "Uñas", "Consultorios", "Spas", "Talleres"];

const faqs = [
  {
    q: "¿Necesito saber de computación?",
    a: "No. Nosotros configuramos todo y te enseñamos a recibir tus citas desde el celular.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Los planes mensuales no tienen plazo forzoso y tienen garantía de 7 días: si cancelas en ese tiempo te devolvemos tu primer pago.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con tarjeta de crédito o débito, en un pago seguro procesado por Stripe.",
  },
  {
    q: "¿Y si ya tengo página web?",
    a: "Podemos conectar la agenda en línea a tu página actual o a tu perfil de Instagram.",
  },
];

export const metadata: Metadata = {
  title: `Para negocios · ${site.name}`,
  description: "Página web, Google Maps y agenda en línea para negocios que trabajan con citas.",
};

export default function ParaNegocios() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-teal-800">
            {site.name}
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium">
            <a href="#como-funciona" className="hidden hover:text-teal-700 sm:inline">
              Cómo funciona
            </a>
            <Link href="/n/barberia-el-patron-demo" className="hidden hover:text-teal-700 sm:inline">
              Ver demo
            </Link>
            <a
              href="#precios"
              className="rounded-full bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
            >
              Precios
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:pt-24">
          <p className="mb-4 inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-800">
            Para negocios que trabajan con citas
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Que te encuentren en Google y te reserven solos
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600 text-pretty">
            Página web, alta en Google Maps y agenda en línea con confirmación por WhatsApp.
            Nosotros lo armamos; tú solo atiendes a tus clientes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/n/barberia-el-patron-demo"
              className="rounded-full bg-teal-700 px-7 py-3.5 font-semibold text-white hover:bg-teal-800"
            >
              Ver cómo queda un negocio
            </Link>
            <a
              href={whatsappLink(`Hola, quiero información de ${site.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-stone-300 bg-white px-7 py-3.5 font-semibold hover:border-teal-700"
            >
              Escríbenos por WhatsApp
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-2 text-sm text-stone-600">
            {audiences.map((audience) => (
              <li key={audience} className="rounded-full border border-stone-200 bg-white px-3 py-1">
                {audience}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Clientes que se pierden sin que lo notes</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {problems.map((problem) => (
                <div key={problem.stat} className="rounded-2xl border border-stone-200 p-6">
                  <p className="text-4xl font-bold text-teal-700">{problem.stat}</p>
                  <p className="mt-2 text-stone-700">{problem.text}</p>
                  <p className="mt-3 text-xs text-stone-400">Fuente: {problem.source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-stone-600">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center">
            <Link href="/n/barberia-el-patron-demo" className="font-semibold text-teal-700 underline underline-offset-4">
              Prueba la agenda de una barbería de ejemplo →
            </Link>
          </p>
        </section>

        <section id="precios" className="scroll-mt-20 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Precios claros, sin letras chiquitas</h2>
            <p className="mt-3 text-center text-stone-600">Precios en pesos mexicanos.</p>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-3xl p-8 ${
                    plan.highlighted
                      ? "bg-teal-800 text-white shadow-xl lg:-my-4 lg:py-12"
                      : "border border-stone-200 bg-stone-50"
                  }`}
                >
                  {plan.highlighted && (
                    <p className="mb-3 self-start rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold">
                      El más elegido
                    </p>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className={`mt-2 ${plan.highlighted ? "text-teal-100" : "text-stone-600"}`}>
                    {plan.description}
                  </p>
                  <p className="mt-6">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className={plan.highlighted ? "text-teal-100" : "text-stone-500"}>
                      {plan.interval === "mes" ? " /mes" : " pago único"}
                    </span>
                  </p>
                  <ul className="mt-6 mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span aria-hidden="true" className={plan.highlighted ? "text-teal-300" : "text-teal-700"}>
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <CheckoutButton plan={plan.id} highlighted={plan.highlighted} />
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-stone-500">
              Al contratar aceptas nuestros{" "}
              <Link href="/terminos" className="underline underline-offset-2">
                Términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/reembolsos" className="underline underline-offset-2">
                Política de cancelaciones y reembolsos
              </Link>
              . Planes mensuales con garantía de 7 días.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-white p-5 ring-1 ring-stone-200">
                <summary className="cursor-pointer list-none font-semibold">
                  {faq.q}
                </summary>
                <p className="mt-3 text-stone-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-teal-50 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold">Consejos gratis para llenar tu agenda</h2>
            <p className="mt-2 mb-6 text-stone-600">
              Un correo al mes con ideas prácticas para conseguir más clientes. Sin spam.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
