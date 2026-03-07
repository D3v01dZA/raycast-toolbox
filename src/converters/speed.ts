import { Detail, SpeedUnit } from "../types";
import { fmt } from "../utils";

const TO_MPS: Record<SpeedUnit, number> = {
  ms: 1,
  kmh: 1 / 3.6,
  mph: 0.44704,
  knot: 0.514444,
  fts: 0.3048,
};

const SPEED_LABELS: Record<SpeedUnit, string> = {
  ms: "Meters/second (m/s)",
  kmh: "Kilometers/hour (km/h)",
  mph: "Miles/hour (mph)",
  knot: "Knots",
  fts: "Feet/second (ft/s)",
};

export function speedResults(value: number, unit: SpeedUnit): Detail[] {
  const mps = value * TO_MPS[unit];
  return (Object.keys(TO_MPS) as SpeedUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: SPEED_LABELS[u], value: fmt(mps / TO_MPS[u]) }));
}
