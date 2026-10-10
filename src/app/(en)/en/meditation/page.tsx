import { ToolPage, toolMetadata } from "@/components/tool-page";
import { MeditationScreen } from "@/tools/meditation/meditation-screen";

export const metadata = toolMetadata("en", "meditation");

export default function Page() {
  return (
    <ToolPage locale="en" tool="meditation">
      <MeditationScreen />
    </ToolPage>
  );
}
