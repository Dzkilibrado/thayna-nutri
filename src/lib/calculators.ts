export type Sex = "male" | "female";
export type Biotype = "ecto" | "meso" | "endo";

export const BIOTYPES: { value: Biotype; label: string; factor: number }[] = [
  { value: "ecto", label: "Ectomorfo", factor: 1.05 },
  { value: "meso", label: "Mesomorfo", factor: 1 },
  { value: "endo", label: "Endomorfo", factor: 0.95 },
];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentário (pouco ou nenhum exercício)" },
  { value: 1.375, label: "Levemente ativo (exercício leve 1-3 dias/semana)" },
  { value: 1.55, label: "Moderadamente ativo (exercício moderado 3-5 dias/semana)" },
  { value: 1.725, label: "Muito ativo (exercício pesado 6-7 dias/semana)" },
  { value: 1.9, label: "Extremamente ativo (exercício muito pesado, trabalho físico)" },
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
  const base =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return Math.max(0, Math.round(base * biotypeFactor(biotype)));
}

/** Katch-McArdle a partir da massa magra. */
export function tmbLean(leanKg: number) {
  return Math.round(370 + 21.6 * leanKg);
}

/** Percentual de gordura — fórmula da Marinha Americana (US Navy). */
export function bodyFat(input: {
  sex: Sex;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm: number;
}) {
  const { sex, heightCm, waistCm, neckCm, hipCm } = input;
  const log10 = Math.log10;
  const bf =
    sex === "male"
      ? 495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450
      : 495 /
          (1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm)) -
        450;
  if (!Number.isFinite(bf)) return 0;
  return Math.min(70, Math.max(2, bf));
}

/** Potencial genético — modelo de Casey Butt. */
export function geneticPotential(input: {
  heightCm: number;
  ankleCm: number;
  wristCm: number;
  bfPercent: number;
}) {
  const H = input.heightCm / 2.54;
  const A = input.ankleCm / 2.54;
  const W = input.wristCm / 2.54;
  const bf = input.bfPercent / 100;

  const leanLb =
    Math.pow(H, 1.5) *
    (Math.sqrt(W) / 22.667 + Math.sqrt(A) / 17.0104) *
    (bf / 2.24 + 1);
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

export function macrosFromCalories(kcal: number, weightKg: number, proteinPerKg: number, fatPerKg: number) {
  const protein = Math.round(proteinPerKg * weightKg);
  const fat = Math.round(fatPerKg * weightKg);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
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
    title: "Gordura Corporal (BF)",
    description: "Percentual de gordura, massa magra, massa gorda e TMB.",
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
