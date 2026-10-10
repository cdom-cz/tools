import { HomePage, homeMetadata } from "@/components/home-page";

export const metadata = homeMetadata("cs");

export default function Page() {
  return <HomePage locale="cs" />;
}
