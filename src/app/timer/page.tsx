import type { Metadata } from "next";
import { TimerScreen } from "./timer-screen";

export const metadata: Metadata = {
  title: "Timer",
  description: "Intervalový timer pro HIIT a kruhový trénink",
};

// Žádné `dynamic = "force-dynamic"` (na rozdíl od stránek v (app)) — stránka
// nečte session ani DB, veškerý stav žije v localStorage na klientu, takže se
// může staticky prerenderovat.
export default function TimerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Timer</h1>
        <p className="text-sm text-muted-foreground">
          Intervalový timer pro HIIT a kruhový trénink. Nastavení se ukládá v tomto prohlížeči.
        </p>
      </div>
      <TimerScreen />
    </div>
  );
}
