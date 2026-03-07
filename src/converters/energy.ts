import { Detail, EnergyUnit } from "../types";
import { fmt } from "../utils";

const TO_JOULES: Record<EnergyUnit, number> = {
  j: 1,
  kj: 1000,
  cal: 4.184,
  kcal: 4184,
  wh: 3600,
  kwh: 3_600_000,
  ev: 1.602176634e-19,
  btu: 1055.06,
};

const ENERGY_LABELS: Record<EnergyUnit, string> = {
  j: "Joules (J)",
  kj: "Kilojoules (kJ)",
  cal: "Calories (cal)",
  kcal: "Kilocalories (kcal)",
  wh: "Watt-hours (Wh)",
  kwh: "Kilowatt-hours (kWh)",
  ev: "Electronvolts (eV)",
  btu: "BTU",
};

export function energyResults(value: number, unit: EnergyUnit): Detail[] {
  const joules = value * TO_JOULES[unit];
  return (Object.keys(TO_JOULES) as EnergyUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: ENERGY_LABELS[u], value: fmt(joules / TO_JOULES[u]) }));
}
