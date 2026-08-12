import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { BIOTYPES, type Biotype, type Sex } from "@/lib/calculators";
import { cn } from "@/lib/utils";

/**
 * Silhuetas desenhadas para este projeto (SVG, sem imagem externa).
 * Herdam a cor do tema, então acompanham as cores definidas no painel.
 */

function EctoFigure() {
  return (
    <svg viewBox="0 0 60 110" className="h-full w-full" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="30" cy="13" r="9" />
        <path d="M30 23c-6 0-9 3-11 7l-5 17c-.6 2 .5 3.6 2.2 4 1.7.4 3.1-.5 3.6-2.2L23 38v13l-2.6 30c-.3 2.4 1 3.9 3 4 2 .1 3.3-1.2 3.6-3.4L30 62l3 19.6c.3 2.2 1.6 3.5 3.6 3.4 2-.1 3.3-1.6 3-4L37 51V38l3.2 10.8c.5 1.7 1.9 2.6 3.6 2.2 1.7-.4 2.8-2 2.2-4l-5-17c-2-4-5-7-11-7z" />
      </g>
    </svg>
  );
}

function MesoFigure() {
  return (
    <svg viewBox="0 0 60 110" className="h-full w-full" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="30" cy="13" r="9.5" />
        <path d="M30 23c-8 0-13 3.5-16 9l-5.5 18c-.7 2.3.6 4.2 2.7 4.7 2.1.5 3.8-.7 4.4-2.8L19 40v10c0 2.5.6 4.4 2 6l-2.4 25c-.3 2.6 1.2 4.2 3.4 4.3 2.2.1 3.6-1.4 3.9-3.8L29 62h2l2.1 19.5c.3 2.4 1.7 3.9 3.9 3.8 2.2-.1 3.7-1.7 3.4-4.3L38 56c1.4-1.6 2-3.5 2-6V40l3.4 11.9c.6 2.1 2.3 3.3 4.4 2.8 2.1-.5 3.4-2.4 2.7-4.7L45 32c-3-5.5-7-9-15-9z" />
      </g>
    </svg>
  );
}

function EndoFigure() {
  return (
    <svg viewBox="0 0 60 110" className="h-full w-full" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="30" cy="13" r="10" />
        <path d="M30 24c-9 0-14 4-16.5 10l-5 17c-.7 2.3.7 4.3 2.8 4.8 2.1.5 3.8-.8 4.4-2.9L19 42v6c0 6 1 10 3 13.5l-2.6 20c-.3 2.6 1.3 4.3 3.6 4.4 2.3.1 3.7-1.5 4-3.9L29 64h2l1.9 18c.3 2.4 1.7 4 4 3.9 2.3-.1 3.9-1.8 3.6-4.4L38 61.5c2-3.5 3-7.5 3-13.5v-6l3.3 10.9c.6 2.1 2.3 3.4 4.4 2.9 2.1-.5 3.5-2.5 2.8-4.8l-5-17C44 28 39 24 30 24z" />
      </g>
    </svg>
  );
}

const FIGURES: Record<Biotype, () => ReactNode> = {
  ecto: EctoFigure,
  meso: MesoFigure,
  endo: EndoFigure,
};

export function BiotypePicker({
  value,
  onChange,
  label = "Biotipo",
}: {
  value: Biotype;
  onChange: (v: Biotype) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {BIOTYPES.map((b) => {
          const Figure = FIGURES[b.value];
          const active = value === b.value;
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange(b.value)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface-2 hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "h-20 w-12 transition-colors sm:h-24 sm:w-14",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Figure />
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {BIOTYPES.find((b) => b.value === value)?.hint}
      </p>
    </div>
  );
}

function MaleFigure() {
  return (
    <svg viewBox="0 0 40 60" className="h-full w-full" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="20" cy="9" r="6.5" />
        <path d="M20 17c-5.5 0-9 2.5-10.5 6.5L6 34c-.5 1.6.4 2.9 1.9 3.2 1.4.3 2.6-.5 3-1.9L12 29v6l-1.6 16c-.2 1.7.8 2.8 2.3 2.9 1.5.1 2.4-.9 2.6-2.5L19 40h2l3.7 11.4c.2 1.6 1.1 2.6 2.6 2.5 1.5-.1 2.5-1.2 2.3-2.9L28 35v-6l1.1 6.3c.4 1.4 1.6 2.2 3 1.9 1.5-.3 2.4-1.6 1.9-3.2l-3.5-10.5C29 19.5 25.5 17 20 17z" />
      </g>
    </svg>
  );
}

function FemaleFigure() {
  return (
    <svg viewBox="0 0 40 60" className="h-full w-full" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="20" cy="9" r="6.5" />
        <path d="M20 17c-4.5 0-7.5 2-9 5.5L7.5 33c-.5 1.5.3 2.7 1.7 3 1.3.3 2.4-.4 2.8-1.7L13.5 29l-1.4 8.5c-.2 1.3.5 2 1.7 2h1L13 51.5c-.2 1.6.8 2.7 2.2 2.8 1.4.1 2.3-.8 2.5-2.3L19.6 40h.8l1.9 12c.2 1.5 1.1 2.4 2.5 2.3 1.4-.1 2.4-1.2 2.2-2.8L25.2 39.5h1c1.2 0 1.9-.7 1.7-2L26.5 29l1.5 5.3c.4 1.3 1.5 2 2.8 1.7 1.4-.3 2.2-1.5 1.7-3L29 22.5C27.5 19 24.5 17 20 17z" />
      </g>
    </svg>
  );
}

export function SexPicker({
  value,
  onChange,
  label = "Sexo",
}: {
  value: Sex;
  onChange: (v: Sex) => void;
  label?: string;
}) {
  const options: { value: Sex; label: string; Figure: () => ReactNode }[] = [
    { value: "male", label: "Masculino", Figure: MaleFigure },
    { value: "female", label: "Feminino", Figure: FemaleFigure },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map(({ value: v, label: l, Figure }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface-2 hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "h-12 w-8 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Figure />
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {l}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
