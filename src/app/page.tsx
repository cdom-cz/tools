import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TOOLS } from "@/lib/tools";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Pomocníčci</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Malí pomocníci, kteří běží přímo v prohlížeči — bez přihlášení a bez databáze.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/${tool.slug}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground transition hover:border-primary hover:shadow-md"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-xl"
                  aria-hidden
                >
                  {tool.icon}
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                    {tool.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-12 flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>Vytvořilo</span>
          <a
            href="https://www.cdom.cz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CDOM — cdom.cz"
            className="transition hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cdom-logo.svg" alt="CDOM" className="h-8 w-auto" />
          </a>
        </footer>
      </main>
    </div>
  );
}
