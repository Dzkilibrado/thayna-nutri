import { useMemo, useState } from "react";

import { CalcCard, ChoiceGroup, NumField, ResultTable } from "@/components/site/calc-ui";

export function Ciclo() {
  const [carbs, setCarbs] = useState("300");
  const [fat, setFat] = useState("60");
  const [protein, setProtein] = useState("160");
  const [lowDays, setLowDays] = useState(2);

  const plan = useMemo(() => {
    const c = Number(carbs) || 0;
    const f = Number(fat) || 0;
    const p = Number(protein) || 0;
    const baseKcal = Math.round(c * 4 + f * 9 + p * 4);

    // Um ciclo = lowDays dias low + 1 dia high.
    // Tudo o que o dia high ganha, os dias low devolvem — assim o total do ciclo
    // fica igual ao plano atual, que é o que a ciclagem se propõe a fazer.
    const highCarbs = Math.round(c * 1.5);
    const carbSurplus = highCarbs - c;
    const lowCarbs = Math.max(0, Math.round(c - carbSurplus / lowDays));

    const highFat = Math.round(f * 0.7);
    const fatDeficit = f - highFat;
    const lowFat = Math.round(f + fatDeficit / lowDays);

    const kcal = (cc: number, ff: number) => Math.round(cc * 4 + ff * 9 + p * 4);
    const cycleDays = lowDays + 1;
    const cycleKcal = kcal(lowCarbs, lowFat) * lowDays + kcal(highCarbs, highFat);
    const baseCycleKcal = baseKcal * cycleDays;

    return {
      p,
      baseKcal,
      lowCarbs,
      lowFat,
      highCarbs,
      highFat,
      lowKcal: kcal(lowCarbs, lowFat),
      highKcal: kcal(highCarbs, highFat),
      cycleDays,
      drift: cycleKcal - baseCycleKcal,
    };
  }, [carbs, fat, protein, lowDays]);

  return (
    <>
      <CalcCard title="Seus macros de hoje">
        <p className="text-sm text-muted-foreground">
          Comece pelos valores que você já segue. A ciclagem redistribui esses números entre os dias
          — não muda o total.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Carboidratos (g)" value={carbs} onChange={setCarbs} />
          <NumField label="Gorduras (g)" value={fat} onChange={setFat} />
          <NumField label="Proteínas (g)" value={protein} onChange={setProtein} />
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Total por dia:</span>{" "}
          <strong className="text-primary">{plan.baseKcal} kcal</strong>
        </p>
        <ChoiceGroup
          label="Como você quer dividir a semana"
          value={lowDays}
          onChange={setLowDays}
          options={[
            { value: 2, label: "2 dias low / 1 high" },
            { value: 3, label: "3 dias low / 1 high" },
            { value: 4, label: "4 dias low / 1 high" },
          ]}
        />
      </CalcCard>

      <CalcCard title="Dias low carb">
        <ResultTable
          head={["Carboidratos", "Gorduras", "Proteínas", "Calorias"]}
          rows={[[`${plan.lowCarbs}g`, `${plan.lowFat}g`, `${plan.p}g`, `${plan.lowKcal} kcal`]]}
        />
      </CalcCard>

      <CalcCard title="Dia high carb">
        <ResultTable
          head={["Carboidratos", "Gorduras", "Proteínas", "Calorias"]}
          rows={[[`${plan.highCarbs}g`, `${plan.highFat}g`, `${plan.p}g`, `${plan.highKcal} kcal`]]}
        />
      </CalcCard>

      <CalcCard title="Como usar">
        <p className="text-sm text-muted-foreground">
          Faça {lowDays} dias low carb seguidos de 1 dia high carb, repetindo o ciclo de{" "}
          {plan.cycleDays} dias. A proteína não muda nunca. No dia high o carboidrato sobe e a
          gordura desce; nos dias low acontece o contrário, devolvendo exatamente o que o dia high
          recebeu.
        </p>
        <p className="text-sm text-muted-foreground">
          Diferença do ciclo em relação ao seu plano atual:{" "}
          <strong className="text-primary">
            {plan.drift > 0 ? "+" : ""}
            {plan.drift} kcal
          </strong>{" "}
          a cada {plan.cycleDays} dias — só o arredondamento das gramas.
        </p>
      </CalcCard>
    </>
  );
}
