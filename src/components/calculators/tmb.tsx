import { useState } from "react";

import { CalcCard, CalcNotice, NumField, ResultStat } from "@/components/site/calc-ui";
import { BiotypePicker, SexPicker } from "@/components/site/pickers";
import { Button } from "@/components/ui/button";
import { tmb, type Biotype, type Sex } from "@/lib/calculators";

export function Tmb() {
  const [sex, setSex] = useState<Sex>("male");
  const [biotype, setBiotype] = useState<Biotype>("meso");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("77");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  function calculate() {
    const a = Number(age);
    const h = Number(height);
    const w = Number(weight);
    if (!(a > 0) || !(h > 0) || !(w > 0)) {
      setError("Preencha idade, altura e peso para calcular.");
      setResult(null);
      return;
    }
    setError(null);
    setResult(tmb(sex, a, h, w, biotype));
  }

  return (
    <>
      <CalcCard title="Calcule seu gasto em repouso">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para descobrir quantas calorias seu corpo gasta parado.
        </p>
        <SexPicker value={sex} onChange={setSex} />
        <BiotypePicker value={biotype} onChange={setBiotype} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Idade (anos)" value={age} onChange={setAge} />
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" />
        </div>
        {error ? <CalcNotice tone="error">{error}</CalcNotice> : null}
        <Button className="w-full" onClick={calculate}>
          Calcular
        </Button>
      </CalcCard>

      {result !== null ? (
        <CalcCard title="Seu gasto em repouso é">
          <ResultStat label="Taxa metabólica basal" value={result} unit="Kcal por dia" />
          <p className="text-sm text-muted-foreground">
            Essa é a energia que seu corpo gasta só para funcionar, sem contar nada que você faz no
            dia. O gasto real é maior: some o trabalho, o deslocamento e o treino. A calculadora de
            Dieta Rápida já faz essa conta completa.
          </p>
        </CalcCard>
      ) : null}

      <CalcCard title="O que é taxa metabólica basal">
        <p className="text-sm text-muted-foreground">
          É a energia gasta em repouso completo, em temperatura confortável e cerca de 12 horas
          depois da última refeição. O cálculo usa a fórmula de Mifflin-St Jeor, com um ajuste pelo
          biotipo — por isso o resultado pode variar um pouco de outras calculadoras.
        </p>
      </CalcCard>
    </>
  );
}
