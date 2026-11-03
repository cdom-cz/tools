import { ToolPage, toolMetadata } from "@/components/tool-page";
import { LoremGenerator } from "@/tools/lorem/lorem-generator";

export const metadata = toolMetadata("cs", "lorem");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="lorem">
      <LoremGenerator />
    </ToolPage>
  );
}
