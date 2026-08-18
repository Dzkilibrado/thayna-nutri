import { useState } from "react";
import { KeyRound, Medal } from "lucide-react";

import { AccessLinksEditor } from "@/components/admin/access-links-editor";
import { AthletesEditor } from "@/components/admin/athletes-editor";
import { cn } from "@/lib/utils";

/**
 * Central de Cadastros: agrupa os registros de pessoas do consultório —
 * clientes e atletas — sob uma aba só, com um seletor interno. Sem isso, cada
 * novo tipo de cadastro viraria mais uma aba solta no topo do painel.
 */
const SECTIONS = [
  { value: "clientes", label: "Clientes", Icon: KeyRound },
  { value: "atletas", label: "Atletas", Icon: Medal },
] as const;

export function RegistryEditor() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["value"]>("clientes");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        className="inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1"
      >
        {SECTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={section === value}
            onClick={() => setSection(value)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
              section === value
                ? "bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {section === "clientes" ? <AccessLinksEditor /> : <AthletesEditor />}
    </div>
  );
}
