import { useState } from "react";

import { CalcCard, CalcNotice, NumField, ResultStat } from "@/components/site/calc-ui";
import { SexPicker } from "@/components/site/pickers";
import { Button } from "@/components/ui/button";
import { bodyFat, bodyFatError, tmbLean, type Sex } from "@/lib/calculators";

export function Bf() {
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("75");
  const [waist, setWaist] = useState("85");
  const [hip, setHip] = useState("95");
  const [neck, setNeck] = useState("38");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    bf: number;
    lean: number;
    fat: number;
    tmb: number;
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

    if (!(w > 0)) {
      setError("Informe o seu peso para calcular.");
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
    const fat = (w * bf) / 100;
    const lean = w - fat;
    // Com a massa magra conhecida, Katch-McArdle é mais preciso que Mifflin-St Jeor.
    setResult({ bf, fat, lean, tmb: tmbLean(lean) });
  }

  return (
    <>
      <CalcCard title="Sua avaliação corporal">
        <p className="text-sm text-muted-foreground">
          Meça com a fita métrica rente à pele, sem apertar. Cintura na altura do umbigo e pescoço
          logo abaixo do pomo de adão.
        </p>
        <SexPicker value={sex} onChange={setSex} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" />
          <NumField label="Cintura (cm)" value={waist} onChange={setWaist} step="0.1" />
          {sex === "female" ? (
            <NumField label="Quadril (cm)" value={hip} onChange={setHip} step="0.1" />
          ) : null}
          <NumField label="Pescoço (cm)" value={neck} onChange={setNeck} step="0.1" />
        </div>
        {error ? <CalcNotice tone="error">{error}</CalcNotice> : null}
        <Button className="w-full" onClick={calculate}>
          Calcular avaliação corporal
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da avaliação">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Gordura corporal" value={result.bf.toFixed(1)} unit="%" />
            <ResultStat label="Massa magra" value={result.lean.toFixed(1)} unit="kg" />
            <ResultStat label="Massa gorda" value={result.fat.toFixed(1)} unit="kg" />
            <ResultStat label="Gasto em repouso" value={result.tmb} unit="kcal por dia" />
          </div>
          <p className="text-sm text-muted-foreground">
            A estimativa usa apenas circunferências, então serve para acompanhar a evolução ao longo
            do tempo. Para um número preciso, a avaliação é feita na consulta.
          </p>
        </CalcCard>
      ) : null}
    </>
  );
}
