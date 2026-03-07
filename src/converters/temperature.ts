import { Detail, TemperatureUnit } from "../types";
import { fmt } from "../utils";

export function toC(value: number, unit: TemperatureUnit): number {
  if (unit === "C") return value;
  if (unit === "F") return (value - 32) * (5 / 9);
  return value - 273.15; // K
}

export function fromC(celsius: number, unit: TemperatureUnit): number {
  if (unit === "C") return celsius;
  if (unit === "F") return celsius * (9 / 5) + 32;
  return celsius + 273.15; // K
}

const TEMP_LABELS: Record<TemperatureUnit, string> = {
  C: "Celsius (C)",
  F: "Fahrenheit (F)",
  K: "Kelvin (K)",
};

export function temperatureResults(value: number, unit: TemperatureUnit): Detail[] {
  const celsius = toC(value, unit);
  return (["C", "F", "K"] as TemperatureUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: TEMP_LABELS[u], value: fmt(fromC(celsius, u)) }));
}
