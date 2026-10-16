import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Setup } from "@/components/Setup";
import { getNegocio, negocios } from "@/data/catalogo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Setup · ${site.name}`,
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return negocios.map((n) => ({ slug: n.slug }));
}

export default async function PaginaSetup({ params }: PageProps<"/admin/setup/[slug]">) {
  const negocio = getNegocio((await params).slug);
  if (!negocio) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 bg-stone-100 px-4 pb-16">
      <Suspense fallback={<p className="py-8 text-stone-500">Cargando setup…</p>}>
        <Setup slug={negocio.slug} />
      </Suspense>
      <p className="mt-8 text-center text-sm text-stone-500">
        <Link href="/" className="underline">
          {site.name}
        </Link>
      </p>
    </main>
  );
}
