import { Quote } from "lucide-react";

import { VideoEmbed } from "@/components/site/video-embed";
import type { Testimonial } from "@/lib/site";

export function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className="card-shadow flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      {item.video_url ? <VideoEmbed url={item.video_url} title={item.author_name} /> : null}

      <Quote className="size-6 shrink-0 text-primary" aria-hidden="true" />

      <blockquote className="text-sm leading-relaxed text-foreground/90">{item.quote}</blockquote>

      <footer className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.author_name}
            loading="lazy"
            className="size-11 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg text-primary">
            {(item.author_name || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-base uppercase tracking-wide">
            {item.author_name}
          </p>
          {item.author_context ? (
            <p className="truncate text-xs text-muted-foreground">{item.author_context}</p>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
