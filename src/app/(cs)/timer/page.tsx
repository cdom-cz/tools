import { ToolPage, toolMetadata } from "@/components/tool-page";
import { TimerScreen } from "@/tools/timer/timer-screen";

export const metadata = toolMetadata("cs", "timer");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="timer">
      <TimerScreen />
    </ToolPage>
  );
}
