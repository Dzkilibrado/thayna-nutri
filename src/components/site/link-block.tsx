import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { iconFor } from "@/lib/icons";
import type { ContentBlock, SiteSettings } from "@/lib/site";
import { whatsappLink } from "@/lib/site";
import { externalLinkProps } from "@/lib/external";

export function LinkBlock({
  block,
  settings,
}: {
  block: ContentBlock;
  settings: SiteSettings | null;
}) {
  const Icon = iconFor(block.icon);
  const raw = (block.url ?? "#").trim();
  const token = raw.toLowerCase();
  const isGenericInstagram = /^https?:\/\/(www\.)?instagram\.com\/?$/i.test(raw);
  const isGenericYoutube = /^https?:\/\/(www\.)?youtube\.com\/?$/i.test(raw);

  let href = raw;
  if (token === "whatsapp") {
    href = whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? "");
  } else if (token === "instagram" || isGenericInstagram) {
    href = settings?.instagram_url || raw;
  } else if (token === "youtube" || isGenericYoutube) {
    href = settings?.youtube_url || raw;
  }
  const internal = href.startsWith("/");

  const content = (
    <>
      {/* Fio de acento na borda esquerda — dá contorno sem pesar o cartão. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary/40 transition-all group-hover:inset-y-2 group-hover:bg-primary"
      />

      <span className="icon-tile flex size-12 shrink-0 items-center justify-center rounded-2xl text-primary transition-transform group-hover:scale-105">
        <Icon className="size-[22px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          translate="no"
          className="block truncate font-display text-lg uppercase tracking-wide transition-colors group-hover:text-primary"
        >
          {block.title}
        </span>
        {block.subtitle ? (
          <span translate="no" className="mt-0.5 block truncate text-sm text-muted-foreground">
            {block.subtitle}
          </span>
        ) : null}
      </span>

      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary/60 group-hover:bg-primary/10 group-hover:text-primary">
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </>
  );

  const className =
    "group link-card-surface card-shadow relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-border px-4 py-4 pl-5 text-left transition-all duration-200 hover:link-card-hover hover:-translate-y-0.5 hover:border-primary/50 hover:accent-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (internal) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a {...externalLinkProps(href)} className={className}>
      {content}
    </a>
  );
}
