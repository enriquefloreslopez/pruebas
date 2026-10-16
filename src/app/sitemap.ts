import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { negocios, seccionesActivas } from "@/data/catalogo";

const base = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const reales = negocios.filter((n) => !n.demo);
  const secciones = seccionesActivas().filter((s) =>
    reales.some((n) => n.ciudad === s.ciudad && n.categoria === s.categoria),
  );
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/para-negocios`, changeFrequency: "monthly", priority: 0.5 },
    ...secciones.map((s) => ({ url: `${base}/${s.ciudad}/${s.categoria}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...reales.map((n) => ({ url: `${base}/n/${n.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
