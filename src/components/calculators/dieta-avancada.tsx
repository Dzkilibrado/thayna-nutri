import { useState } from "react";

import {
  CalcCard,
  CalcNotice,
  NumField,
  ResultStat,
  ResultTable,
  SelectField,
} from "@/components/site/calc-ui";
import { SexPicker } from "@/components/site/pickers";
import { Button } from "@/components/ui/button";
import { ROUTINE_LEVELS, bodyFat, bodyFatError, tmbLean, type Sex } from "@/lib/calculators";

export function DietaAvancada() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("77");
  const [waist, setWaist] = useState("85");
  const [hip, setHip] = useState("95");
  const [neck, setNeck] = useState("38");
  const [routine, setRoutine] = useState(1.25);
  const [cardio, setCardio] = useState("20");
  const [goal, setGoal] = useState(0);
  const [proteinPerKg, setProteinPerKg] = useState("2.5");
  const [fatPerKg, setFatPerKg] = useState("0.8");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    bf: number;
    lean: number;
    restKcal: number;
    training: number;
    cardio: number;
    days: { label: string; kcal: number; carbs: number; over: boolean }[];
    protein: number;
    fat: number;
  }>(null);

  function calculate() {
    const w = Number(weight);
    const measures = {
      sex,
      heightCm: Number(height),
      waistCm: Number(waist),
      neckCm: Number(neck),
      hipCm: Number(hip),
    };

    if (!(w > 0) || !(Number(age) > 0)) {
      setError("Preencha idade e peso para calcular.");
      setResult(null);
      return;
    }

    const measureError = bodyFatError(measures);
    if (measureError) {
      setError(measureError);
      setResult(null);
      return;
    }

    setError(null);
    const bf = bodyFat(measures)!;
    const lean = w * (1 - bf / 100);

    // Gasto em repouso (Katch-McArdle) multiplicado pela rotina fora do treino.
    // Sem esse fator, o "dia de descanso" ficaria no nível basal — bem abaixo da
    // manutenção real de quem trabalha, anda e vive fora da academia.
    const basal = tmbLean(lean);
    const restKcal = Math.round(basal * routine);
    const training = Math.round(basal * 0.15);
    // Cardio proporcional ao peso: ~0,12 kcal por kg por minuto (ritmo moderado).
    const cardioKcal = Math.round(Number(cardio) * 0.12 * w);
    const protein = Math.round(Number(proteinPerKg) * lean);
    const fat = Math.round(Number(fatPerKg) * lean);
    const macroFloor = protein * 4 + fat * 9;
    const factor = 1 + goal;

    const days = [
      { label: "Dia de descanso", kcal: restKcal },
      { label: "Dia de treino", kcal: restKcal + training },
      { label: "Dia de cardio", kcal: restKcal + cardioKcal },
      { label: "Treino + cardio", kcal: restKcal + training + cardioKcal },
    ].map((d) => {
      const target = Math.round(d.kcal * factor);
      const carbs = Math.max(0, Math.round((target - macroFloor) / 4));
      const over = macroFloor > target;
      return { label: d.label, kcal: over ? macroFloor : target, carbs, over };
    });

    setResult({ bf, lean, restKcal, training, cardio: cardioKcal, days, protein, fat });
  }

  const anyOver = result?.days.some((d) => d.over) ?? false;

  return (
    <>
      <CalcCard title="Sua dieta personalizada">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular sua dieta ideal. Os resultados são estimativas — a
          avaliação individual é feita na consulta.
        </p>
        <SexPicker value={sex} onChange={setSex} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Idade (anos)" value={age} onChange={setAge} />
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" />
          <NumField label="Cintura (cm)" value={waist} onChange={setWaist} step="0.1" />
          {sex === "female" ? (
            <NumField label="Quadril (cm)" value={hip} onChange={setHip} step="0.1" />
          ) : null}
          <NumField label="Pescoço (cm)" value={neck} onChange={setNeck} step="0.1" />
        </div>
        <SelectField
          label="Como é o seu dia fora da academia"
          value={routine}
          onChange={setRoutine}
          options={ROUTINE_LEVELS}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="Tempo de cardio (min/dia)" value={cardio} onChange={setCardio} />
          <SelectField
            label="Objetivo"
            value={goal}
            onChange={setGoal}
            options={[
              { value: -0.3, label: "Emagrecer Agressivo (-30%)" },
              { value: -0.15, label: "Emagrecer (-15%)" },
              { value: 0, label: "Manter peso" },
              { value: 0.07, label: "Ganhos Secos (+7%)" },
              { value: 0.15, label: "Ganhar Peso Agressivo (+15%)" },
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
        {error ? <CalcNotice tone="error">{error}</CalcNotice> : null}
        <Button className="w-full" onClick={calculate}>
          Calcular dieta
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da sua dieta">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Base do dia de descanso" value={result.restKcal} unit="Kcal" />
            <ResultStat label="Calorias do treino" value={result.training} unit="Kcal" />
            <ResultStat label="Calorias do cardio" value={result.cardio} unit="Kcal" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Gordura corporal" value={result.bf.toFixed(1)} unit="%" />
            <ResultStat label="Massa magra" value={result.lean.toFixed(1)} unit="kg" />
          </div>

          <h3 className="text-lg">Calorias por tipo de dia</h3>
          <ResultTable
            head={["Tipo de dia", "Calorias"]}
            rows={result.days.map((d) => [d.label, `${d.kcal} Kcal`])}
          />

          <h3 className="text-lg">Carboidratos por tipo de dia</h3>
          <ResultTable
            head={result.days.map((d) => d.label)}
            rows={[result.days.map((d) => `${d.carbs}g`)]}
          />

          <h3 className="text-lg">Proteína e gordura (todos os dias)</h3>
          <ResultTable
            head={["Proteína", "Gordura"]}
            rows={[[`${result.protein}g`, `${result.fat}g`]]}
          />

          {anyOver ? (
            <CalcNotice>
              Em pelo menos um tipo de dia, a proteína e a gordura escolhidas já ultrapassam a meta
              de calorias. Nesses dias o carboidrato ficou em zero e o total exibido é o que as
              macros realmente somam. Reduza a proteína ou a gordura por kg, ou suavize o objetivo.
            </CalcNotice>
          ) : null}
        </CalcCard>
      ) : null}
    </>
  );
}
