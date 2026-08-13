import { useState } from "react";
import { Quote } from "lucide-react";

import { VideoEmbed } from "@/components/site/video-embed";
import { VideoThumb } from "@/components/site/video-thumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Testimonial } from "@/lib/site";

export function TestimonialCard({ item }: { item: Testimonial }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="card-shadow flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      {item.video_url ? (
        <>
          {/* O player só carrega ao clicar: numa grade de depoimentos, abrir
              todos de uma vez deixa a página pesada. A foto da pessoa serve de
              capa quando a origem não fornece miniatura. */}
          <VideoThumb
            url={item.video_url}
            fallbackCover={item.photo_url}
            onOpen={() => setPlaying(true)}
            label={item.author_name}
          />

          <Dialog open={playing} onOpenChange={setPlaying}>
            <DialogContent className="max-w-3xl border-border bg-surface">
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wide">
                  {item.author_name}
                </DialogTitle>
              </DialogHeader>
              <VideoEmbed url={item.video_url} title={item.author_name} />
              <p className="break-words text-sm text-muted-foreground">{item.quote}</p>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      <Quote className="size-6 shrink-0 text-primary" aria-hidden="true" />

      <blockquote className="break-words text-sm leading-relaxed text-foreground/90">
        {item.quote}
      </blockquote>

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
