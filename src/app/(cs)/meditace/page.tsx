import { ToolPage, toolMetadata } from "@/components/tool-page";
import { MeditationScreen } from "@/tools/meditation/meditation-screen";

export const metadata = toolMetadata("cs", "meditation");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="meditation">
      <MeditationScreen />
    </ToolPage>
  );
}
