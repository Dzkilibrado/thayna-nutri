import { createFileRoute } from "@tanstack/react-router";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { VideoEmbed } from "@/components/site/video-embed";
import { loadSiteData } from "@/lib/site-data";
import { pageUrlHead } from "@/lib/seo";
import type { ContentBlock, SiteSettings } from "@/lib/site";

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
          "Vídeos de apresentação, explicações sobre os atendimentos e conteúdos de nutrição esportiva com Thaynan Pablo.",
      },
      { property: "og:title", content: "Vídeos | Thaynan Pablo Nutrição & Performance" },
      {
        property: "og:description",
        content: "Assista aos vídeos sobre nutrição, performance e atendimentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const { settings, blocks } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
  };
  const videos = blocks.filter((b) => b.page === "videos" && b.kind === "video");

  return (
    <PageShell settings={settings}>
      <div className="flex items-center justify-between">
        <BackButton to="/" label="Voltar" />
      </div>
      <header className="text-center">
        <h1 className="text-3xl">Vídeos</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Conteúdos sobre nutrição esportiva, performance e como funcionam os atendimentos.
        </p>
      </header>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        {videos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Nenhum vídeo publicado ainda.</p>
        ) : (
          videos.map((block) => (
            <article key={block.id} className="space-y-2">
              <h2 className="text-xl">{block.title}</h2>
              {block.subtitle ? (
                <p className="text-sm text-muted-foreground">{block.subtitle}</p>
              ) : null}
              <VideoEmbed url={block.url} title={block.title} />
            </article>
          ))
        )}
      </section>
    </PageShell>
  );
}
