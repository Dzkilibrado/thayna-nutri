import { createFileRoute } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/content-page";
import { getSiteData } from "@/lib/site.functions";

export const Route = createFileRoute("/online")({
  loader: () => getSiteData(),
  head: () => ({
    meta: [
      { title: "Consulta online | Thaynan Nutricionista Esportivo" },
      {
        name: "description",
        content:
          "Acompanhamento nutricional esportivo à distância. Fale no WhatsApp para saber os detalhes da consulta online.",
      },
      { property: "og:title", content: "Consulta online | Thaynan Nutricionista Esportivo" },
      {
        property: "og:description",
        content: "Detalhes do atendimento online e canal direto para agendamento.",
      },
    ],
  }),
  component: OnlinePage,
});

function OnlinePage() {
  const { settings, blocks } = Route.useLoaderData();
  return (
    <ContentPage
      settings={settings}
      blocks={blocks}
      page="online"
      kicker="Atendimento"
      title="Consulta online"
    />
  );
}
