import { HomePage, homeMetadata } from "@/components/home-page";

export const metadata = homeMetadata("en");

export default function Page() {
  return <HomePage locale="en" />;
}
