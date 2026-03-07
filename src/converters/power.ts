import { Detail, PowerUnit } from "../types";
import { fmt } from "../utils";

const TO_WATTS: Record<PowerUnit, number> = {
  w: 1,
  kw: 1000,
  mw: 1_000_000,
  hp: 745.69987,
  btuhr: 0.29307107,
};

const POWER_LABELS: Record<PowerUnit, string> = {
  w: "Watts (W)",
  kw: "Kilowatts (kW)",
  mw: "Megawatts (MW)",
  hp: "Horsepower (hp)",
  btuhr: "BTU/hr",
};

export function powerResults(value: number, unit: PowerUnit): Detail[] {
  const watts = value * TO_WATTS[unit];
  return (Object.keys(TO_WATTS) as PowerUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: POWER_LABELS[u], value: fmt(watts / TO_WATTS[u]) }));
}
