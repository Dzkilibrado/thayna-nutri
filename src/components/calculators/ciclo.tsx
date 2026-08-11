import { useMemo, useState } from "react";

import { CalcCard, ChoiceGroup, NumField, ResultTable } from "@/components/site/calc-ui";

export function Ciclo() {
  const [carbs, setCarbs] = useState("300");
  const [fat, setFat] = useState("60");
  const [protein, setProtein] = useState("160");
  const [lowDays, setLowDays] = useState(2);

  const base = useMemo(() => {
    const c = Number(carbs) || 0;
    const f = Number(fat) || 0;
    const p = Number(protein) || 0;
    return { c, f, p, kcal: Math.round(c * 4 + f * 9 + p * 4) };
  }, [carbs, fat, protein]);

  const highCarbs = Math.round(base.c * 1.5);
  const lowCarbs = Math.max(0, Math.round(base.c - (highCarbs - base.c) / lowDays));
  const lowFat = Math.round(base.f * 1.1);
  const highFat = Math.round(base.f * 0.7);

  const kcal = (c: number, f: number) => Math.round(c * 4 + f * 9 + base.p * 4);

  return (
    <>
      <CalcCard title="Configure seus macros">
        <p className="text-sm text-muted-foreground">
          Insira seus valores atuais de macronutrientes:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Carboidratos" value={carbs} onChange={setCarbs} />
          <NumField label="Gorduras" value={fat} onChange={setFat} />
          <NumField label="Proteínas" value={protein} onChange={setProtein} />
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Total de calorias:</span>{" "}
          <strong className="text-primary">{base.kcal} kcal</strong>
        </p>
        <ChoiceGroup
          label="Selecione seu protocolo de ciclagem"
          value={lowDays}
          onChange={setLowDays}
          options={[
            { value: 2, label: "2 Low / 1 High" },
            { value: 3, label: "3 Low / 1 High" },
            { value: 4, label: "4 Low / 1 High" },
          ]}
        />
      </CalcCard>

      <CalcCard title="Macros - Dias Low Carb">
        <ResultTable
          head={["Carboidratos", "Gorduras", "Proteínas", "Kcal"]}
          rows={[[`${lowCarbs}g`, `${lowFat}g`, `${base.p}g`, kcal(lowCarbs, lowFat)]]}
        />
      </CalcCard>

      <CalcCard title="Macros - Dias High Carb">
        <ResultTable
          head={["Carboidratos", "Gorduras", "Proteínas", "Kcal"]}
          rows={[[`${highCarbs}g`, `${highFat}g`, `${base.p}g`, kcal(highCarbs, highFat)]]}
        />
      </CalcCard>

      <CalcCard title="Como usar">
        <p className="text-sm text-muted-foreground">
          Alterne {lowDays} dias low carb para cada dia high carb, mantendo a proteína constante. O
          total semanal de calorias permanece próximo do seu plano atual, favorecendo a queima de
          gordura sem desacelerar o metabolismo.
        </p>
      </CalcCard>
    </>
  );
}
