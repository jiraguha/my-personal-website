import { SiteLayout } from "../../../src/ui/components/SiteLayout";

export function Layout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
