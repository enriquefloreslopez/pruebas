import type { Metadata } from "next";
import { Suspense } from "react";
import { Encabezado } from "@/components/Encabezado";
import { Recompensas } from "@/components/Recompensas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Mis recompensas · ${site.name}`,
  robots: { index: false, follow: false },
};

export default function PaginaRecompensas() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Suspense fallback={<p className="text-center text-stone-500">Cargando…</p>}>
          <Recompensas />
        </Suspense>
      </main>
    </>
  );
}
