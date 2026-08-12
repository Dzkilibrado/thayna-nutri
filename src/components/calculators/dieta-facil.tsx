import { useState } from "react";

import {
  CalcCard,
  CalcNotice,
  NumField,
  ResultStat,
  ResultTable,
  SelectField,
} from "@/components/site/calc-ui";
import { BiotypePicker, SexPicker } from "@/components/site/pickers";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_LEVELS,
  BODY_STATES,
  GOALS,
  macrosFromCalories,
  tmb,
  type Biotype,
  type Macros,
  type Sex,
} from "@/lib/calculators";

export function DietaFacil() {
  const [sex, setSex] = useState<Sex>("male");
  const [biotype, setBiotype] = useState<Biotype>("meso");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("77");
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState(0);
  const [state, setState] = useState("moderate");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    null | (Macros & { tmb: number; tdee: number; kcal: number })
  >(null);

  function calculate() {
    const w = Number(weight);
    const a = Number(age);
    const h = Number(height);

    if (!(w > 0) || !(h > 0) || !(a > 0)) {
      setError("Preencha idade, altura e peso para calcular.");
      setResult(null);
      return;
    }

    setError(null);
    const base = tmb(sex, a, h, w, biotype);
    const tdee = Math.round(base * activity);
    const kcal = Math.round(tdee * (1 + goal));
    const cfg = BODY_STATES.find((s) => s.value === state)!;
    const macros = macrosFromCalories(kcal, w, cfg.protein, cfg.fat);
    setResult({ tmb: base, tdee, kcal, ...macros });
  }

  return (
    <>
      <CalcCard title="Sua dieta personalizada">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular sua dieta ideal.
        </p>
        <SexPicker value={sex} onChange={setSex} />
        <BiotypePicker value={biotype} onChange={setBiotype} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Idade (anos)" value={age} onChange={setAge} />
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" />
        </div>
        <SelectField
          label="Nível de atividade"
          value={activity}
          onChange={setActivity}
          options={ACTIVITY_LEVELS}
        />
        <SelectField label="Objetivo" value={goal} onChange={setGoal} options={GOALS} />
        <SelectField
          label="Estado atual"
          value={state}
          onChange={setState}
          options={BODY_STATES.map((s) => ({ value: s.value, label: s.label }))}
        />
        {error ? <CalcNotice tone="error">{error}</CalcNotice> : null}
        <Button onClick={calculate} className="w-full">
          Calcular dieta
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da sua dieta">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Gasto em repouso" value={result.tmb} unit="Kcal" />
            <ResultStat label="Gasto total do dia" value={result.tdee} unit="Kcal" />
            <ResultStat
              label="Meta de calorias"
              value={result.overTarget ? result.actualKcal : result.kcal}
              unit="Kcal"
            />
          </div>
          <ResultTable
            head={["Carboidratos", "Gorduras", "Proteínas"]}
            rows={[[`${result.carbs} g`, `${result.fat} g`, `${result.protein} g`]]}
          />
          {result.overTarget ? (
            <CalcNotice>
              Com esse objetivo, a proteína e a gordura recomendadas já somam {result.actualKcal}{" "}
              kcal — acima da meta de {result.kcal} kcal. O carboidrato ficou em zero e a meta acima
              foi ajustada para o valor real. Um corte tão agressivo precisa de acompanhamento: fale
              com o nutricionista antes de seguir.
            </CalcNotice>
          ) : null}
        </CalcCard>
      ) : null}
    </>
  );
}
