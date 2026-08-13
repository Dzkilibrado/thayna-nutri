import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { VideoEmbed } from "@/components/site/video-embed";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pageUrlHead } from "@/lib/seo";
import { VideoThumb } from "@/components/site/video-thumb";
import type { ContentBlock, SiteSettings } from "@/lib/site";
import { loadSiteData } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/videos")({
  loader: () => loadSiteData(),
  head: () => ({
    links: pageUrlHead("/videos").links,
    meta: [
      ...pageUrlHead("/videos").meta,
      { title: "Vídeos | Thaynan Pablo Nutrição & Performance" },
      {
        name: "description",
        content:
          "Vídeos sobre nutrição esportiva, performance e como funcionam os atendimentos com o nutricionista Thaynan Pablo.",
      },
      { property: "og:title", content: "Vídeos | Thaynan Pablo Nutrição & Performance" },
      {
        property: "og:description",
        content: "Conteúdos sobre nutrição esportiva, performance e atendimentos.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: VideosPage,
});

const ALL = "Todos";

function VideosPage() {
  const { settings, blocks } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
  };

  const videos = useMemo(
    () => blocks.filter((b) => b.page === "videos" && b.kind === "video"),
    [blocks],
  );

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const v of videos) {
      const name = v.category?.trim();
      if (name) found.add(name);
    }
    return [ALL, ...[...found].sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [videos]);

  const [active, setActive] = useState(ALL);
  const [playing, setPlaying] = useState<ContentBlock | null>(null);

  const shown =
    active === ALL ? videos : videos.filter((v) => (v.category?.trim() ?? "") === active);

  return (
    <PageShell settings={settings}>
      <BackButton to="/" label="Voltar" />

      <header className="mt-6 text-center">
        <h1 className="text-3xl">Vídeos</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Conteúdos sobre nutrição esportiva, performance e como funcionam os atendimentos.
        </p>
      </header>

      {videos.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhum vídeo publicado ainda.
        </p>
      ) : (
        <>
          {categories.length > 1 ? (
            <div className="nav-scroll mt-8 flex gap-2 overflow-x-auto pb-1">
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActive(name)}
                  aria-pressed={active === name}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors",
                    active === name
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={() => setPlaying(video)} />
            ))}
          </section>

          {shown.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Nenhum vídeo neste assunto ainda.
            </p>
          ) : null}
        </>
      )}

      <Dialog open={playing !== null} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="max-w-3xl border-border bg-surface">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide">
              {playing?.title}
            </DialogTitle>
          </DialogHeader>
          {playing ? <VideoEmbed url={playing.url} title={playing.title} /> : null}
          {playing?.subtitle ? (
            <p className="text-sm text-muted-foreground">{playing.subtitle}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function VideoCard({ video, onOpen }: { video: ContentBlock; onOpen: () => void }) {
  return (
    <div className="group card-shadow overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-primary/50">
      <VideoThumb
        url={video.url}
        coverUrl={video.cover_url}
        onOpen={onOpen}
        label={video.title}
        className="rounded-none border-0"
      />

      <button type="button" onClick={onOpen} className="block w-full p-4 text-left">
        {video.category ? (
          <span className="mb-1.5 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] text-primary">
            {video.category}
          </span>
        ) : null}
        <span className="block font-display text-base uppercase leading-tight tracking-wide transition-colors group-hover:text-primary">
          {video.title}
        </span>
        {video.subtitle ? (
          <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
            {video.subtitle}
          </span>
        ) : null}
      </button>
    </div>
  );
}
