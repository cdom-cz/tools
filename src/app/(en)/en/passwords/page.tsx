import { ToolPage, toolMetadata } from "@/components/tool-page";
import { PasswordGenerator } from "@/tools/passwords/password-generator";

export const metadata = toolMetadata("en", "passwords");

export default function Page() {
  return (
    <ToolPage locale="en" tool="passwords">
      <PasswordGenerator />
    </ToolPage>
  );
}
