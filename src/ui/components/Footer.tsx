import type { SiteProfile } from "@shared/schemas/site.schema";

interface FooterProps {
  profile: SiteProfile;
}

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-500">
        <p>
          © {year} {profile.name} · Built with React + Vike + Bun ❤️
        </p>
        <p>Images powered by Nano Banana Pro 🍌</p>
        <div className="flex gap-4">
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
        </div>
      </div>
    </footer>
  );
}
