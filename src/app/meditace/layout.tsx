import { SiteHeader } from "@/components/site-header";

export default function MeditaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader title="Meditace" />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
