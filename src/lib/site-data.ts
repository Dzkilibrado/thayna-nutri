import { getSiteData } from "./site.functions";
import type { ContentBlock, SiteSettings } from "./site";

export type SiteData = { settings: SiteSettings | null; blocks: ContentBlock[] };

/**
 * Loads site data, never throwing. A transient network failure on the
 * server-function RPC would otherwise blank the whole page.
 */
export async function loadSiteData(): Promise<SiteData> {
  try {
    return await getSiteData();
  } catch (error) {
    console.error("loadSiteData failed", error);
    return { settings: null, blocks: [] };
  }
}
