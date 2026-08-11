import { createFileRoute, notFound } from "@tanstack/react-router";

import { Bf } from "@/components/calculators/bf";
import { Ciclo } from "@/components/calculators/ciclo";
import { DietaAvancada } from "@/components/calculators/dieta-avancada";
import { DietaFacil } from "@/components/calculators/dieta-facil";
import { Potencial } from "@/components/calculators/potencial";
import { Tmb } from "@/components/calculators/tmb";
import { Whey } from "@/components/calculators/whey";
import { CalcShell } from "@/components/site/calc-ui";
import { CALCULATORS } from "@/lib/calculators";
import { getSiteData } from "@/lib/site.functions";
import type { ContentBlock, SiteSettings } from "@/lib/site";

const COMPONENTS: Record<string, () => React.ReactElement> = {
  dietafacil: DietaFacil,
  dietaavancada: DietaAvancada,
  tmb: Tmb,
  bf: Bf,
  ciclo: Ciclo,
  whey: Whey,
  potencial: Potencial,
};

export const Route = createFileRoute("/calculadoras/$slug")({
  loader: async ({ params }) => {
    const meta = CALCULATORS.find((c) => c.slug === params.slug);
    if (!meta) throw notFound();
    const data = await getSiteData();
    return { ...data, meta };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.meta
      ? `Calculadora de ${loaderData.meta.title} | Thaynan Nutrição`
      : "Calculadora | Thaynan Nutrição";
    const description = loaderData?.meta?.description ?? "Calculadoras fitness gratuitas.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-sm">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm">Calculadora não encontrada.</div>
  ),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { settings, meta } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    blocks: ContentBlock[];
    meta: (typeof CALCULATORS)[number];
  };
  const Component = COMPONENTS[meta.slug]!;

  return (
    <CalcShell
      settings={settings}
      title={`Calculadora de ${meta.title}`}
      subtitle={meta.description}
    >
      <Component />
    </CalcShell>
  );
}
