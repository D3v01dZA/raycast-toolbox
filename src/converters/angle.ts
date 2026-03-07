import { Detail, AngleUnit } from "../types";
import { fmt } from "../utils";

const TO_DEGREES: Record<AngleUnit, number> = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 0.9,
  turn: 360,
};

const ANGLE_LABELS: Record<AngleUnit, string> = {
  deg: "Degrees (deg)",
  rad: "Radians (rad)",
  grad: "Gradians (grad)",
  turn: "Turns",
};

export function angleResults(value: number, unit: AngleUnit): Detail[] {
  const degrees = value * TO_DEGREES[unit];
  return (Object.keys(TO_DEGREES) as AngleUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: ANGLE_LABELS[u], value: fmt(degrees / TO_DEGREES[u]) }));
}
