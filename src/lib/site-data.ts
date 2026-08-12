import { getSiteData } from "./site.functions";
import type { ContentBlock, SiteSettings, Testimonial } from "./site";

export type SiteData = {
  settings: SiteSettings | null;
  blocks: ContentBlock[];
  testimonials: Testimonial[];
};

/**
 * Loads site data, never throwing. A transient network failure on the
 * server-function RPC would otherwise blank the whole page.
 */
export async function loadSiteData(): Promise<SiteData> {
  try {
    return await getSiteData();
  } catch (error) {
    console.error("loadSiteData failed", error);
    return { settings: null, blocks: [], testimonials: [] };
  }
}
