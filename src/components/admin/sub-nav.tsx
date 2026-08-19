import { cn } from "@/lib/utils";

export type SubNavItem<T extends string> = {
  value: T;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

/**
 * Seletor de pílulas usado dentro de cada bloco do painel, para trocar de
 * ferramenta sem sair do bloco. Mesmo padrão em todo o painel — quem aprende
 * um já sabe usar os outros dois.
 */
export function SubNav<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly SubNavItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface-2 p-1"
    >
      {items.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
            value === v
              ? "bg-primary font-medium text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
