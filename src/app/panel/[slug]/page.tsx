import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Panel } from "@/components/Panel";
import { getNegocio, negocios } from "@/data/catalogo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Panel · ${site.name}`,
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return negocios.map((n) => ({ slug: n.slug }));
}

export default async function PaginaPanel({ params }: PageProps<"/panel/[slug]">) {
  const negocio = getNegocio((await params).slug);
  if (!negocio) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold text-teal-700">{site.name} · Panel de citas</p>
      <h1 className="mt-1 text-2xl font-bold">{negocio.nombre}</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="text-stone-500">Cargando citas…</p>}>
          <Panel slug={negocio.slug} />
        </Suspense>
      </div>
    </main>
  );
}
