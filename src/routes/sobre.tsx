import { createFileRoute } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/content-page";
import { loadSiteData } from "@/lib/site-data";

export const Route = createFileRoute("/sobre")({
  loader: () => loadSiteData(),
  head: () => ({
    meta: [
      { title: "Sobre mim | Thaynan Nutricionista Esportivo" },
      {
        name: "description",
        content:
          "Conheça a história e o método de trabalho do nutricionista esportivo Thaynan, em Serra/ES.",
      },
      { property: "og:title", content: "Sobre mim | Thaynan Nutricionista Esportivo" },
      {
        property: "og:description",
        content: "História, formação e como funciona o acompanhamento nutricional.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  const { settings, blocks } = Route.useLoaderData();
  return (
    <ContentPage
      settings={settings}
      blocks={blocks}
      page="sobre"
      kicker="Apresentação"
      title="Sobre mim"
    />
  );
}
