import { Detail, WeightUnit } from "../types";
import { fmt } from "../utils";

const TO_GRAMS: Record<WeightUnit, number> = {
  kg: 1000,
  g: 1,
  mg: 0.001,
  lb: 453.592,
  oz: 28.3495,
  t: 1_000_000,
};

const WEIGHT_LABELS: Record<WeightUnit, string> = {
  kg: "Kilograms (kg)",
  g: "Grams (g)",
  mg: "Milligrams (mg)",
  lb: "Pounds (lb)",
  oz: "Ounces (oz)",
  t: "Metric Tons (t)",
};

export function weightResults(value: number, unit: WeightUnit): Detail[] {
  const grams = value * TO_GRAMS[unit];
  return (Object.keys(TO_GRAMS) as WeightUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: WEIGHT_LABELS[u], value: fmt(grams / TO_GRAMS[u]) }));
}
