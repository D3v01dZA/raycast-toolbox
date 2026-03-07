import { Detail, DurationUnit } from "../types";
import { fmt } from "../utils";

const TO_MS: Record<DurationUnit, number> = {
  ms: 1,
  s: 1000,
  min: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  wk: 604_800_000,
  mo: 2_629_746_000,
  yr: 31_556_952_000,
};

const DURATION_LABELS: Record<DurationUnit, string> = {
  ms: "Milliseconds (ms)",
  s: "Seconds (s)",
  min: "Minutes (min)",
  h: "Hours (h)",
  d: "Days (d)",
  wk: "Weeks (wk)",
  mo: "Months (mo)",
  yr: "Years (yr)",
};

export function durationResults(value: number, unit: DurationUnit): Detail[] {
  const ms = value * TO_MS[unit];
  return (Object.keys(TO_MS) as DurationUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: DURATION_LABELS[u], value: fmt(ms / TO_MS[u]) }));
}
