import { useState } from "react";

import { CalcCard, ChoiceGroup, NumField, ResultStat } from "@/components/site/calc-ui";
import { Button } from "@/components/ui/button";
import { BIOTYPES, tmb, type Biotype, type Sex } from "@/lib/calculators";

export function Tmb() {
  const [sex, setSex] = useState<Sex>("male");
  const [biotype, setBiotype] = useState<Biotype>("meso");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("77");
  const [result, setResult] = useState<number | null>(null);

  return (
    <>
      <CalcCard title="Calcule sua TMB">
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para calcular sua taxa metabólica basal.
        </p>
        <ChoiceGroup
          label="Gênero"
          value={sex}
          onChange={setSex}
          options={[
            { value: "male", label: "Masculino" },
            { value: "female", label: "Feminino" },
          ]}
        />
        <ChoiceGroup
          label="Biotipo corporal"
          value={biotype}
          onChange={setBiotype}
          options={BIOTYPES.map((b) => ({ value: b.value, label: b.label }))}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumField label="Idade" hint="Sua idade em anos" value={age} onChange={setAge} />
          <NumField label="Altura (cm)" value={height} onChange={setHeight} />
          <NumField label="Peso (kg)" value={weight} onChange={setWeight} step="0.1" />
        </div>
        <Button
          className="w-full"
          onClick={() => setResult(tmb(sex, Number(age), Number(height), Number(weight), biotype))}
        >
          Calcular TMB
        </Button>
      </CalcCard>

      {result !== null ? (
        <CalcCard title="Sua taxa metabólica basal é">
          <ResultStat label="TMB" value={result} unit="Kcal por dia" />
          <p className="text-sm text-muted-foreground">
            Esta é a quantidade de calorias que seu corpo queima em repouso. Para calcular suas
            necessidades diárias totais, multiplique este valor pelo seu nível de atividade física.
          </p>
        </CalcCard>
      ) : null}

      <CalcCard title="O que é Taxa Metabólica Basal?">
        <p className="text-sm text-muted-foreground">
          A Taxa Metabólica Basal (TMB) é a quantidade de energia gasta em repouso, em ambiente de
          temperatura neutra e em estado pós-absortivo (cerca de 12 horas de jejum). Esta
          calculadora utiliza a fórmula de Mifflin-St Jeor, ajustada conforme o biotipo.
        </p>
      </CalcCard>
    </>
  );
}
