import { Detail, FrequencyUnit } from "../types";
import { fmt } from "../utils";

const TO_HZ: Record<FrequencyUnit, number> = {
  hz: 1,
  khz: 1000,
  mhz: 1_000_000,
  ghz: 1_000_000_000,
  rpm: 1 / 60,
};

const FREQUENCY_LABELS: Record<FrequencyUnit, string> = {
  hz: "Hertz (Hz)",
  khz: "Kilohertz (kHz)",
  mhz: "Megahertz (MHz)",
  ghz: "Gigahertz (GHz)",
  rpm: "RPM",
};

export function frequencyResults(value: number, unit: FrequencyUnit): Detail[] {
  const hz = value * TO_HZ[unit];
  return (Object.keys(TO_HZ) as FrequencyUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: FREQUENCY_LABELS[u], value: fmt(hz / TO_HZ[u]) }));
}
