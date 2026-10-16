"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Estado } from "@/lib/agenda";
import { formatPrice } from "@/lib/site";

type Cita = {
  id: string;
  negocio: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  cliente: string;
  estado: Estado;
  origen: string;
  creada: string;
};
type PanelLink = { slug: string; nombre: string; demo: boolean; panel: string | null };
type Datos = { paneles: PanelLink[]; citas: Cita[]; configurada: boolean };

const CANALES = ["tiktok", "instagram", "facebook", "google", "qr", "whatsapp"];

function agrupar(citas: Cita[], clave: (c: Cita) => string) {
  const filas = new Map<string, { total: number; atendidas: number; noLlego: number; ingresos: number }>();
  for (const c of citas) {
    if (c.estado === "cancelada") continue;
    const f = filas.get(clave(c)) ?? { total: 0, atendidas: 0, noLlego: 0, ingresos: 0 };
    f.total++;
    if (c.estado === "atendida") {
      f.atendidas++;
      f.ingresos += c.precio;
    }
    if (c.estado === "no_llego") f.noLlego++;
    filas.set(clave(c), f);
  }
  return [...filas.entries()].sort((a, b) => b[1].total - a[1].total);
}

function Tabla({ titulo, filas }: { titulo: string; filas: ReturnType<typeof agrupar> }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <h2 className="font-bold">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Sin datos todavía.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500">
              <tr>
                <th className="py-1 pr-3 font-medium"></th>
                <th className="py-1 pr-3 font-medium">Citas</th>
                <th className="py-1 pr-3 font-medium">Atendidas</th>
                <th className="py-1 pr-3 font-medium">No llegó</th>
                <th className="py-1 font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(([nombre, f]) => (
                <tr key={nombre} className="border-t border-stone-100">
                  <td className="py-2 pr-3 font-medium">{nombre}</td>
                  <td className="py-2 pr-3">{f.total}</td>
                  <td className="py-2 pr-3">{f.atendidas}</td>
                  <td className="py-2 pr-3">{f.noLlego}</td>
                  <td className="py-2">{formatPrice(f.ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function Admin() {
  const llave = useSearchParams().get("k") ?? "";
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin?k=${encodeURIComponent(llave)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDatos(data);
      })
      .catch((err) => setError(err.message || "No se pudo cargar."));
  }, [llave]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!datos) return <p className="text-stone-500">Cargando…</p>;

  const activas = datos.citas.filter((c) => c.estado !== "cancelada");
  const atendidas = activas.filter((c) => c.estado === "atendida").length;
  const noLlego = activas.filter((c) => c.estado === "no_llego").length;
  const nombres = new Map(datos.paneles.map((p) => [p.slug, p.nombre]));
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="space-y-6">
      {!datos.configurada && (
        <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
          Falta conectar la base de datos (DATABASE_URL). Las citas en línea están apagadas.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [activas.length, "Citas (60 días)"],
          [atendidas, "Atendidas"],
          [noLlego, "No llegaron"],
          [activas.length ? `${Math.round((atendidas / activas.length) * 100)}%` : "—", "Asistencia"],
        ].map(([valor, texto]) => (
          <div key={texto} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <p className="text-2xl font-bold text-teal-800">{valor}</p>
            <p className="text-sm text-stone-500">{texto}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tabla titulo="Por canal de origen" filas={agrupar(datos.citas, (c) => c.origen)} />
        <Tabla titulo="Por negocio" filas={agrupar(datos.citas, (c) => nombres.get(c.negocio) ?? c.negocio)} />
      </div>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-bold">Negocios: panel y links por canal</h2>
        <p className="mt-1 text-sm text-stone-500">
          Comparte el panel solo con el dueño del negocio. Usa un link distinto en cada red para saber de
          dónde llegan las citas.
        </p>
        <ul className="mt-4 space-y-4">
          {datos.paneles.map((p) => (
            <li key={p.slug} className="border-t border-stone-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {p.nombre} {p.demo && <span className="text-xs font-normal text-stone-500">(ejemplo)</span>}
                </p>
                <a
                  href={`/admin/setup/${p.slug}?k=${encodeURIComponent(llave)}`}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Setup SEO e IA →
                </a>
              </div>
              <p className="mt-1 break-all text-sm">
                Panel:{" "}
                {p.panel ? (
                  <a href={p.panel} className="text-teal-700 underline">
                    {p.panel}
                  </a>
                ) : (
                  "falta PANEL_SECRET"
                )}
              </p>
              <p className="mt-1 break-all text-xs text-stone-500">
                {CANALES.map((canal) => `${origin}/n/${p.slug}?ref=${canal}`).join("  ·  ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-bold">Últimas citas</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500">
              <tr>
                <th className="py-1 pr-3 font-medium">Negocio</th>
                <th className="py-1 pr-3 font-medium">Cita</th>
                <th className="py-1 pr-3 font-medium">Cliente</th>
                <th className="py-1 pr-3 font-medium">Canal</th>
                <th className="py-1 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.citas.slice(0, 50).map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="py-2 pr-3">{nombres.get(c.negocio) ?? c.negocio}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {c.fecha} {c.hora} · {c.servicio}
                  </td>
                  <td className="py-2 pr-3">{c.cliente}</td>
                  <td className="py-2 pr-3">{c.origen}</td>
                  <td className="py-2">{c.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
