import type { Metadata } from "next";
import { InvoiceForm } from "./invoice-form";

export const metadata: Metadata = {
  title: "Generátor faktur",
  description: "Jednorázová faktura v CZK s QR platbou jako PDF",
};

// Statický prerender — PDF vzniká až v prohlížeči po kliknutí na tlačítko.
export default function FakturaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Generátor faktur</h1>
        <p className="text-sm text-muted-foreground">
          Faktura v CZK se stáhne jako PDF přímo z prohlížeče, nic se neodesílá. Údaje dodavatele, logo a podpis se
          pamatují jen v tomto prohlížeči.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
