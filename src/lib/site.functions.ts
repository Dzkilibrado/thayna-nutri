import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import {
  BLOCK_COLUMNS,
  SETTINGS_COLUMNS,
  TESTIMONIAL_COLUMNS,
  type ContentBlock,
  type SiteSettings,
  type Testimonial,
} from "./site";

export const getSiteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    settings: SiteSettings | null;
    blocks: ContentBlock[];
    testimonials: Testimonial[];
  }> => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const [settingsRes, blocksRes, testimonialsRes] = await Promise.all([
      supabase.from("site_settings").select(SETTINGS_COLUMNS).limit(1).maybeSingle(),
      supabase
        .from("content_blocks")
        .select(BLOCK_COLUMNS)
        .eq("published", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("testimonials")
        .select(TESTIMONIAL_COLUMNS)
        .eq("published", true)
        .order("sort_order", { ascending: true }),
    ]);

    return {
      settings: (settingsRes.data ?? null) as SiteSettings | null,
      blocks: (blocksRes.data ?? []) as ContentBlock[],
      testimonials: (testimonialsRes.data ?? []) as Testimonial[],
    };
  },
);
