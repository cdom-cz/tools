import { ToolPage, toolMetadata } from "@/components/tool-page";
import { InvoiceForm } from "@/tools/invoice/invoice-form";

export const metadata = toolMetadata("cs", "invoice");

export default function Page() {
  return (
    <ToolPage locale="cs" tool="invoice">
      <InvoiceForm />
    </ToolPage>
  );
}
