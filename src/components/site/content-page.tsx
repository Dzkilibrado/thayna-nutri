import type { ContentBlock, SiteSettings } from "@/lib/site";
import { BackButton } from "@/components/site/back-button";
import { LinkBlock } from "@/components/site/link-block";
import { PageShell } from "@/components/site/page-shell";
import { VideoEmbed } from "@/components/site/video-embed";
import { whatsappLink } from "@/lib/site";
import { externalLinkProps } from "@/lib/external";

export function ContentPage({
  settings,
  blocks,
  page,
  title,
  kicker,
}: {
  settings: SiteSettings | null;
  blocks: ContentBlock[];
  page: string;
  title: string;
  kicker?: string;
}) {
  const items = blocks.filter((b) => b.page === page);

  return (
    <PageShell settings={settings}>
      <div className="mb-4 flex items-center justify-between">
        <BackButton to="/" label="Voltar" />
      </div>
      <header className="hero-surface -mx-5 -mt-4 rounded-b-3xl px-5 pb-8 pt-12">
        {kicker ? (
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{kicker}</p>
        ) : null}
        <h1 className="mt-2 text-4xl">{title}</h1>
      </header>

      <div className="mt-8 space-y-8">
        {items.map((block) => (
          <section key={block.id} className="space-y-3">
            {block.kind === "link" ? (
              <LinkBlock block={block} settings={settings} />
            ) : (
              <>
                {block.title ? <h2 className="text-2xl">{block.title}</h2> : null}
                {block.subtitle ? (
                  <p className="text-sm uppercase tracking-widest text-primary">
                    {block.subtitle}
                  </p>
                ) : null}
                {block.kind === "video" ? (
                  <VideoEmbed url={block.url} title={block.title} />
                ) : null}
                {block.body ? (
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {block.body}
                  </p>
                ) : null}
              </>
            )}
          </section>
        ))}

        <a
          {...externalLinkProps(
            whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? ""),
          )}
          className="accent-glow block rounded-2xl bg-primary px-5 py-4 text-center font-display text-lg uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          Agendar consulta no WhatsApp
        </a>
      </div>
    </PageShell>
  );
}
