/**
 * Unit tests for 002-Resume_Download.
 * Covers API-2 (schema validation) and UI contract assertions.
 */

import { describe, it, expect } from "vitest";
import { SiteProfileSchema } from "../../src/shared/schemas/site.schema";

const baseProfile = {
  siteUrl: "http://localhost:4173",
  name: "Jean-Paul Iraguha",
  role: "Software Engineer",
  org: "SingularFlow",
  bio: "Test bio.",
  avatar: "/assets/authors/jp.png",
  socials: {},
};

// ---------------------------------------------------------------------------
// API-2: Schema validation
// ---------------------------------------------------------------------------
describe("API-2: SiteProfile resume field validation", () => {
  it("accepts a valid /assets/ path", () => {
    const result = SiteProfileSchema.safeParse({
      ...baseProfile,
      socials: { resume: "/assets/resume/jean-paul-iraguha-resume.pdf" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined (resume omitted)", () => {
    const result = SiteProfileSchema.safeParse(baseProfile);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.socials.resume).toBeUndefined();
  });

  it("rejects an external URL", () => {
    const result = SiteProfileSchema.safeParse({
      ...baseProfile,
      socials: { resume: "https://example.com/resume.pdf" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a path not starting with /assets/", () => {
    const result = SiteProfileSchema.safeParse({
      ...baseProfile,
      socials: { resume: "/files/resume.pdf" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts other social fields alongside resume", () => {
    const result = SiteProfileSchema.safeParse({
      ...baseProfile,
      socials: {
        github: "https://github.com/jiraguha",
        linkedin: "https://linkedin.com/in/jiraguha",
        email: "mailto:jp@iraguha.dev",
        resume: "/assets/resume/jean-paul-iraguha-resume.pdf",
      },
    });
    expect(result.success).toBe(true);
  });
});
