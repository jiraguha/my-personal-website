import type { SiteProfile } from "@shared/schemas/site.schema";

interface FooterProps {
  profile: SiteProfile;
}

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              © {year} {profile.name}
            </p>
            <p>Built with React + Vike + Bun ❤️</p>
          </div>
          <nav className="flex gap-5">
            {profile.socials.github && (
              <a
                href={profile.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                GitHub
              </a>
            )}
            {profile.socials.linkedin && (
              <a
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {profile.socials.email && (
              <a
                href={profile.socials.email}
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Email
              </a>
            )}
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500">
          Images powered by Nano Banana Pro 🍌
        </div>
      </div>
    </footer>
  );
}
