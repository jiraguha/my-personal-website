import "../src/ui/index.css";
import { Nav } from "../src/ui/components/Nav";
import { Footer } from "../src/ui/components/Footer";
import { siteProfile } from "../src/ui/lib/site";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Nav profile={siteProfile} />
      <main>{children}</main>
      <Footer profile={siteProfile} />
    </div>
  );
}
