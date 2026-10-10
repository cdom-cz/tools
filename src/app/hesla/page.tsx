import type { Metadata } from "next";
import { PasswordGenerator } from "./password-generator";

export const metadata: Metadata = {
  title: "Generátor hesel",
  description: "Silná náhodná hesla a snadno zapamatovatelné fráze",
};

// Statický prerender — hesla se generují až v prohlížeči po mountu.
export default function HeslaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Generátor hesel</h1>
        <p className="text-sm text-muted-foreground">
          Hesla vznikají přímo v prohlížeči a nikam se neodesílají. Nastavení se ukládá v tomto prohlížeči.
        </p>
      </div>
      <PasswordGenerator />
    </div>
  );
}
