import type { ReactNode } from "react";

import { BackButton } from "@/components/site/back-button";
import { PageShell } from "@/components/site/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteSettings } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CalcShell({
  settings,
  title,
  subtitle,
  children,
}: {
  settings: SiteSettings | null;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PageShell settings={settings}>
      <div className="flex items-center justify-between">
        <BackButton to="/calculadoras" label="Calculadoras" />
      </div>
      <header className="text-center">
        <h1 className="text-3xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{subtitle}</p>
      </header>
      <div className="mt-8 space-y-6">{children}</div>
      <p className="mt-10 rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground">
        ⚠️ Esta calculadora é apenas para fins educacionais. Os resultados são estimativas baseadas
        em fórmulas padrão. Para uma avaliação precisa, agende sua consulta.
      </p>
    </PageShell>
  );
}

export function CalcCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card-shadow space-y-5 rounded-2xl border border-border bg-surface p-5">
      {title ? <h2 className="font-display text-xl uppercase tracking-wide">{title}</h2> : null}
      {children}
    </section>
  );
}

export function NumField({
  label,
  hint,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm transition-colors",
              value === o.value
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-surface-2 text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SelectField<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <select
        value={String(value)}
        onChange={(e) => {
          const found = options.find((o) => String(o.value) === e.target.value);
          if (found) onChange(found.value);
        }}
        className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResultStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value}</p>
      {unit ? <p className="text-xs text-muted-foreground">{unit}</p> : null}
    </div>
  );
}

export function ResultTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Aviso dentro de uma calculadora — erro de preenchimento ou ressalva do resultado. */
export function CalcNotice({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-destructive/50 bg-destructive/10 text-foreground"
          : "border-primary/40 bg-primary/10 text-foreground",
      )}
    >
      {children}
    </p>
  );
}
