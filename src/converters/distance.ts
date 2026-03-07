import { Detail, DistanceUnit } from "../types";
import { fmt } from "../utils";

const TO_METERS: Record<DistanceUnit, number> = {
  km: 1000,
  m: 1,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  ft: 0.3048,
  in: 0.0254,
  yd: 0.9144,
};

const DISTANCE_LABELS: Record<DistanceUnit, string> = {
  km: "Kilometers (km)",
  m: "Meters (m)",
  cm: "Centimeters (cm)",
  mm: "Millimeters (mm)",
  mi: "Miles (mi)",
  ft: "Feet (ft)",
  in: "Inches (in)",
  yd: "Yards (yd)",
};

export function distanceResults(value: number, unit: DistanceUnit): Detail[] {
  const meters = value * TO_METERS[unit];
  return (Object.keys(TO_METERS) as DistanceUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: DISTANCE_LABELS[u], value: fmt(meters / TO_METERS[u]) }));
}
