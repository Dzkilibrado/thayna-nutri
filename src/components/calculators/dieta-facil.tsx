import { useState } from "react";

import {
  CalcCard,
  ChoiceGroup,
  NumField,
  ResultStat,
  ResultTable,
  SelectField,
} from "@/components/site/calc-ui";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_LEVELS,
  BIOTYPES,
  BODY_STATES,
  GOALS,
  macrosFromCalories,
  tmb,
  type Biotype,
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
  const [result, setResult] = useState<null | {
    tmb: number;
    tdee: number;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }>(null);

  function calculate() {
    const w = Number(weight);
    const base = tmb(sex, Number(age), Number(height), w, biotype);
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
        <ChoiceGroup
          label="Sexo"
          value={sex}
          onChange={setSex}
          options={[
            { value: "male", label: "Masculino" },
            { value: "female", label: "Feminino" },
          ]}
        />
        <ChoiceGroup
          label="Biotipo"
          value={biotype}
          onChange={setBiotype}
          options={BIOTYPES.map((b) => ({ value: b.value, label: b.label }))}
        />
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
        <Button onClick={calculate} className="w-full">
          Calcular dieta
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da sua dieta">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Taxa Metabólica Basal (TMB)" value={result.tmb} unit="Kcal" />
            <ResultStat label="Gasto Energético Total (TDEE)" value={result.tdee} unit="Kcal" />
            <ResultStat label="Calorias Diárias" value={result.kcal} unit="Kcal" />
          </div>
          <ResultTable
            head={["Carboidratos", "Gorduras", "Proteínas"]}
            rows={[[`${result.carbs} g`, `${result.fat} g`, `${result.protein} g`]]}
          />
        </CalcCard>
      ) : null}
    </>
  );
}
