import { ToolPage, toolMetadata } from "@/components/tool-page";
import { PasswordGenerator } from "@/tools/passwords/password-generator";

export const metadata = toolMetadata("cs", "passwords");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="passwords">
      <PasswordGenerator />
    </ToolPage>
  );
}
