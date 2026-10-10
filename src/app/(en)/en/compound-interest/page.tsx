import { ToolPage, toolMetadata } from "@/components/tool-page";
import { CompoundCalculator } from "@/tools/compound/compound-calculator";

export const metadata = toolMetadata("en", "compound");

export default function Page() {
  return (
    <ToolPage locale="en" tool="compound">
      <CompoundCalculator />
    </ToolPage>
  );
}
