"use client";

import { useState, useSyncExternalStore } from "react";
import { addDays, demoBusiness, slotsFor, todayInBusinessZone } from "@/lib/demo";
import { formatPrice } from "@/lib/site";

type Result = { summary: string; confirmUrl: string; emailSent: boolean };

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";

const noopSubscribe = () => () => {};

export function BookingForm() {
  // La fecha mínima se calcula en el navegador para no fijarla al construir la página.
  const minDate = useSyncExternalStore(noopSubscribe, todayInBusinessZone, () => "");
  const [date, setDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const slots = date ? slotsFor(date) : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-stone-800">
        <h3 className="text-xl font-bold text-rose-900">¡Cita solicitada!</h3>
        <p className="mt-2">{result.summary}.</p>
        <p className="mt-2 text-sm text-stone-600">
          {result.emailSent
            ? "Te enviamos los detalles por correo."
            : "Para asegurar tu lugar, confírmala por WhatsApp."}
        </p>
        <a
          href={result.confirmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Confirmar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="service" className="mb-1 block text-sm font-medium">
          Servicio
        </label>
        <select id="service" name="service" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Elige un servicio
          </option>
          {demoBusiness.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · {service.duration} · {formatPrice(service.price)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium">
          Fecha
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          min={minDate || undefined}
          max={minDate ? addDays(minDate, demoBusiness.maxDaysAhead) : undefined}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="time" className="mb-1 block text-sm font-medium">
          Hora
        </label>
        <select
          id="time"
          name="time"
          required
          disabled={slots.length === 0}
          className={inputClass}
          defaultValue=""
          key={date}
        >
          <option value="" disabled>
            {!date ? "Primero elige fecha" : slots.length ? "Elige hora" : "Cerrado ese día"}
          </option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Nombre
        </label>
        <input id="name" name="name" required maxLength={80} autoComplete="name" className={inputClass} />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="10 dígitos"
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Correo <span className="font-normal text-stone-500">(opcional)</span>
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
      </div>

      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60 sm:col-span-2"
      >
        {sending ? "Reservando…" : "Reservar cita"}
      </button>

      <p className="text-xs text-stone-500 sm:col-span-2">
        Al reservar aceptas el{" "}
        <a href="/privacidad" className="underline underline-offset-2">
          aviso de privacidad
        </a>
        .
      </p>
    </form>
  );
}
