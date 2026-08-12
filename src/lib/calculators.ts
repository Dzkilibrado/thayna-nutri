export type Sex = "male" | "female";
export type Biotype = "ecto" | "meso" | "endo";

export const BIOTYPES: { value: Biotype; label: string; hint: string; factor: number }[] = [
  {
    value: "ecto",
    label: "Ectomorfo",
    hint: "Corpo mais fino, ombros estreitos, dificuldade para ganhar peso",
    factor: 1.05,
  },
  {
    value: "meso",
    label: "Mesomorfo",
    hint: "Ombros largos, cintura fina, ganha músculo com facilidade",
    factor: 1,
  },
  {
    value: "endo",
    label: "Endomorfo",
    hint: "Estrutura mais larga, acumula gordura com facilidade",
    factor: 0.95,
  },
];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentário (pouco ou nenhum exercício)" },
  { value: 1.375, label: "Levemente ativo (exercício leve 1-3 dias/semana)" },
  { value: 1.55, label: "Moderadamente ativo (exercício moderado 3-5 dias/semana)" },
  { value: 1.725, label: "Muito ativo (exercício pesado 6-7 dias/semana)" },
  { value: 1.9, label: "Extremamente ativo (exercício muito pesado, trabalho físico)" },
];

/**
 * Gasto do dia a dia FORA do treino, usado na Dieta Avançada.
 * O treino e o cardio entram somados depois, por isso os fatores aqui são
 * menores que os de ACTIVITY_LEVELS (que já embutem o exercício).
 */
export const ROUTINE_LEVELS = [
  { value: 1.15, label: "Trabalho sentado, ando pouco durante o dia" },
  { value: 1.25, label: "Rotina normal, ando um pouco todo dia" },
  { value: 1.35, label: "Fico muito em pé ou ando bastante" },
  { value: 1.5, label: "Trabalho pesado, esforço físico o dia inteiro" },
];

export const GOALS = [
  { value: -0.15, label: "Emagrecer (-15%)" },
  { value: -0.3, label: "Emagrecer Agressivo (-30%)" },
  { value: 0, label: "Manter peso" },
  { value: 0.07, label: "Ganhos Secos (+7%)" },
  { value: 0.15, label: "Ganhar Peso Agressivo (+15%)" },
];

export const BODY_STATES = [
  { value: "lean", label: "Magro", protein: 2.2, fat: 0.8 },
  { value: "moderate", label: "Magro com gordura moderada", protein: 2, fat: 0.7 },
  { value: "skinnyfat", label: "Falso magro (skinny fat)", protein: 2.1, fat: 0.6 },
  { value: "over", label: "Muito acima do peso", protein: 1.8, fat: 0.5 },
];

const biotypeFactor = (b: Biotype) => BIOTYPES.find((x) => x.value === b)?.factor ?? 1;

/** Mifflin-St Jeor, ajustada pelo biotipo. */
export function tmb(sex: Sex, age: number, heightCm: number, weightKg: number, biotype: Biotype) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return Math.max(0, Math.round(base * biotypeFactor(biotype)));
}

/** Katch-McArdle a partir da massa magra. Mais preciso quando a gordura é conhecida. */
export function tmbLean(leanKg: number) {
  return Math.round(370 + 21.6 * leanKg);
}

export type BodyFatInput = {
  sex: Sex;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm: number;
};

/**
 * Percentual de gordura - fórmula da Marinha Americana.
 * Devolve `null` quando as medidas são incompatíveis (ex: cintura menor que o
 * pescoço), em vez de devolver 0 e a tela mostrar "0% de gordura".
 */
export function bodyFat(input: BodyFatInput): number | null {
  const { sex, heightCm, waistCm, neckCm, hipCm } = input;
  if (!(heightCm > 0) || !(waistCm > 0) || !(neckCm > 0)) return null;
  if (sex === "female" && !(hipCm > 0)) return null;

  const inner = sex === "male" ? waistCm - neckCm : waistCm + hipCm - neckCm;
  if (inner <= 0) return null;

  const log10 = Math.log10;
  const bf =
    sex === "male"
      ? 495 / (1.0324 - 0.19077 * log10(inner) + 0.15456 * log10(heightCm)) - 450
      : 495 / (1.29579 - 0.35004 * log10(inner) + 0.221 * log10(heightCm)) - 450;

  if (!Number.isFinite(bf) || bf <= 0) return null;
  return Math.min(70, Math.max(2, bf));
}

/** Mensagem em linguagem simples para medidas que não fecham. */
export function bodyFatError(input: BodyFatInput): string | null {
  if (bodyFat(input) !== null) return null;
  if (input.sex === "male") {
    return "A medida da cintura precisa ser maior que a do pescoço. Confira a fita métrica e tente de novo.";
  }
  return "As medidas não fecham. Confira cintura, quadril e pescoço e tente de novo.";
}

/**
 * Potencial genético — modelo de Casey Butt.
 * O percentual informado é o de GORDURA ALVO (a referência do modelo é 10%
 * para homens e 18% para mulheres), não o percentual atual da pessoa.
 */
export function geneticPotential(input: {
  heightCm: number;
  ankleCm: number;
  wristCm: number;
  targetBfPercent: number;
}) {
  const H = input.heightCm / 2.54;
  const A = input.ankleCm / 2.54;
  const W = input.wristCm / 2.54;
  const bf = input.targetBfPercent / 100;

  const leanLb =
    Math.pow(H, 1.5) * (Math.sqrt(W) / 22.667 + Math.sqrt(A) / 17.0104) * (bf / 2.24 + 1);
  const leanKg = leanLb * 0.4536;
  const maxWeight = leanKg / (1 - bf);

  const inToCm = (v: number) => v * 2.54;
  return {
    maxWeight,
    leanKg,
    arm: inToCm(1.2033 * W + 0.1236 * H),
    forearm: inToCm(0.9626 * W + 0.0989 * H),
    chest: inToCm(1.6817 * W + 1.3759 * A + 0.3314 * H),
    neck: inToCm(1.1424 * W + 0.1236 * H),
    thigh: inToCm(1.3868 * A + 0.1805 * H),
    calf: inToCm(0.9298 * A + 0.121 * H),
  };
}

export type Macros = {
  protein: number;
  fat: number;
  carbs: number;
  /** Calorias que as macros realmente somam — pode passar da meta em déficit forte. */
  actualKcal: number;
  /** true quando proteína + gordura já estouram a meta e o carbo foi zerado. */
  overTarget: boolean;
};

/**
 * Distribui as macros dentro da meta calórica.
 * Quando proteína e gordura sozinhas já passam da meta, o carboidrato vai a zero
 * e `overTarget` sinaliza — a tela precisa avisar, em vez de exibir uma meta que
 * não bate com a soma das macros.
 */
export function macrosFromCalories(
  kcal: number,
  weightKg: number,
  proteinPerKg: number,
  fatPerKg: number,
): Macros {
  const protein = Math.round(proteinPerKg * weightKg);
  const fat = Math.round(fatPerKg * weightKg);
  const floor = protein * 4 + fat * 9;
  const carbs = Math.max(0, Math.round((kcal - floor) / 4));
  const actualKcal = floor + carbs * 4;
  return { protein, fat, carbs, actualKcal, overTarget: floor > kcal };
}

export const CALCULATORS = [
  {
    slug: "dietafacil",
    title: "Dieta Rápida",
    description: "Calorias e macros em 1 minuto a partir dos seus dados básicos.",
    icon: "utensils",
  },
  {
    slug: "dietaavancada",
    title: "Dieta Avançada",
    description: "Calorias por tipo de dia (treino, cardio, descanso) e macros detalhados.",
    icon: "clipboard-list",
  },
  {
    slug: "tmb",
    title: "Taxa Metabólica Basal",
    description: "Descubra quantas calorias seu corpo queima em repouso.",
    icon: "flame",
  },
  {
    slug: "bf",
    title: "Gordura Corporal",
    description: "Percentual de gordura, massa magra, massa gorda e gasto em repouso.",
    icon: "percent",
  },
  {
    slug: "ciclo",
    title: "Ciclo de Carboidratos",
    description: "Monte dias low e high carb mantendo o total semanal.",
    icon: "repeat",
  },
  {
    slug: "whey",
    title: "Whey Protein",
    description: "Compare o custo por grama de proteína entre dois produtos.",
    icon: "milk",
  },
  {
    slug: "potencial",
    title: "Potencial Genético",
    description: "Estimativa do seu máximo natural de massa e medidas.",
    icon: "dna",
  },
] as const;
