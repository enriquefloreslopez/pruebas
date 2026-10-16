"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getNegocio } from "@/data/catalogo";
import { ahoraEn, DIAS_MAXIMOS, diaSemana, sumarDias } from "@/lib/agenda";
import { formatPrice, whatsappLink } from "@/lib/site";

type Hora = { hora: string; libre: boolean };
type Invitacion = { link: string; progreso: string; premioRecomienda: string; premioAmigo: string; meta: number };
type Resultado = { resumen: string; whatsapp: string; invitacion: Invitacion | null };
type Invitado = { quien: string; premioAmigo: string };

const sinSuscripcion = () => () => {};
const DIAS_VISIBLES = 14;

const input =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

function etiquetaDia(fecha: string, hoy: string) {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  return new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" })
    .format(new Date(`${fecha}T12:00:00Z`))
    .replace(".", "");
}

// Código de quien invitó, si llegó con un link de recomendado (?r=CODIGO).
function codigoDeInvitacion() {
  return new URLSearchParams(window.location.search).get("r")?.toUpperCase() ?? "";
}

// Canal por el que llegó la persona: ?ref=tiktok, ?utm_source=instagram, etc.
function origenDeLaVisita() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") ?? params.get("utm_source") ?? "directo";
}

export function Reservar({ slug, zona }: { slug: string; zona: string }) {
  const negocio = getNegocio(slug)!;
  // La fecha de hoy se calcula en el navegador para no fijarla al construir la página.
  const hoy = useSyncExternalStore(sinSuscripcion, () => ahoraEn(zona).fecha, () => "");

  const [servicio, setServicio] = useState(negocio.servicios[0]?.id ?? "");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horas, setHoras] = useState<Hora[] | null>(null);
  const [enLinea, setEnLinea] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [invitado, setInvitado] = useState<Invitado | null>(null);

  // Si llegó invitado por un amigo, se muestra quién lo invitó y su premio de bienvenida.
  useEffect(() => {
    const codigo = codigoDeInvitacion();
    if (!codigo) return;
    fetch(`/api/referidos?r=${encodeURIComponent(codigo)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && data.negocio?.slug === slug && setInvitado({ quien: data.quien, premioAmigo: data.premioAmigo }))
      .catch(() => {});
  }, [slug]);

  const dias = hoy
    ? Array.from({ length: Math.min(DIAS_VISIBLES, DIAS_MAXIMOS) }, (_, i) => sumarDias(hoy, i))
    : [];
  const fechaElegida = fecha || dias.find((d) => negocio.horario[diaSemana(d)]) || "";

  useEffect(() => {
    if (!fechaElegida) return;
    let vigente = true;
    fetch(`/api/disponibilidad?negocio=${slug}&fecha=${fechaElegida}&servicio=${servicio}`)
      .then((res) => res.json())
      .then((data) => {
        if (!vigente) return;
        setEnLinea(data.enLinea !== false);
        setHoras(data.horas ?? []);
      })
      .catch(() => vigente && setHoras([]));
    return () => {
      vigente = false;
    };
  }, [slug, fechaElegida, servicio, recarga]);

  function elegirFecha(d: string) {
    setFecha(d);
    setHora("");
    setHoras(null);
  }

  async function apartar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          negocio: slug,
          servicio,
          fecha: fechaElegida,
          hora,
          origen: origenDeLaVisita(),
          referido: codigoDeInvitacion(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setHora("");
          setRecarga((n) => n + 1);
        }
        throw new Error(data.error);
      }
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div className="rounded-2xl bg-teal-50 p-6 ring-1 ring-teal-200">
        <p className="text-3xl" aria-hidden="true">
          ✅
        </p>
        <h3 className="mt-2 text-xl font-bold text-teal-900">¡Listo, tu lugar está apartado!</h3>
        <p className="mt-2 text-stone-700">{resultado.resumen}.</p>
        <p className="mt-2 text-sm text-stone-600">
          {negocio.nombre} ya recibió tu cita. Si quieres, avísales por WhatsApp.
        </p>
        <a
          href={resultado.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
        >
          Avisar por WhatsApp
        </a>
        {resultado.invitacion && <TarjetaInvitar negocio={negocio.nombre} invitacion={resultado.invitacion} />}
      </div>
    );
  }

  if (!enLinea) {
    return (
      <div className="rounded-2xl bg-stone-100 p-6">
        <p className="text-stone-700">Por ahora aparta tu lugar directo por WhatsApp.</p>
        <a
          href={whatsappLink(`Hola, quiero apartar una cita en ${negocio.nombre}.`, negocio.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
        >
          Apartar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={apartar} className="space-y-6">
      {invitado && (
        <div className="flex items-center gap-3 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200">
          <span className="text-2xl" aria-hidden="true">
            🎁
          </span>
          <p className="text-sm text-violet-950">
            <b>{invitado.quien}</b> te invitó.
            {invitado.premioAmigo && (
              <>
                {" "}
                Recibes <b>{invitado.premioAmigo}</b> en tu primera visita.
              </>
            )}
          </p>
        </div>
      )}
      <fieldset>
        <legend className="mb-2 font-semibold">1. ¿Qué te vas a hacer?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {negocio.servicios.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                servicio === s.id ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20" : "border-stone-300 bg-white"
              }`}
            >
              <span>
                <input
                  type="radio"
                  name="servicio-radio"
                  value={s.id}
                  checked={servicio === s.id}
                  onChange={() => {
                    setServicio(s.id);
                    setHora("");
                    setHoras(null);
                  }}
                  className="sr-only"
                />
                <span className="block font-medium">{s.nombre}</span>
                <span className="text-sm text-stone-500">{s.minutos} min</span>
              </span>
              <span className="font-semibold text-teal-800">{formatPrice(s.precio)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">2. ¿Qué día?</legend>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {dias.map((d) => {
            const abierto = !!negocio.horario[diaSemana(d)];
            const activo = d === fechaElegida;
            return (
              <button
                key={d}
                type="button"
                disabled={!abierto}
                onClick={() => elegirFecha(d)}
                aria-pressed={activo}
                className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 text-sm transition disabled:opacity-40 ${
                  activo ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 bg-white"
                }`}
              >
                <span className="capitalize">{etiquetaDia(d, hoy)}</span>
                <span className="text-lg font-bold">{Number(d.slice(8))}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">3. ¿A qué hora?</legend>
        {horas === null ? (
          <p className="text-sm text-stone-500">Buscando horarios…</p>
        ) : horas.length === 0 ? (
          <p className="text-sm text-stone-500">No hay horarios ese día. Prueba otro.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {horas.map((h) => (
              <button
                key={h.hora}
                type="button"
                disabled={!h.libre}
                onClick={() => setHora(h.hora)}
                aria-pressed={hora === h.hora}
                className={`rounded-lg border py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300 disabled:line-through ${
                  hora === h.hora ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 bg-white"
                }`}
              >
                {h.hora}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {hora && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">4. Tus datos</legend>
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
              Nombre
            </label>
            <input id="nombre" name="nombre" required maxLength={80} autoComplete="name" className={input} />
          </div>
          <div>
            <label htmlFor="telefono" className="mb-1 block text-sm font-medium">
              WhatsApp
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              autoComplete="tel"
              placeholder="10 dígitos"
              className={input}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Correo <span className="font-normal text-stone-500">(opcional)</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={input} />
          </div>
          <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!hora || enviando}
        className="w-full rounded-full bg-teal-700 px-6 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
      >
        {enviando ? "Apartando…" : hora ? `Apartar a las ${hora}` : "Elige un horario"}
      </button>
      <p className="text-center text-xs text-stone-500">
        Al apartar aceptas el{" "}
        <Link href="/privacidad" className="underline underline-offset-2">
          aviso de privacidad
        </Link>
        . Apartar es gratis.
      </p>
    </form>
  );
}

function TarjetaInvitar({ negocio, invitacion }: { negocio: string; invitacion: Invitacion }) {
  const amigos = invitacion.meta === 1 ? "a un amigo" : `a ${invitacion.meta} amigos`;
  const mensaje = [
    `¡Te recomiendo ${negocio}! 🙌`,
    invitacion.premioAmigo ? `Aparta con mi link y recibe ${invitacion.premioAmigo} en tu primera visita:` : "Aparta aquí tu cita:",
    invitacion.link,
  ].join("\n");
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 text-white">
      <p className="text-2xl" aria-hidden="true">
        🎁
      </p>
      <h4 className="mt-1 text-lg font-bold">Gana {invitacion.premioRecomienda}</h4>
      <p className="mt-1 text-sm text-violet-100">
        Invita {amigos} con tu link personal. Cuenta cuando tu amigo viene por primera vez.
        {invitacion.premioAmigo && ` Ellos reciben ${invitacion.premioAmigo}.`}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-5 py-2.5 text-center font-semibold text-violet-700 hover:bg-violet-50"
        >
          Invitar por WhatsApp
        </a>
        <a
          href={invitacion.progreso}
          className="rounded-full px-5 py-2.5 text-center font-semibold text-white ring-1 ring-white/60 hover:bg-white/10"
        >
          Ver mis recompensas
        </a>
      </div>
      <p className="mt-3 text-xs text-violet-200">Aplican las condiciones del negocio.</p>
    </div>
  );
}
