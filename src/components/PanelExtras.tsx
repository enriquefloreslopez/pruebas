"use client";

import { useState } from "react";
import { getCategoria, type Negocio } from "@/data/catalogo";
import { aMinutos, horariosDelDia, horariosLibres, sumarDias, type Ocupante } from "@/lib/agenda";
import { formatPrice } from "@/lib/site";

const campo =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

// Horarios libres de un día en los que cabe el servicio más corto.
export function huecosDe(negocio: Negocio, fecha: string, ocupantes: Ocupante[], desdeMinuto: number) {
  const corto = Math.min(...negocio.servicios.map((s) => s.minutos));
  return horariosLibres(negocio, fecha, ocupantes, corto)
    .filter((h) => h.libre && aMinutos(h.hora) >= desdeMinuto)
    .map((h) => h.hora);
}

export function Huecos({
  negocio,
  hoy,
  ahora,
  ocupantesDe,
}: {
  negocio: Negocio;
  hoy: string;
  ahora: number;
  ocupantesDe: (fecha: string) => Ocupante[];
}) {
  const [dia, setDia] = useState<"hoy" | "manana">("hoy");
  const [copiado, setCopiado] = useState(false);
  const fecha = dia === "hoy" ? hoy : sumarDias(hoy, 1);
  const huecos = huecosDe(negocio, fecha, ocupantesDe(fecha), dia === "hoy" ? ahora + 30 : 0);
  const emoji = getCategoria(negocio.categoria)?.emoji ?? "📅";
  const desde = Math.min(...negocio.servicios.map((s) => s.precio));

  function mensaje() {
    const link = `${window.location.origin}/n/${negocio.slug}?ref=estado`;
    return [
      `🔥 ¡${dia === "hoy" ? "Hoy" : "Mañana"} tenemos lugares libres en ${negocio.nombre}!`,
      `⏰ ${huecos.slice(0, 8).join(" · ")}`,
      `${emoji} Servicios desde ${formatPrice(desde)}`,
      `Aparta en segundos 👉 ${link}`,
    ].join("\n");
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el navegador no deja copiar, queda el botón de WhatsApp.
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-950">🔥 Huecos libres</p>
        <div className="flex rounded-lg bg-white/70 p-0.5 text-xs font-medium">
          {(
            [
              ["hoy", "Hoy"],
              ["manana", "Mañana"],
            ] as const
          ).map(([id, texto]) => (
            <button
              key={id}
              onClick={() => setDia(id)}
              aria-pressed={dia === id}
              className={`rounded-md px-2 py-0.5 ${dia === id ? "bg-white shadow-sm" : "text-stone-500"}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>
      {huecos.length === 0 ? (
        <p className="mt-3 text-sm text-amber-900">¡Agenda llena! 🎉 No quedan lugares.</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-amber-900/80">
            {huecos.length} {huecos.length === 1 ? "lugar sin ocupar" : "lugares sin ocupar"}. Compártelos para llenarlos.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {huecos.slice(0, 12).map((h) => (
              <span key={h} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                {h}
              </span>
            ))}
            {huecos.length > 12 && <span className="px-1 py-1 text-xs text-amber-900">+{huecos.length - 12}</span>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(mensaje())}`, "_blank", "noopener")}
              className="rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Compartir
            </button>
            <button
              onClick={copiar}
              className="rounded-xl bg-white py-2 text-sm font-semibold ring-1 ring-amber-300 hover:bg-amber-50"
            >
              {copiado ? "¡Copiado!" : "Copiar texto"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const MOTIVOS = ["Comida", "Descanso", "Día libre", "Pendiente personal"];

export function NuevoModal({
  negocio,
  hoy,
  inicial,
  onCerrar,
  onGuardar,
}: {
  negocio: Negocio;
  hoy: string;
  inicial: { fecha: string; hora: string };
  onCerrar: () => void;
  onGuardar: (datos: Record<string, unknown>) => Promise<string | null>;
}) {
  const [tipo, setTipo] = useState<"cita" | "bloqueo">("cita");
  const [fecha, setFecha] = useState(inicial.fecha < hoy ? hoy : inicial.fecha);
  const horas = horariosDelDia(negocio, fecha);
  const [hora, setHora] = useState(inicial.hora);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const horaValida = horas.includes(hora) ? hora : (horas[0] ?? "");
  const rango = negocio.horario[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
  const hastaCierre = rango ? aMinutos(rango[1]) - aMinutos(horaValida || rango[0]) : 0;

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setGuardando(true);
    setError("");
    const problema = await onGuardar({ ...form, tipo, fecha, hora: horaValida, motivo });
    setGuardando(false);
    if (problema) setError(problema);
    else onCerrar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 sm:items-center" onClick={onCerrar}>
      <form
        onSubmit={guardar}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Agregar a la agenda</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-2xl leading-none text-stone-400">
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-medium">
          {(
            [
              ["cita", "📅 Cita"],
              ["bloqueo", "🔒 Bloquear horario"],
            ] as const
          ).map(([id, texto]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTipo(id)}
              aria-pressed={tipo === id}
              className={`rounded-lg py-2 ${tipo === id ? "bg-white shadow-sm" : "text-stone-500"}`}
            >
              {texto}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Día</span>
            <input
              type="date"
              value={fecha}
              min={hoy}
              max={sumarDias(hoy, 30)}
              onChange={(e) => setFecha(e.target.value)}
              className={campo}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Hora</span>
            <select value={horaValida} onChange={(e) => setHora(e.target.value)} className={campo} disabled={!horas.length}>
              {horas.length === 0 && <option value="">Cerrado</option>}
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>

        {tipo === "cita" ? (
          <div className="mt-3 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Servicio</span>
              <select name="servicio" className={campo} defaultValue={negocio.servicios[0]?.id}>
                {negocio.servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} · {s.minutos} min · {formatPrice(s.precio)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Nombre del cliente</span>
              <input name="nombre" required minLength={2} maxLength={80} className={campo} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                WhatsApp <span className="font-normal text-stone-500">(opcional)</span>
              </span>
              <input name="telefono" type="tel" placeholder="10 dígitos" className={campo} />
            </label>
            <fieldset className="text-sm">
              <legend className="mb-1 font-medium">¿Cómo llegó?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["mostrador", "🚶 Al local"],
                    ["telefono", "📞 Por teléfono"],
                  ] as const
                ).map(([valor, texto], i) => (
                  <label key={valor} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                    <input type="radio" name="origen" value={valor} defaultChecked={i === 0} className="accent-teal-700" />
                    {texto}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">¿Por cuánto tiempo?</span>
              <select name="minutos" className={campo} defaultValue={60}>
                {[30, 60, 90, 120, 180]
                  .filter((m) => m >= negocio.intervalo && m < hastaCierre)
                  .map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} min` : `${m / 60} h`.replace(".5", "½")}
                    </option>
                  ))}
                {hastaCierre > 0 && <option value={hastaCierre}>Hasta el cierre</option>}
              </select>
            </label>
            <div className="text-sm">
              <span className="mb-1 block font-medium">Motivo</span>
              <div className="flex flex-wrap gap-2">
                {MOTIVOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivo(m)}
                    aria-pressed={motivo === m}
                    className={`rounded-full px-3 py-1.5 ${
                      motivo === m ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando || !horaValida}
          className="mt-5 w-full rounded-xl bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : tipo === "cita" ? "Agregar cita" : "Bloquear horario"}
        </button>
      </form>
    </div>
  );
}
