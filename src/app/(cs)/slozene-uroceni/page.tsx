import { ToolPage, toolMetadata } from "@/components/tool-page";
import { CompoundCalculator } from "@/tools/compound/compound-calculator";

export const metadata = toolMetadata("cs", "compound");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="compound">
      <CompoundCalculator />
    </ToolPage>
  );
}
