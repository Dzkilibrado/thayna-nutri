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
import { BIOTYPES, bodyFat, tmbLean, type Biotype, type Sex } from "@/lib/calculators";

export function DietaAvancada() {
  const [sex, setSex] = useState<Sex>("male");
  const [biotype, setBiotype] = useState<Biotype>("meso");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("77");
  const [waist, setWaist] = useState("85");
  const [hip, setHip] = useState("95");
  const [neck, setNeck] = useState("38");
  const [cardio, setCardio] = useState("20");
  const [goal, setGoal] = useState(0);
  const [proteinPerKg, setProteinPerKg] = useState("2.5");
  const [fatPerKg, setFatPerKg] = useState("0.8");
  const [result, setResult] = useState<null | {
    bf: number;
    lean: number;
    tmb: number;
    training: number;
    cardio: number;
    days: { label: string; kcal: number; carbs: number }[];
    protein: number;
    fat: number;
  }>(null);

  function calculate() {
    const w = Number(weight);
    const bf = bodyFat({
      sex,
      heightCm: Number(height),
      waistCm: Number(waist),
      neckCm: Number(neck),
      hipCm: Number(hip),
    });
    const lean = w * (1 - bf / 100);
    const base = tmbLean(lean);
    const training = Math.round(base * 0.15);
    const cardioKcal = Math.round(Number(cardio) * 9.5);
    const protein = Math.round(Number(proteinPerKg) * lean);
    const fat = Math.round(Number(fatPerKg) * lean);
    const factor = 1 + goal;

    const days = [
      { label: "Dia de Descanso", kcal: base },
      { label: "Dia de Treino", kcal: base + training },
      { label: "Dia de Cardio", kcal: base + cardioKcal },
      { label: "Treino + Cardio", kcal: base + training + cardioKcal },
    ].map((d) => {
      const kcal = Math.round(d.kcal * factor);
      return {
        label: d.label,
        kcal,
        carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)),
      };
    });

    setResult({ bf, lean, tmb: base, training, cardio: cardioKcal, days, protein, fat });
  }

  return (
    <>
      <CalcCard title="Sua dieta personalizada">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular sua dieta ideal. Esta calculadora fornece
          estimativas baseadas em fórmulas científicas.
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
          <NumField label="Cintura (cm)" value={waist} onChange={setWaist} step="0.1" />
          <NumField label="Quadril (cm)" value={hip} onChange={setHip} step="0.1" />
          <NumField label="Pescoço (cm)" value={neck} onChange={setNeck} step="0.1" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="Tempo de cardio (min/dia)" value={cardio} onChange={setCardio} />
          <SelectField
            label="Objetivo"
            value={goal}
            onChange={setGoal}
            options={[
              { value: -0.15, label: "Perder peso" },
              { value: 0, label: "Manter peso" },
              { value: 0.1, label: "Ganhar peso" },
            ]}
          />
          <NumField
            label="Proteína por kg de massa magra"
            value={proteinPerKg}
            onChange={setProteinPerKg}
            step="0.1"
          />
          <NumField
            label="Gordura por kg de massa magra"
            value={fatPerKg}
            onChange={setFatPerKg}
            step="0.1"
          />
        </div>
        <Button className="w-full" onClick={calculate}>
          Calcular dieta
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da sua dieta">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Taxa Metabólica Basal (TMB)" value={result.tmb} unit="Kcal" />
            <ResultStat label="Calorias do Treino" value={result.training} unit="Kcal" />
            <ResultStat label="Calorias do Cardio" value={result.cardio} unit="Kcal" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Percentual de Gordura" value={result.bf.toFixed(1)} unit="%" />
            <ResultStat label="Massa Magra" value={result.lean.toFixed(1)} unit="kg" />
          </div>
          <h3 className="text-lg">Necessidades calóricas diárias</h3>
          <ResultTable
            head={["Tipo de Dia", "Calorias"]}
            rows={result.days.map((d) => [d.label, `${d.kcal} Kcal`])}
          />
          <h3 className="text-lg">Distribuição de carboidratos</h3>
          <ResultTable
            head={result.days.map((d) => d.label)}
            rows={[result.days.map((d) => `${d.carbs}g`)]}
          />
          <h3 className="text-lg">Proteína e gordura diárias</h3>
          <ResultTable
            head={["Proteína", "Gordura"]}
            rows={[[`${result.protein}g`, `${result.fat}g`]]}
          />
        </CalcCard>
      ) : null}
    </>
  );
}
