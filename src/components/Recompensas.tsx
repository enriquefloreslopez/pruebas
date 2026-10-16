"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Datos = {
  negocio: { slug: string; nombre: string };
  quien: string;
  premioRecomienda: string;
  premioAmigo: string;
  meta: number;
  amigos: number;
  disponibles: number;
  canjeados: number;
  link: string;
};

export function Recompensas() {
  const { codigo } = useParams<{ codigo: string }>();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/referidos?r=${encodeURIComponent(codigo)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDatos(data);
      })
      .catch((err) => setError(err.message || "No encontramos esta invitación."));
  }, [codigo]);

  if (error) return <p className="rounded-2xl bg-white p-6 text-center text-stone-600 ring-1 ring-stone-200">{error}</p>;
  if (!datos) return <p className="text-center text-stone-500">Cargando…</p>;

  // Avance hacia el siguiente premio.
  const enCurso = datos.amigos % datos.meta;
  const mensaje = [
    `¡Te recomiendo ${datos.negocio.nombre}! 🙌`,
    datos.premioAmigo ? `Aparta con mi link y recibe ${datos.premioAmigo} en tu primera visita:` : "Aparta aquí tu cita:",
    datos.link,
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white">
        <p className="text-sm text-violet-100">{datos.negocio.nombre}</p>
        <h1 className="mt-1 text-2xl font-bold">Hola, {datos.quien} 👋</h1>
        <p className="mt-2 text-violet-100">
          Invita amigos y gana <b className="text-white">{datos.premioRecomienda}</b>
          {datos.meta > 1 ? ` por cada ${datos.meta} amigos que vengan.` : " por cada amigo que venga."}
        </p>

        {datos.meta > 1 && (
          <div className="mt-5">
            <div className="flex gap-2">
              {Array.from({ length: datos.meta }, (_, i) => (
                <span
                  key={i}
                  className={`flex h-10 flex-1 items-center justify-center rounded-xl text-lg ${
                    i < enCurso ? "bg-white text-violet-700" : "bg-white/20"
                  }`}
                >
                  {i < enCurso ? "✓" : ""}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-violet-100">
              {enCurso} de {datos.meta} amigos para tu siguiente premio
            </p>
          </div>
        )}
      </div>

      {datos.disponibles > 0 && (
        <div className="rounded-3xl bg-amber-50 p-6 text-center ring-2 ring-amber-300">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mt-2 text-xl font-bold text-amber-950">
            ¡Tienes {datos.disponibles} {datos.disponibles === 1 ? "premio" : "premios"}!
          </h2>
          <p className="mt-1 text-amber-900">
            {datos.premioRecomienda}. Muestra esta pantalla en {datos.negocio.nombre} para usarlo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [datos.amigos, datos.amigos === 1 ? "amigo vino" : "amigos vinieron"],
          [datos.disponibles, "por usar"],
          [datos.canjeados, "ya usados"],
        ].map(([n, t]) => (
          <div key={t} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <p className="text-2xl font-bold">{n}</p>
            <p className="text-xs text-stone-500">{t}</p>
          </div>
        ))}
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-full bg-green-600 py-3.5 text-center font-semibold text-white hover:bg-green-700"
      >
        Invitar amigos por WhatsApp
      </a>
      <p className="text-center text-sm text-stone-500">
        Cuenta cuando tu amigo viene por primera vez y lo atienden.{" "}
        {datos.premioAmigo && `Tu amigo recibe ${datos.premioAmigo}. `}
        <Link href={`/n/${datos.negocio.slug}`} className="underline">
          Ver {datos.negocio.nombre}
        </Link>
      </p>
    </div>
  );
}
