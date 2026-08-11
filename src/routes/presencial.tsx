import { createFileRoute } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/content-page";
import { loadSiteData } from "@/lib/site-data";

export const Route = createFileRoute("/presencial")({
  loader: () => loadSiteData(),
  head: () => ({
    meta: [
      { title: "Consulta presencial em Serra/ES | Clínica Overall" },
      {
        name: "description",
        content:
          "Avaliação antropométrica, protocolo individualizado, análise de exames e acompanhamento por aplicativo na Clínica Overall, Serra/ES.",
      },
      { property: "og:title", content: "Consulta presencial em Serra/ES | Clínica Overall" },
      {
        property: "og:description",
        content: "Veja como funciona a consulta presencial e agende pelo WhatsApp.",
      },
    ],
  }),
  component: PresencialPage,
});

function PresencialPage() {
  const { settings, blocks } = Route.useLoaderData();
  return (
    <>
      <ContentPage
        settings={settings}
        blocks={blocks}
        page="presencial"
        kicker="Atendimento"
        title="Consulta presencial"
      />
    </>
  );
}
