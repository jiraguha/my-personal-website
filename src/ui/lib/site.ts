import { SiteProfileSchema, type SiteProfile } from "@shared/schemas/site.schema";
import rawProfile from "@content/profile.json";

export const siteProfile: SiteProfile = SiteProfileSchema.parse(rawProfile);
