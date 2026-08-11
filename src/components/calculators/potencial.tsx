import { useState } from "react";

import { CalcCard, NumField, ResultStat } from "@/components/site/calc-ui";
import { Button } from "@/components/ui/button";
import { geneticPotential } from "@/lib/calculators";

export function Potencial() {
  const [height, setHeight] = useState("175");
  const [ankle, setAnkle] = useState("22");
  const [wrist, setWrist] = useState("17");
  const [bf, setBf] = useState("12");
  const [result, setResult] = useState<ReturnType<typeof geneticPotential> | null>(null);

  return (
    <>
      <CalcCard title="Seu potencial genético">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular seu potencial máximo de desenvolvimento muscular.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField
            label="Altura (cm)"
            hint="Sua altura em centímetros"
            value={height}
            onChange={setHeight}
          />
          <NumField
            label="Circunferência do tornozelo (cm)"
            hint="Medida mais fina acima do pé"
            value={ankle}
            onChange={setAnkle}
            step="0.1"
          />
          <NumField
            label="Circunferência do punho (cm)"
            hint="Medida abaixo da mão"
            value={wrist}
            onChange={setWrist}
            step="0.1"
          />
          <NumField
            label="Percentual de gordura corporal (%)"
            hint="Estimativa de gordura corporal"
            value={bf}
            onChange={setBf}
            step="0.1"
          />
        </div>
        <Button
          className="w-full"
          onClick={() =>
            setResult(
              geneticPotential({
                heightCm: Number(height),
                ankleCm: Number(ankle),
                wristCm: Number(wrist),
                bfPercent: Number(bf),
              }),
            )
          }
        >
          Calcular potencial
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Seu potencial máximo">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Peso Máximo" value={result.maxWeight.toFixed(1)} unit="kg" />
            <ResultStat label="Massa Magra Máxima" value={result.leanKg.toFixed(1)} unit="kg" />
            <ResultStat label="Braço Contraído" value={result.arm.toFixed(1)} unit="cm" />
            <ResultStat label="Antebraço Máximo" value={result.forearm.toFixed(1)} unit="cm" />
            <ResultStat label="Peitoral Máximo" value={result.chest.toFixed(1)} unit="cm" />
            <ResultStat label="Pescoço Máximo" value={result.neck.toFixed(1)} unit="cm" />
            <ResultStat label="Coxa Máxima" value={result.thigh.toFixed(1)} unit="cm" />
            <ResultStat label="Panturrilha Máxima" value={result.calf.toFixed(1)} unit="cm" />
          </div>
        </CalcCard>
      ) : null}

      <CalcCard title="Como funciona esta calculadora?">
        <p className="text-sm text-muted-foreground">
          A estimativa correlaciona a estrutura óssea (punho e tornozelo) com o potencial máximo de
          desenvolvimento muscular natural. Os valores representam metas de longo prazo, atingíveis
          com anos de treino consistente e nutrição adequada.
        </p>
      </CalcCard>
    </>
  );
}
