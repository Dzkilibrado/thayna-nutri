import { useState } from "react";

import { CalcCard, CalcNotice, NumField, ResultStat, SelectField } from "@/components/site/calc-ui";
import { SexPicker } from "@/components/site/pickers";
import { Button } from "@/components/ui/button";
import { geneticPotential, type Sex } from "@/lib/calculators";

export function Potencial() {
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState("175");
  const [ankle, setAnkle] = useState("22");
  const [wrist, setWrist] = useState("17");
  const [targetBf, setTargetBf] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof geneticPotential> | null>(null);

  function calculate() {
    const h = Number(height);
    const a = Number(ankle);
    const w = Number(wrist);
    if (!(h > 0) || !(a > 0) || !(w > 0)) {
      setError("Preencha altura, tornozelo e punho para calcular.");
      setResult(null);
      return;
    }
    setError(null);
    setResult(geneticPotential({ heightCm: h, ankleCm: a, wristCm: w, targetBfPercent: targetBf }));
  }

  const targets =
    sex === "male"
      ? [
          { value: 6, label: "6% — bem definido, nível de palco" },
          { value: 10, label: "10% — seco, abdômen à mostra" },
          { value: 15, label: "15% — em forma, sem definição extrema" },
        ]
      : [
          { value: 14, label: "14% — bem definida, nível de palco" },
          { value: 18, label: "18% — seca, abdômen à mostra" },
          { value: 24, label: "24% — em forma, sem definição extrema" },
        ];

  return (
    <>
      <CalcCard title="Seu potencial genético">
        <p className="text-sm text-muted-foreground">
          A estimativa parte da sua estrutura óssea. Punho e tornozelo quase não mudam com treino ou
          dieta, por isso servem de referência para o quanto de músculo seu corpo comporta.
        </p>
        <SexPicker
          value={sex}
          onChange={(v) => {
            setSex(v);
            setTargetBf(v === "male" ? 10 : 18);
          }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField
            label="Punho (cm)"
            hint="Meça no ponto mais fino, logo abaixo da mão"
            value={wrist}
            onChange={setWrist}
            step="0.1"
          />
          <NumField
            label="Tornozelo (cm)"
            hint="Meça no ponto mais fino, logo acima do pé"
            value={ankle}
            onChange={setAnkle}
            step="0.1"
          />
        </div>
        <SelectField
          label="Com quanta gordura você quer estar"
          value={targetBf}
          onChange={setTargetBf}
          options={targets}
        />
        <p className="text-[11px] text-muted-foreground">
          Escolha o shape que você quer alcançar, não o seu percentual de gordura de hoje. Os
          números abaixo são o seu máximo já nesse nível de definição.
        </p>
        {error ? <CalcNotice tone="error">{error}</CalcNotice> : null}
        <Button className="w-full" onClick={calculate}>
          Calcular potencial
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title={`Seu máximo com ${targetBf}% de gordura`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Peso máximo" value={result.maxWeight.toFixed(1)} unit="kg" />
            <ResultStat label="Massa magra máxima" value={result.leanKg.toFixed(1)} unit="kg" />
            <ResultStat label="Braço contraído" value={result.arm.toFixed(1)} unit="cm" />
            <ResultStat label="Antebraço" value={result.forearm.toFixed(1)} unit="cm" />
            <ResultStat label="Peitoral" value={result.chest.toFixed(1)} unit="cm" />
            <ResultStat label="Pescoço" value={result.neck.toFixed(1)} unit="cm" />
            <ResultStat label="Coxa" value={result.thigh.toFixed(1)} unit="cm" />
            <ResultStat label="Panturrilha" value={result.calf.toFixed(1)} unit="cm" />
          </div>
          <CalcNotice>
            São metas de longo prazo, para quem treina de forma consistente por anos e sem
            substâncias. Não é uma previsão de onde você vai chegar este ano.
          </CalcNotice>
        </CalcCard>
      ) : null}
    </>
  );
}
