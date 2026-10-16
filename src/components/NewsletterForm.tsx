"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("done");
      setMessage("¡Listo! Te llegará nuestro próximo consejo.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error && err.message ? err.message : "Intenta de nuevo.");
    }
  }

  if (status === "done") {
    return <p className="font-semibold text-teal-800">{message}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Correo electrónico
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="tu@correo.com"
        className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
      />
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-teal-700 px-6 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Suscribirme"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700 sm:basis-full">
          {message}
        </p>
      )}
    </form>
  );
}
