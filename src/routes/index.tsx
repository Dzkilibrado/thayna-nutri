import { Link, createFileRoute } from "@tanstack/react-router";

import { LinkBlock } from "@/components/site/link-block";
import { PageShell } from "@/components/site/page-shell";
import { VideoEmbed } from "@/components/site/video-embed";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { loadSiteData } from "@/lib/site-data";
import { pageUrlHead } from "@/lib/seo";
import type { ContentBlock, SiteSettings, Testimonial } from "@/lib/site";

export const Route = createFileRoute("/")({
  loader: () => loadSiteData(),
  head: () => ({
    links: pageUrlHead("/").links,
    meta: [
      ...pageUrlHead("/").meta,
      { title: "Thaynan Nutricionista Esportivo | Serra/ES" },
      {
        name: "description",
        content:
          "Nutrição esportiva e performance em Serra/ES. Consulta presencial na Clínica Overall, protocolo individualizado e acompanhamento por aplicativo.",
      },
      { property: "og:title", content: "Thaynan Nutricionista Esportivo | Serra/ES" },
      {
        property: "og:description",
        content: "Agende sua consulta e acompanhe conteúdos sobre nutrição e performance.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { settings, blocks, testimonials } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
    testimonials: Testimonial[];
  };
  const featuredTestimonials = testimonials.filter((t) => t.featured).slice(0, 4);
  const links = blocks.filter((b) => b.page === "home" && b.kind === "link");
  const videos = blocks.filter((b) => b.kind === "video" && (b.page === "home" || b.featured));

  return (
    <PageShell settings={settings}>
      <section className="hero-surface -mx-5 -mt-8 rounded-b-3xl px-5 pb-10 pt-12 text-center">
        {settings?.avatar_url ? (
          <img
            src={settings.avatar_url}
            alt={settings.brand_name}
            className="accent-glow mx-auto size-48 rounded-full border-2 border-primary/60 object-cover sm:size-56"
          />
        ) : (
          <div className="mx-auto flex size-48 items-center justify-center rounded-full border-2 border-primary/60 bg-surface font-display text-6xl sm:size-56">
            {(settings?.brand_name ?? "T").slice(0, 1)}
          </div>
        )}
        <h1 className="mt-5 text-4xl">{settings?.brand_name ?? "Thaynan"}</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.25em] text-primary">
          {settings?.brand_tagline ?? "Nutrição & Performance"}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{settings?.bio}</p>
      </section>

      {settings?.intro_video_url ? (
        <section className="mt-8">
          <VideoEmbed url={settings.intro_video_url} title="Apresentação" />
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        {links.map((block) => (
          <LinkBlock key={block.id} block={block} settings={settings} />
        ))}
      </section>

      {featuredTestimonials.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl">Depoimentos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredTestimonials.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
          <Link
            to="/depoimentos"
            className="block rounded-2xl border border-border bg-surface px-4 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            Ver todos os depoimentos
          </Link>
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section className="mt-10 space-y-6">
          <h2 className="text-2xl">Vídeos</h2>
          {videos.map((block) => (
            <div key={block.id} className="space-y-2">
              <h3 className="text-lg">{block.title}</h3>
              <VideoEmbed url={block.url} title={block.title} />
            </div>
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
