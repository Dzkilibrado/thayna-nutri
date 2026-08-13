import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { CALCULATORS } from "@/lib/calculators";
import { pageUrlHead } from "@/lib/seo";
import { loadSiteData } from "@/lib/site-data";
import type { ContentBlock, SiteSettings } from "@/lib/site";

export const Route = createFileRoute("/calculadoras/")({
  loader: () => loadSiteData(),
  head: () => ({
    links: pageUrlHead("/calculadoras").links,
    meta: [
      ...pageUrlHead("/calculadoras").meta,
      { title: "Calculadoras fitness gratuitas | Thaynan Nutrição" },
      {
        name: "description",
        content:
          "Calculadoras gratuitas de dieta, TMB, gordura corporal, ciclo de carboidratos, whey protein e potencial genético.",
      },
      { property: "og:title", content: "Calculadoras fitness gratuitas" },
      {
        property: "og:description",
        content: "Dieta, TMB, BF, ciclo de carboidratos, whey e potencial genético.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorsIndex,
});

function CalculatorsIndex() {
  const { settings } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
  };

  return (
    <PageShell settings={settings}>
      <div className="flex items-center justify-between">
        <BackButton to="/" label="Voltar" showHome />
      </div>
      <header className="text-center">
        <h1 className="text-3xl">Calculadoras</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Ferramentas gratuitas para estimar dieta, composição corporal e performance.
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => (
          <Link
            key={c.slug}
            to="/calculadoras/$slug"
            params={{ slug: c.slug }}
            className="group card-shadow flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/60"
          >
            <span className="font-display text-lg uppercase tracking-wide">{c.title}</span>
            <span className="text-sm text-muted-foreground">{c.description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm text-primary">
              Abrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
