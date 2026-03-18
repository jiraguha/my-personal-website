import { useState } from "react";
import type { SiteProfile } from "@shared/schemas/site.schema";

interface HeroProps {
  profile: SiteProfile;
}

export function Hero({ profile }: HeroProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="py-16 sm:py-24 text-center">
      <div className="flex flex-col items-center gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
          {imgFailed ? (
            <span className="text-3xl font-bold text-white">
              {profile.name.charAt(0)}
            </span>
          ) : (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        {/* Name + role */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {profile.name}
          </h1>
          <p className="mt-2 text-lg text-indigo-600 dark:text-indigo-400 font-medium">
            {profile.role} · {profile.org}
          </p>
        </div>

        {/* Bio */}
        <p className="max-w-xl text-gray-600 dark:text-gray-400 leading-relaxed text-base sm:text-lg">
          {profile.bio}
        </p>

        {/* Social links */}
        <div className="flex gap-4 mt-2">
          {profile.socials.github && (
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              GitHub
            </a>
          )}
          {profile.socials.linkedin && (
            <a
              href={profile.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              LinkedIn
            </a>
          )}
          {profile.socials.email && (
            <a
              href={profile.socials.email}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Get in touch
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
