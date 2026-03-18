# 002 — Resume Download

> Status: `complete`
> Mode: `full`
> Date: 2026-03-18

## Intent

Visitors can download Jean-Paul's resume as a PDF directly from the site.
A resume icon+link appears in the hero card social links row. The file is
a static asset — no generation, no CMS, no external hosting.

## Shared Schema

```typescript
// src/shared/schemas/site.schema.ts
socials: z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  email: z.string().optional(),
  resume: z.string().startsWith("/assets/").optional(),
})
```

## API Acceptance Criteria

- [x] API-1: Resume PDF served as static asset from `public/assets/resume/jean-paul-iraguha-resume.pdf`.
- [x] API-2: `SiteProfile.socials.resume` is a Zod-validated optional field (must start with `/assets/`). If unset, no resume link renders anywhere.

## UI Acceptance Criteria

- [x] UI-1: Hero card social row shows a resume link after LinkedIn, using a filled contact-card SVG icon consistent with other icons.
- [x] UI-3: Click triggers browser download via `<a download="jean-paul-iraguha-resume.pdf">`.
- [x] UI-4: `title="Download resume"` provides a native tooltip on hover.
- [x] UI-6: Link has `aria-label="Download resume as PDF"`, icon has `aria-hidden="true"`.
- [x] UI-7: When `socials.resume` is unset, no resume icon renders in the hero.

## Integration Acceptance Criteria

- [x] E2E-1: Setting `socials.resume` in `lib/site.ts` renders the resume link in the hero card.
- [ ] E2E-2: Clicking the resume link initiates a file download.
- [x] E2E-3: Removing `resume` from `socials` removes the icon from the hero with no errors or layout shifts.

## Component States

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| Empty | `socials.resume` not set | No resume icon. Social row shows email, GitHub, LinkedIn only. |
| Populated | Path set | Resume icon appears after LinkedIn in hero. Click downloads. |

## Non-goals

- No nav bar placement — hero only.
- No online PDF preview — download only.
- No resume generation, versioning, or analytics tracking.
- No build-time file existence check.

## Edge Cases

| Scenario | Expected |
|----------|----------|
| External URL in `socials.resume` | Zod rejects — must start with `/assets/`. |
| `socials.resume` set but PDF missing | Browser 404 on download — outside app control. |

## External Dependencies

None beyond spec 001.

## Post-Implementation Notes

- Resume link placed in hero card only (nav placement explicitly removed).
- Icon is a filled contact-card SVG using `fill-rule: evenodd` to punch out the person silhouette — consistent with GitHub/LinkedIn filled icons.
- Zod enforces `/assets/` prefix to prevent external URL injection.
