import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Sdílená hlavička — logo vede na rozcestník, vpravo přepínač motivu. */
export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="Tools — rozcestník">
            <span className="flex items-center gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal-medium" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal-other" />
            </span>
            <span className="text-base font-semibold tracking-tight">Tools</span>
          </Link>
          {title && (
            <>
              <span className="text-muted-foreground" aria-hidden>/</span>
              <span className="text-base font-semibold tracking-tight">{title}</span>
            </>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
