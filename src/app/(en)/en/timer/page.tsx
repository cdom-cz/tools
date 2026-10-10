import { ToolPage, toolMetadata } from "@/components/tool-page";
import { TimerScreen } from "@/tools/timer/timer-screen";

export const metadata = toolMetadata("en", "timer");

export default function Page() {
  return (
    <ToolPage locale="en" tool="timer">
      <TimerScreen />
    </ToolPage>
  );
}
