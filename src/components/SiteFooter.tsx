import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";

const legalLinks = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Aviso de privacidad" },
  { href: "/reembolsos", label: "Cancelaciones y reembolsos" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 py-10 text-sm text-stone-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:justify-between">
        <div>
          <p className="font-semibold text-stone-700">{site.name}</p>
          <p className="mt-1">{site.tagline}</p>
          <p className="mt-3">
            Contacto:{" "}
            <a href={`mailto:${site.legal.email}`} className="underline underline-offset-2">
              {site.legal.email}
            </a>
            {" · "}
            <a
              href={whatsappLink(`Hola, quiero información de ${site.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              WhatsApp
            </a>
          </p>
        </div>
        <nav aria-label="Legal">
          <ul className="space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-teal-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
