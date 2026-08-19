import { useState } from "react";
import { FileText, MessageSquareQuote, Wallet } from "lucide-react";

import { ContentEditor } from "@/components/admin/content-editor";
import { PricingEditor } from "@/components/admin/pricing-editor";
import { SubNav } from "@/components/admin/sub-nav";
import { TestimonialsEditor } from "@/components/admin/testimonials-editor";
import type { ContentBlock, SiteSettings } from "@/lib/site";

/**
 * Bloco "Conteúdo": tudo que preenche uma página, pública ou privada — o
 * antigo item "Conteúdo" do topo virou o item "Páginas" aqui dentro, para não
 * ter dois "Conteúdo" com significados diferentes. Valores mora aqui junto,
 * não em Clientes: mesmo sendo mostrado só na página privada, é conteúdo de
 * página como o resto — a mesma lógica de Páginas, que também edita blocos da
 * página privada.
 */
const SECTIONS = [
  { value: "paginas", label: "Páginas", Icon: FileText },
  { value: "depoimentos", label: "Depoimentos", Icon: MessageSquareQuote },
  { value: "valores", label: "Valores", Icon: Wallet },
] as const;

export function ContentHub({
  blocks,
  settings,
}: {
  blocks: ContentBlock[] | undefined;
  settings: SiteSettings | undefined;
}) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["value"]>("paginas");

  return (
    <div className="space-y-6">
      <SubNav items={SECTIONS} value={section} onChange={setSection} />

      {section === "paginas" ? (
        blocks ? (
          <ContentEditor blocks={blocks} />
        ) : (
          <p>Carregando…</p>
        )
      ) : section === "depoimentos" ? (
        <TestimonialsEditor />
      ) : settings ? (
        <PricingEditor settings={settings} />
      ) : (
        <p>Carregando…</p>
      )}
    </div>
  );
}
