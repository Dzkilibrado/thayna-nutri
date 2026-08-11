import type { SiteSettings } from "@/lib/site";

export function ThemeVars({ settings }: { settings: SiteSettings | null }) {
  if (!settings) return null;
  const css = `:root{--brand-bg:${settings.color_background};--brand-surface:${settings.color_surface};--brand-accent:${settings.color_accent};--brand-fg:${settings.color_foreground};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
