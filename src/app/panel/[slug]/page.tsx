import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Panel } from "@/components/Panel";
import { getNegocio, negocios } from "@/data/catalogo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Agenda · ${site.name}`,
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return negocios.map((n) => ({ slug: n.slug }));
}

export default async function PaginaPanel({ params }: PageProps<"/panel/[slug]">) {
  const negocio = getNegocio((await params).slug);
  if (!negocio) notFound();

  return (
    <Suspense
      fallback={<div className="flex h-dvh items-center justify-center bg-stone-100 text-stone-500">Cargando agenda…</div>}
    >
      <Panel slug={negocio.slug} />
    </Suspense>
  );
}
