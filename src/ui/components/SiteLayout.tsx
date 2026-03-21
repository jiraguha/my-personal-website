import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { siteProfile } from "../lib/site";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Nav profile={siteProfile} />
      <main>{children}</main>
      <Footer profile={siteProfile} />
    </div>
  );
}
