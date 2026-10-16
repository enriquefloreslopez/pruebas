import type { Metadata } from "next";
import { Suspense } from "react";
import { Admin } from "@/components/Admin";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Administración · ${site.name}`,
  robots: { index: false, follow: false },
};

export default function PaginaAdmin() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold text-teal-700">{site.name}</p>
      <h1 className="mt-1 text-2xl font-bold">Resultados del piloto</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="text-stone-500">Cargando…</p>}>
          <Admin />
        </Suspense>
      </div>
    </main>
  );
}
