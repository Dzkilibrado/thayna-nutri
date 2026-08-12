import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { loadSiteData } from "@/lib/site-data";
import { pageUrlHead } from "@/lib/seo";
import type { SiteSettings, Testimonial } from "@/lib/site";

export const Route = createFileRoute("/depoimentos")({
  loader: () => loadSiteData(),
  head: () => ({
    links: pageUrlHead("/depoimentos").links,
    meta: [
      ...pageUrlHead("/depoimentos").meta,
      { title: "Depoimentos | Thaynan Pablo Nutrição & Performance" },
      {
        name: "description",
        content:
          "Relatos de quem acompanhou com o nutricionista esportivo Thaynan Pablo em Serra/ES.",
      },
      { property: "og:title", content: "Depoimentos | Thaynan Pablo Nutrição & Performance" },
      { property: "og:description", content: "O que dizem quem já foi atendido." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DepoimentosPage,
});

function DepoimentosPage() {
  const { settings, testimonials } = Route.useLoaderData() as {
    settings: SiteSettings | null;
    testimonials: Testimonial[];
  };

  return (
    <PageShell settings={settings}>
      <div className="flex items-center justify-between">
        <BackButton to="/" label="Voltar" />
      </div>

      <header className="text-center">
        <h1 className="text-3xl">Depoimentos</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Relatos de quem acompanhou de perto. Cada resposta é individual — o que funcionou para uma
          pessoa não define o resultado de outra.
        </p>
      </header>

      {testimonials.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Os primeiros depoimentos aparecem aqui em breve.
        </p>
      ) : (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {testimonials.map((item) => (
            <TestimonialCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </PageShell>
  );
}
