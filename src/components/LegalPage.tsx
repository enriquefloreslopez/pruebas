import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-stone-200 bg-stone-50">
        <nav className="mx-auto max-w-6xl px-4 py-3">
          <Link href="/" className="text-lg font-bold text-teal-800">
            {site.name}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-stone-700 [&_a]:text-teal-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-stone-900 [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h1>
        <p className="text-sm text-stone-500">Última actualización: {site.legal.updatedAt}</p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
