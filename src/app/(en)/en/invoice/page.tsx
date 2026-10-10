import { ToolPage, toolMetadata } from "@/components/tool-page";
import { InvoiceForm } from "@/tools/invoice/invoice-form";

export const metadata = toolMetadata("en", "invoice");

export default function Page() {
  return (
    <ToolPage locale="en" tool="invoice">
      <InvoiceForm />
    </ToolPage>
  );
}
