import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Clock, Phone, Navigation as NavIcon, Car, MessageCircle } from "lucide-react";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { loadSiteData } from "@/lib/site-data";
import { externalLinkProps } from "@/lib/external";
import { whatsappLink } from "@/lib/site";

const DEFAULT_MAPS_URL =
  "https://www.google.com/maps/place/Cl%C3%ADnica+Overall/@-20.1954098,-40.2573663,17z/data=!4m10!1m2!2m1!1sCentro+Empresarial+da+Serra+Cl%C3%ADnica+Overall!3m6!1s0xb81f005d842e3b:0x70d701d9d07f7bf1!8m2!3d-20.1951652!4d-40.2543406!16s%2Fg%2F11wy7jjxcl";

const DEFAULT_ADDRESS =
  "Clínica Overall — Centro Empresarial da Serra, sala 718. Parque Residencial Laranjeiras, Serra/ES, CEP 29.165-612. Ponto de referência: em frente ao Shopping Laranjeiras.";

export const Route = createFileRoute("/como-chegar")({
  loader: () => loadSiteData(),
  head: () => ({
    meta: [
      { title: "Como chegar | Thaynan Nutricionista Esportivo" },
      {
        name: "description",
        content:
          "Endereço e mapa da Clínica Overall, no Centro Empresarial da Serra, sala 718 — em frente ao Shopping Laranjeiras, Serra/ES.",
      },
      { property: "og:title", content: "Como chegar | Thaynan Nutricionista Esportivo" },
      {
        property: "og:description",
        content: "Veja o endereço completo, o mapa e trace sua rota até a Clínica Overall.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComoChegarPage,
});

function ComoChegarPage() {
  const { settings } = Route.useLoaderData();
  const address = settings?.address || DEFAULT_ADDRESS;
  const mapsUrl = settings?.maps_url || DEFAULT_MAPS_URL;
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    "Clínica Overall, Centro Empresarial da Serra, Serra ES",
  )}&z=16&output=embed`;

  return (
    <PageShell settings={settings}>
      <div className="mb-4">
        <BackButton to="/" label="Voltar" />
      </div>

      <header className="hero-surface -mx-5 -mt-4 rounded-b-3xl px-5 pb-8 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Localização</p>
        <h1 className="mt-2 text-4xl">Como chegar</h1>
      </header>

      <div className="mt-8 space-y-6">
        <div className="card-shadow rounded-2xl border border-border bg-surface p-5">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="leading-relaxed text-muted-foreground">{address}</p>
          </div>
          <div className="mt-4 flex gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              Atendimento {settings?.hours ?? "09:00 - 20:00"}
            </p>
          </div>
          {settings?.whatsapp ? (
            <div className="mt-4 flex gap-3">
              <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-muted-foreground">{settings.whatsapp}</p>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Mapa da Clínica Overall"
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full border-0"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            {...externalLinkProps(mapsUrl)}
            className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-center font-display text-lg uppercase tracking-wide transition-colors hover:border-primary/60"
          >
            <Navigation className="size-5 text-primary" />
            Google Maps
          </a>
          <a
            {...externalLinkProps(WAZE_URL)}
            className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-center font-display text-lg uppercase tracking-wide transition-colors hover:border-primary/60"
          >
            <Car className="size-5 text-primary" />
            Waze
          </a>
        </div>

        <a
          {...externalLinkProps(
            whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? ""),
          )}
          className="accent-glow flex items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-center font-display text-lg uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-5" />
          Agendar consulta no WhatsApp
        </a>
      </div>
    </PageShell>
  );
}
