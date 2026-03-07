import { Detail, VolumeUnit } from "../types";
import { fmt } from "../utils";

const TO_LITERS: Record<VolumeUnit, number> = {
  l: 1,
  ml: 0.001,
  gal: 3.78541,
  qt: 0.946353,
  pt: 0.473176,
  floz: 0.0295735,
  cup: 0.236588,
};

const VOLUME_LABELS: Record<VolumeUnit, string> = {
  l: "Liters (L)",
  ml: "Milliliters (mL)",
  gal: "Gallons (gal)",
  qt: "Quarts (qt)",
  pt: "Pints (pt)",
  floz: "Fluid Ounces (fl oz)",
  cup: "Cups",
};

export function volumeResults(value: number, unit: VolumeUnit): Detail[] {
  const liters = value * TO_LITERS[unit];
  return (Object.keys(TO_LITERS) as VolumeUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: VOLUME_LABELS[u], value: fmt(liters / TO_LITERS[u]) }));
}
