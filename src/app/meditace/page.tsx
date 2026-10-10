import type { Metadata } from "next";
import { MeditationScreen } from "./meditation-screen";

export const metadata: Metadata = {
  title: "Meditace",
  description: "Meditační timer s bloky a jemným gongem",
};

// Stránka nečte session ani DB, veškerý stav žije v localStorage na klientu,
// takže se staticky prerenderuje.
export default function MeditacePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Meditace</h1>
        <p className="text-sm text-muted-foreground">
          Nastav počet a délku bloků, na konci každého zazní jemný gong. Nastavení se ukládá v tomto prohlížeči.
        </p>
      </div>
      <MeditationScreen />
    </div>
  );
}
