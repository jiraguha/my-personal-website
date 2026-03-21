import type { SiteProfile } from "@shared/schemas/site.schema";

interface FooterProps {
  profile: SiteProfile;
}

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span>© {year} {profile.name}</span>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>Built with</span>
          <span className="inline-flex items-center gap-1" title="React">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 10.11a1.87 1.87 0 1 1 0 3.74 1.87 1.87 0 0 1 0-3.74Zm6.77-1.65a19.6 19.6 0 0 0-.73-1.78l.06-.15c.54-1.46.86-2.8.86-3.87 0-1.58-.78-2.33-1.96-2.33-1.47 0-3.37 1.01-5 2.53A16.4 16.4 0 0 0 12 3c-1.47-.02-3.37-.96-5 .86C5.78.68 4.96 1.43 4.96 3c0 1.07.32 2.41.86 3.87l.06.15a19.6 19.6 0 0 0-.73 1.78C3.15 11.2 2 13.23 2 14.67c0 1.58.78 2.33 1.96 2.33 1.47 0 3.37-1.01 5-2.53.46.46.94.87 1.42 1.21l-.06.15c-.54 1.46-.86 2.8-.86 3.87 0 1.58.78 2.33 1.96 2.33h1.16c1.18 0 1.96-.75 1.96-2.33 0-1.07-.32-2.41-.86-3.87l-.06-.15c.48-.34.96-.75 1.42-1.21 1.63 1.52 3.53 2.53 5 2.53 1.18 0 1.96-.75 1.96-2.33 0-1.44-1.15-3.47-3.15-5.87Z" />
            </svg>
            React
          </span>
          <span>+</span>
          <span className="inline-flex items-center gap-1" title="Vike">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3l11 18L23 3" />
            </svg>
            Vike
          </span>
          <span>+</span>
          <span className="inline-flex items-center gap-1" title="Bun">
            <svg className="w-3.5 h-3.5" viewBox="0 0 80 70" fill="currentColor">
              <path d="M73,35.7c0,15.21-15.67,27.54-35,27.54S3,50.91,3,35.7C3,26.27,9,17.94,18.22,13S33.18,3,38,3s8.94,4.13,19.78,10C67,17.94,73,26.27,73,35.7Z" />
              <path d="M38,65.75C17.32,65.75.5,52.27.5,35.7c0-10,6.18-19.33,16.53-24.92,3-1.6,5.57-3.21,7.86-4.62,1.26-.78,2.45-1.51,3.6-2.19C32,1.89,35,.5,38,.5s5.62,1.2,8.9,3.14c1,.57,2,1.19,3.07,1.87,2.49,1.54,5.3,3.28,9,5.27C69.32,16.37,75.5,25.69,75.5,35.7,75.5,52.27,58.68,65.75,38,65.75ZM38,3c-2.42,0-5,1.25-8.25,3.13-1.13.66-2.3,1.39-3.54,2.15-2.33,1.44-5,3.07-8,4.7C8.69,18.13,3,26.62,3,35.7,3,50.89,18.7,63.25,38,63.25S73,50.89,73,35.7C73,26.62,67.31,18.13,57.78,13,54,11,51.05,9.12,48.66,7.64c-1.09-.67-2.09-1.29-3-1.84C42.63,4,40.42,3,38,3Z" />
            </svg>
            Bun
          </span>
          <span>·</span>
          <span>Images powered by Nano Banana Pro 🍌</span>
        </div>
      </div>
    </footer>
  );
}
