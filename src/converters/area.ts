import { Detail, AreaUnit } from "../types";
import { fmt } from "../utils";

const TO_SQM: Record<AreaUnit, number> = {
  m2: 1,
  km2: 1_000_000,
  cm2: 0.0001,
  ft2: 0.092903,
  in2: 0.00064516,
  acres: 4046.86,
  ha: 10000,
};

const AREA_LABELS: Record<AreaUnit, string> = {
  m2: "Square Meters (m2)",
  km2: "Square Kilometers (km2)",
  cm2: "Square Centimeters (cm2)",
  ft2: "Square Feet (ft2)",
  in2: "Square Inches (in2)",
  acres: "Acres",
  ha: "Hectares (ha)",
};

export function areaResults(value: number, unit: AreaUnit): Detail[] {
  const sqm = value * TO_SQM[unit];
  return (Object.keys(TO_SQM) as AreaUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: AREA_LABELS[u], value: fmt(sqm / TO_SQM[u]) }));
}
