import { useState } from "react";
import { KeyRound, Medal, MessageSquare, TrendingUp, UsersRound } from "lucide-react";

import { AccessLinksEditor } from "@/components/admin/access-links-editor";
import { AthletesEditor } from "@/components/admin/athletes-editor";
import { IndicatorsPanel } from "@/components/admin/indicators-panel";
import { MessagesEditor } from "@/components/admin/messages-editor";
import { SubNav } from "@/components/admin/sub-nav";
import { VisitorsPanel } from "@/components/admin/visitors-panel";

/**
 * Bloco "Clientes": cadastro de pessoas (clientes e atletas), a ferramenta de
 * falar com elas (Mensagens) e a leitura sobre esses dados (Indicadores,
 * Visitantes) — tudo que gira em torno de quem visita e de quem atende.
 */
const SECTIONS = [
  { value: "clientes", label: "Clientes", Icon: KeyRound },
  { value: "atletas", label: "Atletas", Icon: Medal },
  { value: "mensagens", label: "Mensagens", Icon: MessageSquare },
  { value: "indicadores", label: "Indicadores", Icon: TrendingUp },
  { value: "visitantes", label: "Visitantes", Icon: UsersRound },
] as const;

export function ClientsHub() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["value"]>("clientes");

  return (
    <div className="space-y-6">
      <SubNav items={SECTIONS} value={section} onChange={setSection} />

      {section === "clientes" ? (
        <AccessLinksEditor />
      ) : section === "atletas" ? (
        <AthletesEditor />
      ) : section === "mensagens" ? (
        <MessagesEditor />
      ) : section === "indicadores" ? (
        <IndicatorsPanel />
      ) : (
        <VisitorsPanel />
      )}
    </div>
  );
}
