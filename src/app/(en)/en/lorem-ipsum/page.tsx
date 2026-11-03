import { ToolPage, toolMetadata } from "@/components/tool-page";
import { LoremGenerator } from "@/tools/lorem/lorem-generator";

export const metadata = toolMetadata("en", "lorem");

export default function Page() {
  return (
    <ToolPage locale="en" tool="lorem">
      <LoremGenerator />
    </ToolPage>
  );
}
