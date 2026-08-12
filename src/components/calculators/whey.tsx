import { useState } from "react";

import { CalcCard, CalcNotice, NumField } from "@/components/site/calc-ui";

type Product = { weight: string; serving: string; protein: string; price: string };

function analyse(p: Product) {
  const weight = Number(p.weight) || 0;
  const serving = Number(p.serving) || 0;
  const proteinPerServing = Number(p.protein) || 0;
  const price = Number(p.price) || 0;
  const pct = serving > 0 ? (proteinPerServing / serving) * 100 : 0;
  const totalProtein = (weight * pct) / 100;
  const per100 = totalProtein > 0 ? price / (totalProtein / 100) : 0;
  const invalid = (serving > 0 && proteinPerServing > serving) || (weight > 0 && serving > weight);
  return { pct, totalProtein, per100, invalid };
}

function ProductForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Product;
  onChange: (p: Product) => void;
}) {
  const r = analyse(value);
  return (
    <CalcCard title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumField
          label="Peso total (gramas)"
          hint="Peso total da embalagem (ex: 1000g = 1kg)"
          value={value.weight}
          onChange={(v) => onChange({ ...value, weight: v })}
        />
        <NumField
          label="Tamanho da porção (gramas)"
          value={value.serving}
          onChange={(v) => onChange({ ...value, serving: v })}
        />
        <NumField
          label="Proteína por porção (gramas)"
          value={value.protein}
          onChange={(v) => onChange({ ...value, protein: v })}
        />
        <NumField
          label="Preço (R$)"
          step="0.01"
          value={value.price}
          onChange={(v) => onChange({ ...value, price: v })}
        />
      </div>
      {r.invalid ? (
        <CalcNotice tone="error">
          Confira os números do rótulo: a proteína não pode ser maior que a porção, e a porção não
          pode ser maior que a embalagem.
        </CalcNotice>
      ) : null}
      <div className="space-y-1 rounded-xl border border-border bg-surface-2 p-4 text-sm">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Proteína no pote:</span>
          <strong>{r.pct.toFixed(1)}%</strong>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Proteína total na embalagem:</span>
          <strong>{Math.round(r.totalProtein)}g</strong>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Preço por 100g de proteína:</span>
          <strong>R$ {r.per100.toFixed(2)}</strong>
        </p>
      </div>
    </CalcCard>
  );
}

export function Whey() {
  const [p1, setP1] = useState<Product>({
    weight: "1000",
    serving: "30",
    protein: "24",
    price: "132",
  });
  const [p2, setP2] = useState<Product>({ weight: "", serving: "", protein: "", price: "" });

  const a = analyse(p1);
  const b = analyse(p2);
  const ready = a.per100 > 0 && b.per100 > 0 && !a.invalid && !b.invalid;
  const winner = ready ? (a.per100 <= b.per100 ? 1 : 2) : 0;
  const diff = ready ? Math.abs(a.per100 - b.per100) : 0;

  return (
    <>
      <CalcCard title="Qual whey compensa mais">
        <p className="text-sm text-muted-foreground">
          O preço da embalagem engana: o que importa é quanto você paga por proteína de verdade.
          Preencha os dois rótulos e compare.
        </p>
      </CalcCard>
      <ProductForm title="Produto 1" value={p1} onChange={setP1} />
      <ProductForm title="Produto 2" value={p2} onChange={setP2} />
      <CalcCard title="Resultado da comparação">
        {ready ? (
          <p className="text-sm">
            O <strong className="text-primary">Produto {winner}</strong> compensa mais — economia de{" "}
            <strong>R$ {diff.toFixed(2)}</strong> a cada 100g de proteína.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Insira os dados para comparar.</p>
        )}
      </CalcCard>
    </>
  );
}
