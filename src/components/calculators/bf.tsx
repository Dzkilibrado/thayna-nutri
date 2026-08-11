import { useState } from "react";

import { CalcCard, ChoiceGroup, NumField, ResultStat } from "@/components/site/calc-ui";
import { Button } from "@/components/ui/button";
import { BIOTYPES, bodyFat, tmb, type Biotype, type Sex } from "@/lib/calculators";

export function Bf() {
  const [sex, setSex] = useState<Sex>("male");
  const [biotype, setBiotype] = useState<Biotype>("meso");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("75");
  const [waist, setWaist] = useState("85");
  const [hip, setHip] = useState("95");
  const [neck, setNeck] = useState("38");
  const [result, setResult] = useState<null | {
    bf: number;
    lean: number;
    fat: number;
    tmb: number;
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
    const fat = (w * bf) / 100;
    setResult({
      bf,
      fat,
      lean: w - fat,
      tmb: tmb(sex, Number(age), Number(height), w, biotype),
    });
  }

  return (
    <>
      <CalcCard title="Sua avaliação corporal">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular sua composição corporal.
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
        <Button className="w-full" onClick={calculate}>
          Calcular avaliação corporal
        </Button>
      </CalcCard>

      {result ? (
        <CalcCard title="Resultados da avaliação">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Percentual de Gordura (BF)" value={result.bf.toFixed(1)} unit="%" />
            <ResultStat label="Massa Magra" value={result.lean.toFixed(1)} unit="kg" />
            <ResultStat label="Massa Gorda" value={result.fat.toFixed(1)} unit="kg" />
            <ResultStat label="Taxa Metabólica Basal" value={result.tmb} unit="kcal" />
          </div>
        </CalcCard>
      ) : null}
    </>
  );
}
