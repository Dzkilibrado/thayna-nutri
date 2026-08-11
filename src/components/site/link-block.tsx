import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Instagram,
  MapPin,
  MessageCircle,
  Play,
  User,
  Video,
  Youtube,
  Link as LinkIcon,
} from "lucide-react";

import type { ContentBlock, SiteSettings } from "@/lib/site";
import { whatsappLink } from "@/lib/site";
import { externalLinkProps } from "@/lib/external";

const ICONS: Record<string, typeof LinkIcon> = {
  "message-circle": MessageCircle,
  "map-pin": MapPin,
  video: Video,
  user: User,
  instagram: Instagram,
  youtube: Youtube,
  play: Play,
  link: LinkIcon,
};

export function LinkBlock({
  block,
  settings,
}: {
  block: ContentBlock;
  settings: SiteSettings | null;
}) {
  const Icon = ICONS[block.icon ?? "link"] ?? LinkIcon;
  const raw = block.url ?? "#";
  const isWhatsapp = raw === "whatsapp";
  const href = isWhatsapp
    ? whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? "")
    : raw;
  const internal = href.startsWith("/");

  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg uppercase tracking-wide">
          {block.title}
        </span>
        {block.subtitle ? (
          <span className="block truncate text-sm text-muted-foreground">{block.subtitle}</span>
        ) : null}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </>
  );

  const className =
    "group card-shadow flex w-full items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:accent-glow";

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
