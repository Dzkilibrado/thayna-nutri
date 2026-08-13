import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Film, Instagram, Play, Video } from "lucide-react";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { VideoEmbed } from "@/components/site/video-embed";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pageUrlHead } from "@/lib/seo";
import { videoCover, videoSource, type ContentBlock, type SiteSettings } from "@/lib/site";
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

const SOURCE_ART = {
  instagram: { Icon: Instagram, label: "Instagram" },
  facebook: { Icon: Facebook, label: "Facebook" },
  vimeo: { Icon: Video, label: "Vimeo" },
  file: { Icon: Film, label: "Vídeo" },
  youtube: { Icon: Video, label: "YouTube" },
  other: { Icon: Film, label: "Vídeo" },
} as const;

/**
 * Capa desenhada para quando a origem não fornece miniatura.
 * Melhor do que um retângulo vazio: identifica de onde vem o vídeo e mantém a
 * grade com aparência intencional.
 */
function SourceCover({ url }: { url: string | null }) {
  const { Icon, label } = SOURCE_ART[videoSource(url)];
  return (
    <span className="icon-tile flex size-full flex-col items-center justify-center gap-2">
      <Icon className="size-8 text-primary/70" />
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </span>
  );
}

function VideoCard({ video, onOpen }: { video: ContentBlock; onOpen: () => void }) {
  const cover = videoCover(video);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group card-shadow overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative block aspect-video w-full overflow-hidden bg-surface-2">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <SourceCover url={video.url} />
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/10">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
        </span>
      </span>

      <span className="block p-4">
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
      </span>
    </button>
  );
}
