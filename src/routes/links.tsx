import { createFileRoute } from "@tanstack/react-router";

import { BackButton } from "@/components/site/back-button";
import { LinkBlock } from "@/components/site/link-block";
import { PageShell } from "@/components/site/page-shell";
import { loadSiteData } from "@/lib/site-data";
import type { ContentBlock, SiteSettings } from "@/lib/site";

export const Route = createFileRoute("/links")({
  loader: () => loadSiteData(),
  head: () => ({
    meta: [
      { title: "Links | Thaynan Pablo Nutrição & Performance" },
      {
        name: "description",
        content:
          "Todos os links úteis do nutricionista esportivo Thaynan Pablo: agendamento, redes sociais, conteúdos e parcerias.",
      },
      { property: "og:title", content: "Links | Thaynan Pablo Nutrição & Performance" },
      { property: "og:description", content: "Acesse todos os links em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  const { settings, blocks } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
  };
  const links = blocks.filter((b) => b.page === "links" && b.kind === "link");

  return (
    <PageShell settings={settings}>
      <div className="flex items-center justify-between">
        <BackButton to="/" label="Voltar" />
      </div>
      <header className="text-center">
        <h1 className="text-3xl">Links</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Tudo o que você precisa em um só lugar.
        </p>
      </header>

      <section className="mt-8 space-y-3">
        {links.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Nenhum link publicado ainda.
          </p>
        ) : (
          links.map((block) => <LinkBlock key={block.id} block={block} settings={settings} />)
        )}
      </section>
    </PageShell>
  );
}
