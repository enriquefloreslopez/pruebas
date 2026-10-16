"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Huecos, NuevoModal } from "@/components/PanelExtras";
import { getNegocio, type Negocio } from "@/data/catalogo";
import {
  ahoraEn,
  diaSemana,
  duracionDe,
  formatoFecha,
  horariosDelDia,
  sumarDias,
  zonaDe,
  type Estado,
} from "@/lib/agenda";
import { formatPrice, site } from "@/lib/site";

type Cita = {
  id: string;
  servicio_id: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  email: string | null;
  estado: Estado;
  origen: string;
  minutos: number | null;
  tipo: "cita" | "bloqueo";
};

type Bloque = { cita: Cita; ini: number; fin: number; carril: number; carriles: number };
type Aviso = { id: string; cita: Cita };

const CADA_SEGUNDOS = 15;
// Alto en pixeles de cada minuto en el calendario (30 min = 48 px).
const PX = 1.6;
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const ORIGENES: Record<string, string> = {
  mostrador: "Llegó al local",
  telefono: "Llamó por teléfono",
  estado: "Estado de WhatsApp",
  directo: "Directo",
};

const ESTADOS: Record<Estado, { texto: string; bloque: string; punto: string; chip: string }> = {
  nueva: {
    texto: "Por confirmar",
    bloque: "bg-amber-50 border-amber-400 text-amber-950",
    punto: "bg-amber-400",
    chip: "bg-amber-100 text-amber-900",
  },
  confirmada: {
    texto: "Confirmada",
    bloque: "bg-sky-50 border-sky-500 text-sky-950",
    punto: "bg-sky-500",
    chip: "bg-sky-100 text-sky-900",
  },
  atendida: {
    texto: "Atendida",
    bloque: "bg-emerald-50 border-emerald-500 text-emerald-950",
    punto: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-900",
  },
  no_llego: {
    texto: "No llegó",
    bloque: "bg-rose-50 border-rose-400 text-rose-900 opacity-70",
    punto: "bg-rose-400",
    chip: "bg-rose-100 text-rose-900",
  },
  cancelada: {
    texto: "Cancelada",
    bloque: "hidden",
    punto: "bg-stone-400",
    chip: "bg-stone-200 text-stone-700",
  },
};

const aMin = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};
const aHora = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Horas que abarca el calendario: de la apertura más temprana al cierre más tarde.
function rangoDelCalendario(negocio: Negocio) {
  const rangos = Object.values(negocio.horario).filter((r): r is [string, string] => !!r);
  const ini = Math.min(...rangos.map((r) => aMin(r[0])));
  const fin = Math.max(...rangos.map((r) => aMin(r[1])));
  return { ini: Math.floor(ini / 60) * 60, fin: Math.ceil(fin / 60) * 60 };
}

// Acomoda las citas que se enciman en carriles lado a lado, como un calendario.
function acomodar(negocio: Negocio, citas: Cita[]): Bloque[] {
  const bloques = citas
    .filter((c) => c.estado !== "cancelada" && c.tipo === "cita")
    .map((cita) => {
      const ini = aMin(cita.hora);
      return { cita, ini, fin: ini + duracionDe(negocio, cita), carril: 0, carriles: 1 };
    })
    .sort((a, b) => a.ini - b.ini || a.fin - b.fin);

  let grupo: Bloque[] = [];
  let finGrupo = -1;
  const cerrarGrupo = () => {
    const finesPorCarril: number[] = [];
    for (const b of grupo) {
      const libre = finesPorCarril.findIndex((f) => f <= b.ini);
      b.carril = libre === -1 ? finesPorCarril.length : libre;
      finesPorCarril[b.carril] = b.fin;
    }
    for (const b of grupo) b.carriles = finesPorCarril.length;
  };
  for (const b of bloques) {
    if (b.ini >= finGrupo && grupo.length) {
      cerrarGrupo();
      grupo = [];
    }
    grupo.push(b);
    finGrupo = Math.max(finGrupo, b.fin);
  }
  if (grupo.length) cerrarGrupo();
  return bloques;
}

// Porcentaje del tiempo disponible que ya está ocupado ese día.
function ocupacion(negocio: Negocio, fecha: string, citas: Cita[]) {
  const rango = negocio.horario[diaSemana(fecha)];
  if (!rango) return null;
  const total = (aMin(rango[1]) - aMin(rango[0])) * negocio.capacidad;
  const usado = citas
    .filter((c) => c.fecha === fecha && c.estado !== "cancelada")
    .reduce((t, c) => t + duracionDe(negocio, c) * (c.tipo === "bloqueo" ? negocio.capacidad : 1), 0);
  return Math.min(100, Math.round((usado / total) * 100));
}

function lunesDe(fecha: string) {
  return sumarDias(fecha, -((diaSemana(fecha) + 6) % 7));
}

function etiquetaCorta(fecha: string, hoy: string) {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  if (fecha === sumarDias(hoy, -1)) return "Ayer";
  return formatoFecha(fecha);
}

function rangoSemana(lunes: string) {
  const f = (d: string, opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { ...opciones, timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const domingo = sumarDias(lunes, 6);
  return `${f(lunes, { day: "numeric", month: "short" })} – ${f(domingo, { day: "numeric", month: "short", year: "numeric" })}`;
}

function sonar() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i ? 1175 : 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch {
    // Algunos navegadores bloquean el audio hasta que la persona toca la página.
  }
}

function telefonoCompleto(telefono: string) {
  return telefono.length === 10 ? `52${telefono}` : telefono;
}

export function Panel({ slug }: { slug: string }) {
  const negocio = getNegocio(slug)!;
  const zona = zonaDe(negocio);
  const llave = useSearchParams().get("k") ?? "";
  const rango = rangoDelCalendario(negocio);

  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [visitas, setVisitas] = useState<Record<string, number>>({});
  const [hoy, setHoy] = useState("");
  const [ahora, setAhora] = useState(0);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [fecha, setFecha] = useState("");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [alta, setAlta] = useState<{ fecha: string; hora: string } | null>(null);
  const [verHuecos, setVerHuecos] = useState(false);
  const conocidas = useRef<Set<string> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const yaDesplazado = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/panel?negocio=${slug}&k=${encodeURIComponent(llave)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const lista: Cita[] = data.citas;
      if (conocidas.current) {
        const recientes = lista.filter((c) => !conocidas.current!.has(c.id) && c.tipo === "cita");
        if (recientes.length) {
          sonar();
          setNuevas((prev) => new Set([...prev, ...recientes.map((c) => c.id)]));
          setAvisos((prev) => [...prev, ...recientes.map((cita) => ({ id: cita.id, cita }))]);
        }
      }
      conocidas.current = new Set(lista.map((c) => c.id));
      setCitas(lista);
      setVisitas(data.visitas ?? {});
      setHoy(data.hoy);
      setAhora(ahoraEn(zona).minutos);
      setError("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Sin conexión. Reintentando…");
    }
  }, [slug, llave, zona]);

  useEffect(() => {
    const primera = setTimeout(cargar, 0);
    const intervalo = setInterval(cargar, CADA_SEGUNDOS * 1000);
    return () => {
      clearTimeout(primera);
      clearInterval(intervalo);
    };
  }, [cargar]);

  useEffect(() => {
    document.title = nuevas.size ? `(${nuevas.size}) Nuevas citas · ${negocio.nombre}` : `Agenda · ${negocio.nombre}`;
  }, [nuevas, negocio.nombre]);

  // Los avisos emergentes desaparecen solos después de 8 segundos.
  useEffect(() => {
    if (!avisos.length) return;
    const t = setTimeout(() => setAvisos((prev) => prev.slice(1)), 8000);
    return () => clearTimeout(t);
  }, [avisos]);

  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setSeleccion(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, []);

  // Al abrir, el calendario se desplaza a la hora actual.
  useEffect(() => {
    if (!citas || yaDesplazado.current || !scroller.current) return;
    yaDesplazado.current = true;
    scroller.current.scrollTop = Math.max(0, (ahora - rango.ini) * PX - 120);
  }, [citas, ahora, rango.ini]);

  const abrir = (cita: Cita) => {
    setFecha(cita.fecha);
    setSeleccion(cita.id);
    setNuevas((prev) => {
      const sig = new Set(prev);
      sig.delete(cita.id);
      return sig;
    });
  };

  async function cambiarEstado(id: string, estado: Estado) {
    setCitas((prev) => prev?.map((c) => (c.id === id ? { ...c, estado } : c)) ?? null);
    const res = await fetch("/api/panel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocio: slug, k: llave, id, estado }),
    });
    if (!res.ok) cargar();
  }

  async function guardarAlta(datos: Record<string, unknown>): Promise<string | null> {
    const res = await fetch("/api/panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, negocio: slug, k: llave }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? "No se pudo guardar.";
    // Lo que agrega el propio negocio no dispara el aviso de "nueva cita".
    conocidas.current?.add(data.id);
    await cargar();
    return null;
  }

  // Al tocar un espacio vacío del calendario se abre el alta en esa hora.
  function tocarHueco(d: string, e: React.MouseEvent<HTMLDivElement>) {
    if (d < hoy) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minuto = rango.ini + y / PX;
    const horas = horariosDelDia(negocio, d);
    const hora = [...horas].reverse().find((h) => aMin(h) <= minuto) ?? horas[0];
    if (hora) setAlta({ fecha: d, hora });
  }

  if (error && !citas) {
    return (
      <div className="flex h-dvh items-center justify-center bg-stone-100 p-6">
        <p className="max-w-sm rounded-2xl bg-white p-6 text-center text-stone-700 shadow-sm ring-1 ring-stone-200">
          {error}
        </p>
      </div>
    );
  }
  if (!citas || !hoy) {
    return <div className="flex h-dvh items-center justify-center bg-stone-100 text-stone-500">Cargando agenda…</div>;
  }

  const minimo = sumarDias(hoy, -7);
  const maximo = sumarDias(hoy, 30);
  const actual = fecha || hoy;
  const dias = vista === "dia" ? [actual] : Array.from({ length: 7 }, (_, i) => sumarDias(lunesDe(actual), i));
  const paso = vista === "dia" ? 1 : 7;
  const mover = (n: number) => setFecha(sumarDias(actual, n * paso));
  const puedeAtras = sumarDias(dias[0], -1) >= minimo;
  const puedeAdelante = sumarDias(dias[dias.length - 1], 1) <= maximo;

  const activas = citas.filter((c) => c.estado !== "cancelada" && c.tipo === "cita");
  const delDia = (d: string) => activas.filter((c) => c.fecha === d);
  const ocupantesDe = (d: string) => citas.filter((c) => c.fecha === d);
  const lunesHoy = lunesDe(hoy);
  const semana = activas.filter((c) => c.fecha >= lunesHoy && c.fecha <= sumarDias(lunesHoy, 6));
  const atendidas = activas.filter((c) => c.estado === "atendida");
  const noLlego = activas.filter((c) => c.estado === "no_llego").length;
  const asistencia = atendidas.length + noLlego ? Math.round((atendidas.length / (atendidas.length + noLlego)) * 100) : null;
  const siguientes = activas
    .filter((c) => (c.fecha > hoy || (c.fecha === hoy && aMin(c.hora) >= ahora)) && c.estado !== "no_llego")
    .slice(0, 6);
  const elegida = citas.find((c) => c.id === seleccion) ?? null;
  const alto = (rango.fin - rango.ini) * PX;
  const horas = Array.from({ length: (rango.fin - rango.ini) / 60 + 1 }, (_, i) => rango.ini + i * 60);
  const titulo = vista === "dia" ? formatoFecha(actual) : rangoSemana(dias[0]);
  // Visitas atendidas anteriores a esta cita (si ya está atendida, no cuenta la propia).
  const visitasPrevias = (c: Cita) =>
    c.telefono ? (visitas[c.telefono] ?? 0) - (c.estado === "atendida" ? 1 : 0) : null;

  const huecos = <Huecos negocio={negocio} hoy={hoy} ahora={ahora} ocupantesDe={ocupantesDe} />;

  return (
    <div className="flex h-dvh flex-col bg-stone-100 text-stone-900">
      {/* Barra superior */}
      <header className="flex items-center justify-between gap-3 bg-stone-900 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold">
            {negocio.nombre.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{negocio.nombre}</p>
            <p className="text-xs text-stone-400">Agenda · {site.name}</p>
          </div>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <span className={`h-2 w-2 rounded-full ${error ? "bg-amber-400" : "animate-pulse bg-emerald-400"}`} />
          {error ? "Reconectando…" : "En vivo"}
        </p>
      </header>

      {/* Navegación de fechas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFecha(hoy)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
          >
            Hoy
          </button>
          <div className="flex">
            <button
              onClick={() => mover(-1)}
              disabled={!puedeAtras}
              aria-label="Anterior"
              className="rounded-l-lg border border-stone-300 px-2.5 py-1.5 hover:bg-stone-50 disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => mover(1)}
              disabled={!puedeAdelante}
              aria-label="Siguiente"
              className="-ml-px rounded-r-lg border border-stone-300 px-2.5 py-1.5 hover:bg-stone-50 disabled:opacity-30"
            >
              ›
            </button>
          </div>
          <h1 className="ml-1 text-base font-semibold first-letter:uppercase sm:text-lg">{titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-stone-100 p-1 text-sm font-medium">
            {(
              [
                ["dia", "Día"],
                ["semana", "Semana"],
              ] as const
            ).map(([id, texto]) => (
              <button
                key={id}
                onClick={() => setVista(id)}
                aria-pressed={vista === id}
                className={`rounded-md px-3 py-1 ${vista === id ? "bg-white shadow-sm" : "text-stone-500"}`}
              >
                {texto}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAlta({ fecha: actual < hoy ? hoy : actual, hora: horariosDelDia(negocio, actual)[0] ?? "" })}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Resumen en celular */}
      <div className="flex items-center gap-4 overflow-x-auto border-b border-stone-200 bg-white px-4 py-2 text-xs whitespace-nowrap text-stone-600 lg:hidden">
        <button
          onClick={() => setVerHuecos(true)}
          className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-950"
        >
          🔥 Huecos libres
        </button>
        <span>
          Hoy <b className="text-stone-900">{delDia(hoy).length}</b>
        </span>
        <span>
          Mañana <b className="text-stone-900">{delDia(sumarDias(hoy, 1)).length}</b>
        </span>
        <span>
          Semana <b className="text-stone-900">{semana.length}</b>
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Calendario */}
        <div ref={scroller} className="min-w-0 flex-1 overflow-auto">
          <div style={{ minWidth: vista === "semana" ? 56 + 7 * 128 : undefined }}>
            {/* Encabezado de días con su ocupación */}
            <div className="sticky top-0 z-20 flex border-b border-stone-200 bg-white/95 backdrop-blur">
              <div className="w-14 shrink-0" />
              {dias.map((d) => {
                const esHoy = d === hoy;
                const total = delDia(d).length;
                const lleno = ocupacion(negocio, d, citas);
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setFecha(d);
                      setVista("dia");
                    }}
                    className="flex flex-1 flex-col items-center gap-1 border-l border-stone-200 px-2 pt-2 pb-1.5 first:border-l-0"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-500 uppercase">{DIAS_CORTOS[diaSemana(d)]}</span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          esHoy ? "bg-teal-600 text-white" : ""
                        }`}
                      >
                        {Number(d.slice(8))}
                      </span>
                      {total > 0 && (
                        <span className="rounded-full bg-stone-100 px-1.5 text-xs text-stone-600">{total}</span>
                      )}
                    </span>
                    <span
                      className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-stone-100"
                      title={lleno === null ? "Cerrado" : `${lleno}% ocupado`}
                    >
                      {lleno !== null && (
                        <span
                          className={`block h-full rounded-full ${
                            lleno >= 80 ? "bg-rose-500" : lleno >= 50 ? "bg-amber-400" : "bg-teal-500"
                          }`}
                          style={{ width: `${lleno}%` }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cuadrícula de horas */}
            <div className="relative flex bg-white" style={{ height: alto }}>
              <div className="relative w-14 shrink-0">
                {horas.map((m) => (
                  <span
                    key={m}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-stone-400"
                    style={{ top: (m - rango.ini) * PX }}
                  >
                    {m === rango.ini ? "" : aHora(m)}
                  </span>
                ))}
              </div>

              {dias.map((d) => {
                const abierto = negocio.horario[diaSemana(d)];
                const abre = abierto ? aMin(abierto[0]) : rango.fin;
                const cierra = abierto ? aMin(abierto[1]) : rango.fin;
                const bloques = acomodar(negocio, citas.filter((c) => c.fecha === d));
                const bloqueos = citas.filter((c) => c.fecha === d && c.tipo === "bloqueo" && c.estado !== "cancelada");
                return (
                  <div
                    key={d}
                    onClick={(e) => abierto && tocarHueco(d, e)}
                    className={`group relative flex-1 border-l border-stone-200 first:border-l-0 ${
                      abierto && d >= hoy ? "cursor-cell" : ""
                    }`}
                  >
                    {horas.map((m) => (
                      <div
                        key={m}
                        className="absolute inset-x-0 border-t border-stone-100"
                        style={{ top: (m - rango.ini) * PX }}
                      />
                    ))}
                    {horas.slice(0, -1).map((m) => (
                      <div
                        key={`m${m}`}
                        className="absolute inset-x-0 border-t border-dashed border-stone-100"
                        style={{ top: (m + 30 - rango.ini) * PX }}
                      />
                    ))}
                    {/* Horas en que el negocio está cerrado */}
                    {[
                      [rango.ini, Math.max(rango.ini, abre)],
                      [Math.min(cierra, rango.fin), rango.fin],
                    ].map(([a, b], i) =>
                      b > a ? (
                        <div
                          key={i}
                          className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,#f5f5f4_0,#f5f5f4_6px,#fafaf9_6px,#fafaf9_12px)]"
                          style={{ top: (a - rango.ini) * PX, height: (b - a) * PX }}
                        />
                      ) : null,
                    )}
                    {!abierto && (
                      <p className="absolute inset-x-0 top-6 text-center text-xs font-medium text-stone-400">Cerrado</p>
                    )}

                    {/* Horarios bloqueados */}
                    {bloqueos.map((b) => {
                      const ini = aMin(b.hora);
                      return (
                        <button
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrir(b);
                          }}
                          className={`absolute inset-x-1 z-[5] flex items-start gap-1 overflow-hidden rounded-md border border-stone-300 bg-[repeating-linear-gradient(135deg,#e7e5e4_0,#e7e5e4_5px,#f5f5f4_5px,#f5f5f4_10px)] px-2 py-1 text-left text-xs font-medium text-stone-600 ${
                            seleccion === b.id ? "ring-2 ring-teal-600" : ""
                          }`}
                          style={{ top: (ini - rango.ini) * PX + 1, height: Math.max(duracionDe(negocio, b) * PX - 2, 22) }}
                        >
                          🔒 {b.cliente}
                        </button>
                      );
                    })}

                    {bloques.map(({ cita, ini, fin, carril, carriles }) => {
                      const estilo = ESTADOS[cita.estado];
                      const corto = (fin - ini) * PX < 44;
                      const previas = visitasPrevias(cita);
                      return (
                        <button
                          key={cita.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrir(cita);
                          }}
                          className={`absolute z-10 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:z-20 hover:shadow-md ${estilo.bloque} ${
                            nuevas.has(cita.id) ? "ring-2 ring-amber-400 ring-offset-1" : ""
                          } ${seleccion === cita.id ? "ring-2 ring-teal-600" : ""}`}
                          style={{
                            top: (ini - rango.ini) * PX + 1,
                            height: Math.max((fin - ini) * PX - 2, 22),
                            left: `calc(${(carril / carriles) * 100}% + 3px)`,
                            width: `calc(${100 / carriles}% - 6px)`,
                          }}
                        >
                          <p className="truncate font-semibold">
                            {nuevas.has(cita.id) && (
                              <span className="mr-1 rounded bg-amber-400 px-1 text-[10px] font-bold text-amber-950">
                                NUEVA
                              </span>
                            )}
                            {corto ? `${cita.hora} ${cita.cliente}` : cita.cliente}
                            {previas !== null && previas >= 2 && " ⭐"}
                          </p>
                          {!corto && (
                            <p className="truncate opacity-80">
                              {cita.hora}–{aHora(fin)} · {cita.servicio}
                            </p>
                          )}
                        </button>
                      );
                    })}

                    {/* Línea de la hora actual */}
                    {d === hoy && ahora >= rango.ini && ahora <= rango.fin && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                        style={{ top: (ahora - rango.ini) * PX }}
                      >
                        <span className="absolute -top-[5px] -left-[5px] h-2 w-2 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra lateral */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-stone-200 bg-stone-50 p-5 lg:block">
          {huecos}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              [delDia(hoy).length, "Citas hoy"],
              [delDia(sumarDias(hoy, 1)).length, "Mañana"],
              [semana.length, "Esta semana"],
              [asistencia === null ? "—" : `${asistencia}%`, "Asistencia"],
            ].map(([valor, texto]) => (
              <div key={texto} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
                <p className="text-2xl font-bold">{valor}</p>
                <p className="text-xs text-stone-500">{texto}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-teal-700 p-4 text-white">
            <p className="text-xs text-teal-100">Ingresos de citas atendidas</p>
            <p className="mt-1 text-2xl font-bold">{formatPrice(atendidas.reduce((t, c) => t + c.precio, 0))}</p>
          </div>

          <h2 className="mt-6 text-sm font-semibold text-stone-500">Siguientes citas</h2>
          <ul className="mt-2 space-y-2">
            {siguientes.length === 0 && <li className="text-sm text-stone-400">No hay citas próximas.</li>}
            {siguientes.map((c) => {
              const previas = visitasPrevias(c);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => abrir(c)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-stone-200 hover:ring-teal-600"
                  >
                    <span className={`h-9 w-1 rounded-full ${ESTADOS[c.estado].punto}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {c.cliente}
                        {previas === 0 && (
                          <span className="rounded bg-violet-100 px-1 text-[10px] font-bold text-violet-800">NUEVO</span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-stone-500">
                        <span className="first-letter:uppercase">{etiquetaCorta(c.fecha, hoy)}</span> · {c.hora} ·{" "}
                        {c.servicio}
                      </span>
                    </span>
                    {nuevas.has(c.id) && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-6 text-sm font-semibold text-stone-500">Estados</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-stone-600">
            {(["nueva", "confirmada", "atendida", "no_llego"] as const).map((e) => (
              <li key={e} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${ESTADOS[e].punto}`} />
                {ESTADOS[e].texto}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
              Bloqueado
            </li>
            <li className="flex items-center gap-2">⭐ Cliente frecuente</li>
          </ul>
          <p className="mt-6 text-xs text-stone-400">Tip: toca un espacio vacío del calendario para agregar una cita.</p>
        </aside>
      </div>

      {/* Detalle de la cita o del bloqueo */}
      {elegida && (
        <>
          <div className="fixed inset-0 z-30 bg-stone-900/30 lg:hidden" onClick={() => setSeleccion(null)} />
          <section
            aria-label="Detalle"
            className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl lg:inset-x-auto lg:top-0 lg:right-0 lg:bottom-0 lg:max-h-none lg:w-96 lg:rounded-none"
          >
            <div className="flex items-start justify-between gap-3">
              {elegida.tipo === "bloqueo" ? (
                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">🔒 Bloqueado</span>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADOS[elegida.estado].chip}`}>
                  {ESTADOS[elegida.estado].texto}
                </span>
              )}
              <button
                onClick={() => setSeleccion(null)}
                aria-label="Cerrar"
                className="rounded-full p-1 text-xl leading-none text-stone-400 hover:bg-stone-100"
              >
                ×
              </button>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{elegida.cliente}</h2>
            <p className="mt-1 text-stone-600 first-letter:uppercase">
              {formatoFecha(elegida.fecha)} · {elegida.hora}–{aHora(aMin(elegida.hora) + duracionDe(negocio, elegida))}
            </p>

            {elegida.tipo === "bloqueo" ? (
              <>
                <p className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
                  Nadie puede apartar en este horario. Quita el bloqueo para volver a abrirlo.
                </p>
                <button
                  onClick={() => {
                    cambiarEstado(elegida.id, "cancelada");
                    setSeleccion(null);
                  }}
                  className="mt-4 w-full rounded-xl border border-stone-300 py-2.5 text-sm font-semibold hover:bg-stone-50"
                >
                  Quitar bloqueo
                </button>
              </>
            ) : (
              <>
                {(() => {
                  const previas = visitasPrevias(elegida);
                  if (previas === null) return null;
                  return previas === 0 ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-900">
                      🆕 Cliente nuevo
                    </p>
                  ) : (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                      ⭐ {previas} {previas === 1 ? "visita anterior" : "visitas anteriores"}
                    </p>
                  );
                })()}

                <dl className="mt-5 divide-y divide-stone-100 rounded-2xl bg-stone-50 text-sm">
                  {[
                    ["Servicio", elegida.servicio],
                    ["Precio", formatPrice(elegida.precio)],
                    ["Duración", `${duracionDe(negocio, elegida)} min`],
                    ...(elegida.telefono ? [["WhatsApp", elegida.telefono]] : []),
                    ...(elegida.email ? [["Correo", elegida.email]] : []),
                    ["Llegó por", ORIGENES[elegida.origen] ?? elegida.origen],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-stone-500">{k}</dt>
                      <dd className="truncate text-right font-medium first-letter:uppercase">{v}</dd>
                    </div>
                  ))}
                </dl>

                {elegida.telefono && (
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <a
                      href={`https://wa.me/${telefonoCompleto(elegida.telefono)}?text=${encodeURIComponent(
                        `Hola ${elegida.cliente}, te confirmamos tu cita de ${elegida.servicio} el ${formatoFecha(
                          elegida.fecha,
                        )} a las ${elegida.hora} en ${negocio.nombre}. ¡Te esperamos!`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-green-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`tel:+${telefonoCompleto(elegida.telefono)}`}
                      className="rounded-xl border border-stone-300 py-2.5 text-center text-sm font-semibold hover:bg-stone-50"
                    >
                      Llamar
                    </a>
                  </div>
                )}

                {elegida.estado !== "cancelada" && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Cambiar estado</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["confirmada", "atendida", "no_llego"] as const).map((e) => (
                        <button
                          key={e}
                          onClick={() => cambiarEstado(elegida.id, e)}
                          disabled={elegida.estado === e}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition disabled:border-teal-600 disabled:bg-teal-50 disabled:text-teal-900 ${
                            elegida.estado === e ? "" : "border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${ESTADOS[e].punto}`} />
                          {ESTADOS[e].texto}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Cancelar la cita de ${elegida.cliente}? El horario quedará libre.`)) {
                            cambiarEstado(elegida.id, "cancelada");
                            setSeleccion(null);
                          }
                        }}
                        className="rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Cancelar cita
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {alta && (
        <NuevoModal negocio={negocio} hoy={hoy} inicial={alta} onCerrar={() => setAlta(null)} onGuardar={guardarAlta} />
      )}

      {verHuecos && (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-900/40 lg:hidden" onClick={() => setVerHuecos(false)}>
          <div className="w-full rounded-t-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            {huecos}
          </div>
        </div>
      )}

      {/* Avisos de citas nuevas */}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
        {avisos.map(({ id, cita }) => (
          <button
            key={id}
            onClick={() => {
              abrir(cita);
              setVista("dia");
              setAvisos((prev) => prev.filter((a) => a.id !== id));
            }}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl bg-stone-900 p-4 text-left text-white shadow-2xl sm:w-80"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg">🔔</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Nueva cita</span>
              <span className="block truncate text-sm text-stone-300">
                {cita.cliente} · <span className="first-letter:uppercase">{etiquetaCorta(cita.fecha, hoy)}</span> ·{" "}
                {cita.hora}
              </span>
              <span className="block truncate text-xs text-stone-400">{cita.servicio}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
