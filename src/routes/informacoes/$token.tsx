import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";

import { externalLinkProps } from "@/lib/external";
import { supabase } from "@/integrations/supabase/client";
import {
  formatBRL,
  whatsappLink,
  type ContentBlock,
  type PricingItem,
  type SiteSettings,
} from "@/lib/site";
import { Download } from "lucide-react";
import { VideoEmbed } from "@/components/site/video-embed";

/**
 * Página privada de apresentação e valores, enviada por link a um cliente
 * específico. O token da URL é a única chave — não existe menu, navegação
 * nem indexação para esta rota; get_private_page() só devolve dado quando o
 * token confere com um link ativo, não expirado e não revogado.
 */
type MessageContent = {
  title: string;
  kind: "text" | "video" | "link";
  body: string | null;
  url: string | null;
};

type PrivatePageData = {
  valid: boolean;
  type?: "private_page" | "message";
  blocks?: ContentBlock[];
  pricing?: {
    presencial: { items: PricingItem[] };
    online: { items: PricingItem[] };
  };
  message?: MessageContent;
  settings?: SiteSettings | null;
};

export const Route = createFileRoute("/informacoes/$token")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.rpc("get_private_page", { _token: params.token });
    if (error) throw error;
    return (data ?? { valid: false }) as PrivatePageData;
  },
  head: () => ({
    meta: [
      { title: "Informações | Thaynan Pablo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InformacoesPage,
});

function InformacoesPage() {
  const data = Route.useLoaderData();

  if (!data.valid) {
    return <ExpiredScreen />;
  }

  const settings = data.settings ?? null;
  const blocks = (data.blocks ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const isMessage = data.type === "message" && data.message;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-5 py-4 md:max-w-3xl">
          <Link
            to="/"
            translate="no"
            className="font-display text-xl uppercase tracking-wider transition-colors hover:text-primary"
          >
            {settings?.brand_name ?? "Thaynan Pablo"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-10 px-5 py-10 md:max-w-3xl">
        {isMessage && data.message ? (
          <MessageView message={data.message} />
        ) : (
          <>
            {blocks.map((block) => (
              <PrivateBlock key={block.id} block={block} />
            ))}

            {data.pricing ? (
              <>
                <PricingTable
                  title="Investimento — Consulta presencial ou on-line"
                  items={data.pricing.presencial.items}
                  note={settings?.pricing_note_presencial}
                />
                <PricingTable
                  title="Investimento — Consultoria on-line"
                  items={data.pricing.online.items}
                  note={settings?.pricing_note_online}
                />
              </>
            ) : null}
          </>
        )}

        <div className="space-y-3">
          {settings?.whatsapp ? (
            <a
              {...externalLinkProps(
                whatsappLink(settings.whatsapp, "Olá! Vi as informações e gostaria de agendar."),
              )}
              className="accent-glow flex items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-center font-display text-lg uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="size-5" />
              Falar no WhatsApp
            </a>
          ) : null}

          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            Conhecer o site completo
          </Link>
        </div>
      </main>
    </div>
  );
}

function MessageView({ message }: { message: MessageContent }) {
  // O texto acompanha o vídeo ou o link como introdução — o mesmo campo que,
  // no tipo "Texto", é a mensagem inteira.
  const hasIntro = message.kind !== "text" && (message.body ?? "").trim().length > 0;

  return (
    <section className="space-y-3">
      <h1 className="text-2xl">{message.title}</h1>

      {hasIntro ? (
        <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">
          {message.body}
        </p>
      ) : null}

      {message.kind === "text" ? (
        <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">
          {message.body}
        </p>
      ) : message.kind === "video" ? (
        <VideoEmbed url={message.url} title={message.title} />
      ) : message.url ? (
        <a
          {...externalLinkProps(message.url)}
          className="block rounded-2xl border border-border bg-surface px-4 py-4 text-center font-display uppercase tracking-wide hover:border-primary/60"
        >
          Abrir link
        </a>
      ) : null}
    </section>
  );
}

function PrivateBlock({ block }: { block: ContentBlock }) {
  if (block.kind === "text") {
    return (
      <section>
        {block.title ? <h2 className="mb-2 text-2xl">{block.title}</h2> : null}
        <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">
          {block.body}
        </p>
      </section>
    );
  }

  if (block.kind === "video") {
    return (
      <section className="space-y-2">
        {block.title ? <h2 className="text-2xl">{block.title}</h2> : null}
        <VideoEmbed url={block.url} title={block.title} />
      </section>
    );
  }

  if (block.kind === "image" && block.url) {
    return (
      <section className="space-y-2">
        {block.title ? <h2 className="text-2xl">{block.title}</h2> : null}
        <img
          src={block.url}
          alt={block.title || "Imagem"}
          loading="lazy"
          className="card-shadow block w-full rounded-2xl border border-border object-contain"
        />
      </section>
    );
  }

  if (block.kind === "file" && block.url) {
    return (
      <a
        {...externalLinkProps(block.url)}
        download
        className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 hover:border-primary/60"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Download className="size-5" />
        </span>
        <span>
          <span className="block font-display text-lg uppercase">
            {block.title || "Baixar arquivo"}
          </span>
          <span className="block text-sm text-muted-foreground">Clique para baixar</span>
        </span>
      </a>
    );
  }

  if (block.kind === "link" && block.url) {
    return (
      <a
        {...externalLinkProps(block.url)}
        className="block rounded-2xl border border-border bg-surface px-4 py-4 text-center font-display uppercase tracking-wide hover:border-primary/60"
      >
        {block.title}
      </a>
    );
  }

  return null;
}

function PricingTable({
  title,
  items,
  note,
}: {
  title: string;
  items: PricingItem[];
  note: string | null | undefined;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-display text-lg uppercase tracking-wide">{item.title}</p>
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            <p className="mt-2 font-display text-2xl text-primary">{formatBRL(item.price)}</p>
          </div>
        ))}
      </div>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
    </section>
  );
}

function ExpiredScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <AlertTriangle className="size-10 text-primary" />
      <h1 className="text-2xl">Este link não está mais disponível</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ele pode ter expirado ou sido revogado. Fale com o Thaynan para receber um novo.
      </p>
    </div>
  );
}
