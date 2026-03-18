# 002 — Resume Download

> Status: `prototype`
> Mode: `prototype`
> Date: 2026-03-18

## Intent

Visitors can download Jean-Paul's resume as a PDF directly from the site. A resume icon+link appears alongside the existing social links (email, GitHub, LinkedIn) in both the hero card and the nav bar. The resume file is a static asset committed to the repo — no generation, no CMS, no external hosting.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts (extension to spec 001)

export interface SiteProfile {
  // ... existing fields from spec 001
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
    resume?: string;   // NEW — relative path, e.g. "/assets/resume/jean-paul-iraguha-resume.pdf"
  };
}
```

## API Acceptance Criteria

- [ ] API-1: The resume PDF is served as a static asset from `public/assets/resume/jean-paul-iraguha-resume.pdf`. No API route or server-side logic required.
- [ ] API-2: The `SiteProfile.socials.resume` field in `lib/site.ts` points to the public path of the PDF. If the field is `undefined` or empty, the resume link is not rendered anywhere.
- [ ] API-3: The build step validates that the file at `socials.resume` actually exists in `public/`. If it doesn't, the build emits a warning (not a failure) and the link is omitted.

## UI Acceptance Criteria

- [ ] UI-1: **Hero card** — a "resume" link appears after the LinkedIn icon in the social links row at the bottom of the hero card. It uses a download/document icon (e.g. `FileDown` or `FileText` from `lucide-react`) consistent in size and style with the existing email, GitHub, and LinkedIn icons.
- [ ] UI-2: **Nav bar** — a resume icon appears in the top-right icon group alongside GitHub, LinkedIn, and email, in the same style and spacing.
- [ ] UI-3: **Click behavior** — clicking the resume link triggers a browser download (via `<a href="..." download>`) rather than navigating to a new page. The downloaded filename is `jean-paul-iraguha-resume.pdf`.
- [ ] UI-4: **Tooltip** — hovering over the resume icon shows a tooltip: "Download resume".
- [ ] UI-5: **Mobile** — in the hamburger menu, "Resume" appears as a text link (with icon) below the other social links. Tapping triggers the same download behavior.
- [ ] UI-6: **Accessibility** — the link has `aria-label="Download resume as PDF"` and the icon is `aria-hidden="true"`.
- [ ] UI-7: **Graceful absence** — if `socials.resume` is not set or the file is missing, no resume icon/link is rendered anywhere. No broken links, no empty slots.

## Integration Acceptance Criteria

- [ ] E2E-1: Placing a PDF at `public/assets/resume/jean-paul-iraguha-resume.pdf` and setting `socials.resume` in `lib/site.ts` results in the resume icon appearing in both the hero card and nav bar after build.
- [ ] E2E-2: Clicking the resume icon in the deployed site initiates a file download with the correct filename and valid PDF content.
- [ ] E2E-3: Removing the `resume` field from `socials` (or deleting the PDF file) and rebuilding removes the icon from all locations with no console errors or layout shifts.
- [ ] E2E-4: The resume PDF is included in the Lighthouse accessibility audit with no violations on the download link.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | `socials.resume` not set or file missing | No resume icon anywhere. Social row shows email, GitHub, LinkedIn only. |
| Populated | PDF exists at the configured path | Resume icon appears after LinkedIn in hero and nav. Click downloads the file. |
| Error | Path is set but file doesn't exist at build time | Build logs a warning. Icon is omitted. No broken link. |

## Non-goals

- No online resume viewer / embedded PDF preview in v1 — download only.
- No resume generation from structured data (JSON Resume, etc.).
- No versioning or "last updated" badge on the resume link.
- No analytics tracking on the download (defer to Vercel Analytics `beforeSend` if needed later).

## Edge Cases

| Scenario | Layer | Expected |
|----------|-------|----------|
| PDF file is very large (> 5 MB) | Build | Build logs a warning suggesting optimization. Link still works. |
| PDF filename contains spaces or special characters | Config | The `socials.resume` path uses URL-safe naming. The `download` attribute on the `<a>` tag sets the clean filename regardless of the actual file path. |
| User has a PDF blocker or download interceptor | Browser | Standard browser behavior — outside our control. The `download` attribute provides the best-effort hint. |
| Resume is updated (new file, same path) | Deploy | Next build picks up the new file automatically. Cache-busting via Vercel's default asset hashing. |
| `socials.resume` points to an external URL | Config | Zod validation rejects external URLs — must be a relative path starting with `/assets/`. |

## Directory Structure (additions to spec 001)

```
├── public/
│   └── assets/
│       └── resume/
│           └── jean-paul-iraguha-resume.pdf   # Drop your PDF here
```

## External Dependencies

_None beyond what spec 001 already includes. No new packages required._

## Open Questions

- [ ] Should the resume link open in a new tab (for preview in browsers that support inline PDF) instead of forcing a download? Or offer both — icon click downloads, right-click "open in new tab" previews?
- [ ] Preferred icon: `FileDown` (emphasizes download action) or `FileText` (emphasizes document type)?

## Post-Implementation Notes

_Filled when status → complete. Not required for prototypes._

- ...