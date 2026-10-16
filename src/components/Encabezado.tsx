import Link from "next/link";
import { site } from "@/lib/site";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-800">
          {site.name}
        </Link>
        <Link href="/para-negocios" className="text-sm font-medium hover:text-teal-700">
          ¿Tienes un negocio?
        </Link>
      </nav>
    </header>
  );
}

// Datos estructurados para buscadores y asistentes de IA.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
