"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getNegocio } from "@/data/catalogo";
import { formatoFecha, type Estado } from "@/lib/agenda";
import { formatPrice } from "@/lib/site";

type Cita = {
  id: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  email: string | null;
  estado: Estado;
  origen: string;
};

const CADA_SEGUNDOS = 15;

const estilos: Record<Estado, { texto: string; clase: string }> = {
  nueva: { texto: "Nueva", clase: "bg-amber-100 text-amber-900" },
  confirmada: { texto: "Confirmada", clase: "bg-sky-100 text-sky-900" },
  atendida: { texto: "Atendida", clase: "bg-green-100 text-green-900" },
  no_llego: { texto: "No llegó", clase: "bg-red-100 text-red-900" },
  cancelada: { texto: "Cancelada", clase: "bg-stone-200 text-stone-600" },
};

// Un "ding" corto con la Web Audio API para avisar de citas nuevas.
function sonar() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Algunos navegadores bloquean el audio hasta que la persona toca la página.
  }
}

function whatsappCliente(telefono: string, mensaje: string) {
  const numero = telefono.length === 10 ? `52${telefono}` : telefono;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function Panel({ slug }: { slug: string }) {
  const negocio = getNegocio(slug)!;
  const llave = useSearchParams().get("k") ?? "";
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [hoy, setHoy] = useState("");
  const [error, setError] = useState("");
  const [vista, setVista] = useState<"hoy" | "proximas" | "anteriores">("hoy");
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const conocidas = useRef<Set<string> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/panel?negocio=${slug}&k=${encodeURIComponent(llave)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const lista: Cita[] = data.citas;
      const ids = new Set(lista.map((c) => c.id));
      if (conocidas.current) {
        const recientes = lista.filter((c) => !conocidas.current!.has(c.id)).map((c) => c.id);
        if (recientes.length) {
          sonar();
          setNuevas((prev) => new Set([...prev, ...recientes]));
        }
      }
      conocidas.current = ids;
      setCitas(lista);
      setHoy(data.hoy);
      setError("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Sin conexión. Reintentando…");
    }
  }, [slug, llave]);

  useEffect(() => {
    const primera = setTimeout(cargar, 0);
    const intervalo = setInterval(cargar, CADA_SEGUNDOS * 1000);
    return () => {
      clearTimeout(primera);
      clearInterval(intervalo);
    };
  }, [cargar]);

  useEffect(() => {
    document.title = nuevas.size ? `(${nuevas.size}) Nuevas citas · ${negocio.nombre}` : `Panel · ${negocio.nombre}`;
  }, [nuevas, negocio.nombre]);

  async function cambiarEstado(id: string, estado: Estado) {
    setCitas((prev) => prev?.map((c) => (c.id === id ? { ...c, estado } : c)) ?? null);
    setNuevas((prev) => {
      const sig = new Set(prev);
      sig.delete(id);
      return sig;
    });
    const res = await fetch("/api/panel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocio: slug, k: llave, id, estado }),
    });
    if (!res.ok) cargar();
  }

  if (error && !citas) {
    return <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  }
  if (!citas) return <p className="text-stone-500">Cargando citas…</p>;

  const deHoy = citas.filter((c) => c.fecha === hoy);
  const proximas = citas.filter((c) => c.fecha > hoy);
  const anteriores = citas.filter((c) => c.fecha < hoy).reverse();
  const lista = vista === "hoy" ? deHoy : vista === "proximas" ? proximas : anteriores;
  const activas = (cs: Cita[]) => cs.filter((c) => c.estado !== "cancelada");
  const atendidas = citas.filter((c) => c.estado === "atendida");

  const resumen = [
    { valor: activas(deHoy).length, texto: "Citas hoy" },
    { valor: activas(proximas).length, texto: "Próximas" },
    { valor: atendidas.length, texto: "Atendidas (7 días)" },
    { valor: formatPrice(atendidas.reduce((t, c) => t + c.precio, 0)), texto: "Ingresos atendidos" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {resumen.map((r) => (
          <div key={r.texto} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <p className="text-2xl font-bold text-teal-800">{r.valor}</p>
            <p className="text-sm text-stone-500">{r.texto}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-stone-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
        En vivo: se actualiza cada {CADA_SEGUNDOS} segundos.
        {error && <span className="text-red-700"> {error}</span>}
      </p>

      <div role="tablist" className="mt-6 flex gap-2">
        {(
          [
            ["hoy", `Hoy (${deHoy.length})`],
            ["proximas", `Próximas (${proximas.length})`],
            ["anteriores", "Anteriores"],
          ] as const
        ).map(([id, texto]) => (
          <button
            key={id}
            role="tab"
            aria-selected={vista === id}
            onClick={() => setVista(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              vista === id ? "bg-teal-700 text-white" : "bg-white ring-1 ring-stone-300"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {lista.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-stone-500 ring-1 ring-stone-200">
            No hay citas aquí todavía.
          </li>
        )}
        {lista.map((c) => {
          const estilo = estilos[c.estado];
          return (
            <li
              key={c.id}
              className={`rounded-2xl bg-white p-4 ring-1 transition ${
                nuevas.has(c.id) ? "ring-2 ring-amber-400" : "ring-stone-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold">
                    {c.hora}
                    {vista !== "hoy" && (
                      <span className="ml-2 text-sm font-normal text-stone-500 first-letter:uppercase">
                        {formatoFecha(c.fecha)}
                      </span>
                    )}
                  </p>
                  <p className="font-medium">{c.cliente}</p>
                  <p className="text-sm text-stone-600">
                    {c.servicio} · {formatPrice(c.precio)}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">Llegó por: {c.origen}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilo.clase}`}>
                  {nuevas.has(c.id) ? "¡Nueva!" : estilo.texto}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a
                  href={whatsappCliente(
                    c.telefono,
                    `Hola ${c.cliente}, te confirmamos tu cita de ${c.servicio} el ${formatoFecha(c.fecha)} a las ${c.hora} en ${negocio.nombre}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-green-600 px-3 py-1.5 font-medium text-white"
                >
                  WhatsApp
                </a>
                {c.estado === "nueva" && (
                  <button onClick={() => cambiarEstado(c.id, "confirmada")} className="rounded-full bg-sky-600 px-3 py-1.5 font-medium text-white">
                    Confirmar
                  </button>
                )}
                {(c.estado === "nueva" || c.estado === "confirmada") && (
                  <>
                    <button onClick={() => cambiarEstado(c.id, "atendida")} className="rounded-full bg-teal-700 px-3 py-1.5 font-medium text-white">
                      Atendida
                    </button>
                    <button onClick={() => cambiarEstado(c.id, "no_llego")} className="rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-stone-300">
                      No llegó
                    </button>
                    <button onClick={() => cambiarEstado(c.id, "cancelada")} className="rounded-full bg-white px-3 py-1.5 font-medium text-stone-500 ring-1 ring-stone-300">
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
