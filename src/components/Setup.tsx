"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { getNegocio } from "@/data/catalogo";
import { ASISTENTES, ENLACES, SECCIONES, type SetupDatos } from "@/lib/setup";

type Chequeo = { id: string; texto: string; ok: boolean; ayuda: string };
type Ficha = {
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  sitio: string;
  categoriaGoogle: string;
  descripcionGoogle: string;
  bioInstagram: string;
  links: Record<string, string>;
};
type Respuesta = {
  guardable: boolean;
  datos: SetupDatos;
  chequeos: Chequeo[];
  ficha: Ficha;
  consultas: string[];
  panel: string | null;
};

function Copiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [listo, setListo] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setListo(true);
          setTimeout(() => setListo(false), 1500);
        } catch {
          // Sin permiso para copiar: el texto sigue visible para seleccionarlo a mano.
        }
      }}
      className="shrink-0 rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
    >
      {listo ? "¡Copiado!" : etiqueta}
    </button>
  );
}

function Qr({ texto, titulo, archivo }: { texto: string; titulo: string; archivo: string }) {
  const [imagen, setImagen] = useState("");
  useEffect(() => {
    QRCode.toDataURL(texto, { width: 600, margin: 1 }).then(setImagen).catch(() => setImagen(""));
  }, [texto]);
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-4 text-center ring-1 ring-stone-200">
      <p className="text-sm font-semibold">{titulo}</p>
      {imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagen} alt={`Código QR: ${titulo}`} className="mt-3 h-40 w-40" />
      ) : (
        <div className="mt-3 h-40 w-40 animate-pulse rounded-lg bg-stone-100" />
      )}
      {imagen && (
        <a href={imagen} download={archivo} className="mt-3 text-sm font-medium text-teal-700 underline">
          Descargar para imprimir
        </a>
      )}
    </div>
  );
}

function Bloque({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200 sm:p-6">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-stone-600">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Setup({ slug }: { slug: string }) {
  const negocio = getNegocio(slug)!;
  const llave = useSearchParams().get("k") ?? "";
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [datos, setDatos] = useState<SetupDatos | null>(null);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado" | "error">("");
  const [error, setError] = useState("");
  const pendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimos = useRef<SetupDatos | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/setup?negocio=${slug}&k=${encodeURIComponent(llave)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo cargar.");
      return;
    }
    setRespuesta(data);
    setDatos((actual) => actual ?? data.datos);
  }, [slug, llave]);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  // Guarda solo, medio segundo después del último cambio.
  function cambiar(modificar: (d: SetupDatos) => SetupDatos) {
    const actual = ultimos.current ?? datos;
    if (!actual) return;
    const nuevo = modificar(actual);
    ultimos.current = nuevo;
    setDatos(nuevo);
    if (pendiente.current) clearTimeout(pendiente.current);
    pendiente.current = setTimeout(async () => {
      setEstado("guardando");
      const res = await fetch("/api/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio: slug, k: llave, datos: ultimos.current }),
      }).catch(() => null);
      setEstado(res?.ok ? "guardado" : "error");
      if (res?.ok) cargar();
    }, 600);
  }

  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>;
  if (!respuesta || !datos) return <p className="text-stone-500">Cargando setup…</p>;

  const { chequeos, ficha, consultas } = respuesta;
  const pasos = SECCIONES.flatMap((s) => s.pasos);
  const hechos = pasos.filter((p) => datos.pasos[p.id]).length + chequeos.filter((c) => c.ok).length;
  const total = pasos.length + chequeos.length;
  const progreso = Math.round((hechos / total) * 100);
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

  const marcar = (id: string, valor: boolean) => cambiar((d) => ({ ...d, pasos: { ...d.pasos, [id]: valor } }));
  const registrarPrueba = (asistente: string, consulta: string, aparece: boolean) =>
    cambiar((d) => ({ ...d, pruebas: [...d.pruebas, { fecha: hoy, asistente, consulta, aparece }] }));

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-stone-200 bg-stone-100/95 px-4 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-500">Setup del negocio</p>
            <h1 className="text-2xl font-bold">{negocio.nombre}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/n/${slug}`} target="_blank" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium">
              Ver página
            </Link>
            {respuesta.panel && (
              <a href={respuesta.panel} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-stone-900 px-3 py-1.5 font-medium text-white">
                Abrir agenda
              </a>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progreso}%` }} />
          </div>
          <span className="text-sm font-semibold">{progreso}%</span>
          <span className="w-20 text-right text-xs text-stone-500">
            {estado === "guardando" ? "Guardando…" : estado === "guardado" ? "Guardado ✓" : estado === "error" ? "Error al guardar" : ""}
          </span>
        </div>
        {!respuesta.guardable && (
          <p className="mt-2 text-xs text-amber-800">Conecta la base de datos para guardar el avance.</p>
        )}
      </div>

      <Bloque titulo="1. Revisión automática" descripcion="Lo que la plataforma comprueba sola. Lo marcado en amarillo hay que corregirlo.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {chequeos.map((c) => (
            <li key={c.id} className={`rounded-xl p-3 text-sm ${c.ok ? "bg-emerald-50" : "bg-amber-50"}`}>
              <p className="font-semibold">
                {c.ok ? "✅" : "⚠️"} {c.texto}
              </p>
              {!c.ok && <p className="mt-1 text-stone-600">{c.ayuda}</p>}
            </li>
          ))}
        </ul>
      </Bloque>

      <Bloque
        titulo="2. Ficha oficial"
        descripcion="Copia estos datos EXACTAMENTE igual en Google, Bing, Apple, Facebook e Instagram. La consistencia es lo que hace que la IA confíe en el negocio."
      >
        <dl className="divide-y divide-stone-100 rounded-2xl bg-stone-50">
          {(
            [
              ["Nombre", ficha.nombre],
              ["Dirección", ficha.direccion],
              ["Teléfono", ficha.telefono],
              ["Horario", ficha.horario],
              ["Categoría en Google", ficha.categoriaGoogle],
              ["Sitio web", ficha.sitio],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 px-4 py-3 text-sm">
              <dt className="w-36 shrink-0 text-stone-500">{k}</dt>
              <dd className="min-w-0 flex-1 break-words font-medium">{v}</dd>
              <Copiar texto={v} />
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(
            [
              ["Descripción para Google (máx. 750)", ficha.descripcionGoogle],
              ["Bio para Instagram / TikTok", ficha.bioInstagram],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{k}</p>
                <Copiar texto={v} />
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-stone-700">{v}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-semibold">Links medidos por canal</h3>
        <ul className="mt-2 space-y-1.5">
          {Object.entries(ficha.links).map(([canal, link]) => (
            <li key={canal} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 capitalize text-stone-500">{canal}</span>
              <code className="min-w-0 flex-1 truncate rounded bg-stone-100 px-2 py-1 text-xs">{link}</code>
              <Copiar texto={link} />
            </li>
          ))}
        </ul>
      </Bloque>

      <Bloque
        titulo="3. Perfiles del negocio"
        descripcion="Pega aquí los links de cada perfil. Se publican en la página del negocio para que Google y la IA sepan que es el mismo negocio en todos lados."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {ENLACES.map((e) => (
            <label key={e.id} className="text-sm">
              <span className="mb-1 block font-medium">{e.nombre}</span>
              <input
                type="url"
                defaultValue={datos.enlaces[e.id] ?? ""}
                placeholder={e.ejemplo}
                onBlur={(ev) => {
                  const valor = ev.target.value.trim();
                  cambiar((d) => {
                    const enlaces = { ...d.enlaces };
                    if (valor) enlaces[e.id] = valor;
                    else delete enlaces[e.id];
                    return { ...d, enlaces };
                  });
                }}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">Solo links que empiecen con https://. Se guarda al salir de cada campo.</p>
      </Bloque>

      {SECCIONES.map((seccion, i) => (
        <Bloque key={seccion.id} titulo={`${i + 4}. ${seccion.titulo}`} descripcion={seccion.descripcion}>
          <ul className="space-y-2">
            {seccion.pasos.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-xl p-3 ring-1 ring-stone-200 has-[:checked]:bg-emerald-50 has-[:checked]:ring-emerald-200">
                <input
                  id={p.id}
                  type="checkbox"
                  checked={!!datos.pasos[p.id]}
                  onChange={(e) => marcar(p.id, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700"
                />
                <label htmlFor={p.id} className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold">{p.titulo}</span>
                  <span className="text-stone-600">{p.detalle}</span>
                </label>
                {p.herramienta && (
                  <a
                    href={p.herramienta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-fit shrink-0 rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    {p.herramienta.texto}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {seccion.id === "resenas" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {datos.enlaces.resenas ? (
                <Qr texto={datos.enlaces.resenas} titulo="⭐ Déjanos tu reseña" archivo={`qr-resenas-${slug}.png`} />
              ) : (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  Captura el «Link para dejar reseña en Google» en Perfiles para generar el QR. Está en el Perfil de Negocio, en «Pedir
                  reseñas».
                </p>
              )}
              <Qr texto={ficha.links.qr} titulo="📅 Aparta tu próxima cita" archivo={`qr-citas-${slug}.png`} />
            </div>
          )}

          {seccion.id === "ia" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold">Consultas de prueba</p>
              {consultas.map((q) => (
                <div key={q} className="rounded-xl bg-stone-50 p-3">
                  <p className="text-sm font-medium">«{q}»</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ASISTENTES.map((a) => (
                      <span key={a.id} className="inline-flex overflow-hidden rounded-lg ring-1 ring-stone-300">
                        <a
                          href={a.url(q)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
                        >
                          {a.nombre} ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => registrarPrueba(a.nombre, q, true)}
                          title="Sí apareció"
                          className="border-l border-stone-300 bg-white px-2 text-xs hover:bg-emerald-50"
                        >
                          ✅
                        </button>
                        <button
                          type="button"
                          onClick={() => registrarPrueba(a.nombre, q, false)}
                          title="No apareció"
                          className="border-l border-stone-300 bg-white px-2 text-xs hover:bg-rose-50"
                        >
                          ❌
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-stone-500">
                Abre cada asistente, revisa si recomienda al negocio y marca ✅ o ❌. Así medimos el avance mes con mes.
              </p>

              {datos.pruebas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="mt-2 w-full text-left text-sm">
                    <thead className="text-stone-500">
                      <tr>
                        <th className="py-1 pr-3 font-medium">Fecha</th>
                        <th className="py-1 pr-3 font-medium">Asistente</th>
                        <th className="py-1 pr-3 font-medium">Consulta</th>
                        <th className="py-1 font-medium">¿Apareció?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...datos.pruebas].reverse().slice(0, 20).map((p, j) => (
                        <tr key={j} className="border-t border-stone-100">
                          <td className="py-1.5 pr-3 whitespace-nowrap">{p.fecha}</td>
                          <td className="py-1.5 pr-3">{p.asistente}</td>
                          <td className="py-1.5 pr-3">{p.consulta}</td>
                          <td className="py-1.5">{p.aparece ? "✅ Sí" : "❌ No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Bloque>
      ))}
    </div>
  );
}
