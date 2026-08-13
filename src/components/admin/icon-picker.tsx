import { ICON_GROUPS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (id: string) => void;
}) {
  const current = value ?? "link";

  return (
    <div className="space-y-4">
      {ICON_GROUPS.map(({ group, options }) => (
        <div key={group} className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{group}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {options.map(({ id, label, Icon }) => {
              const active = current === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange(id)}
                  aria-pressed={active}
                  title={label}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-5", active && "text-primary")} />
                  <span className="text-center text-[11px] leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
