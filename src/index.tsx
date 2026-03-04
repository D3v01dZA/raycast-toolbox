import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import moment from "moment";

interface Detail {
  value: string;
  type: string;
}

interface Section {
  category: string;
  results: Detail[];
}

// ---------------------------------------------------------------------------
// Formatting helper
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  return parseFloat(n.toPrecision(6)).toString();
}

// ---------------------------------------------------------------------------
// Unit types
// ---------------------------------------------------------------------------

type DistanceUnit = "km" | "m" | "cm" | "mm" | "mi" | "ft" | "in" | "yd";
type WeightUnit = "kg" | "g" | "mg" | "lb" | "oz" | "t";
type AreaUnit = "m2" | "km2" | "cm2" | "ft2" | "in2" | "acres" | "ha";
type VolumeUnit = "l" | "ml" | "gal" | "qt" | "pt" | "floz" | "cup";
type TemperatureUnit = "C" | "F" | "K";
type DurationUnit = "ms" | "s" | "min" | "h" | "d" | "wk" | "mo" | "yr";

type AnyUnit = DistanceUnit | WeightUnit | AreaUnit | VolumeUnit | TemperatureUnit | DurationUnit;

// ---------------------------------------------------------------------------
// Unit alias normalization
// ---------------------------------------------------------------------------

const UNIT_ALIASES: Record<string, AnyUnit> = {
  // Distance
  km: "km",
  kilometer: "km",
  kilometers: "km",
  kilometre: "km",
  kilometres: "km",
  m: "m",
  meter: "m",
  meters: "m",
  metre: "m",
  metres: "m",
  cm: "cm",
  centimeter: "cm",
  centimeters: "cm",
  centimetre: "cm",
  centimetres: "cm",
  mm: "mm",
  millimeter: "mm",
  millimeters: "mm",
  millimetre: "mm",
  millimetres: "mm",
  mi: "mi",
  mile: "mi",
  miles: "mi",
  ft: "ft",
  foot: "ft",
  feet: "ft",
  in: "in",
  inch: "in",
  inches: "in",
  yd: "yd",
  yard: "yd",
  yards: "yd",

  // Weight
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  g: "g",
  gram: "g",
  grams: "g",
  mg: "mg",
  milligram: "mg",
  milligrams: "mg",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  t: "t",
  ton: "t",
  tons: "t",
  tonne: "t",
  tonnes: "t",
  "metric ton": "t",
  "metric tons": "t",

  // Area
  m2: "m2",
  sqm: "m2",
  "square meter": "m2",
  "square meters": "m2",
  "square metre": "m2",
  "square metres": "m2",
  "meters squared": "m2",
  "metres squared": "m2",
  "square m": "m2",
  "m squared": "m2",
  km2: "km2",
  "square kilometer": "km2",
  "square kilometers": "km2",
  "square kilometre": "km2",
  "square kilometres": "km2",
  "kilometers squared": "km2",
  "kilometres squared": "km2",
  "square km": "km2",
  "km squared": "km2",
  cm2: "cm2",
  sqcm: "cm2",
  "square centimeter": "cm2",
  "square centimeters": "cm2",
  "square centimetre": "cm2",
  "square centimetres": "cm2",
  "centimeters squared": "cm2",
  "square cm": "cm2",
  "cm squared": "cm2",
  ft2: "ft2",
  sqft: "ft2",
  "square foot": "ft2",
  "square feet": "ft2",
  "feet squared": "ft2",
  "square ft": "ft2",
  "ft squared": "ft2",
  in2: "in2",
  sqin: "in2",
  "square inch": "in2",
  "square inches": "in2",
  "inches squared": "in2",
  "square in": "in2",
  "in squared": "in2",
  acres: "acres",
  acre: "acres",
  ha: "ha",
  hectare: "ha",
  hectares: "ha",

  // Volume
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  gal: "gal",
  gallon: "gal",
  gallons: "gal",
  qt: "qt",
  quart: "qt",
  quarts: "qt",
  pt: "pt",
  pint: "pt",
  pints: "pt",
  floz: "floz",
  "fl oz": "floz",
  "fluid ounce": "floz",
  "fluid ounces": "floz",
  cup: "cup",
  cups: "cup",

  // Temperature
  c: "C",
  celsius: "C",
  "degrees celsius": "C",
  "degree celsius": "C",
  "degrees c": "C",
  f: "F",
  fahrenheit: "F",
  "degrees fahrenheit": "F",
  "degree fahrenheit": "F",
  "degrees f": "F",
  k: "K",
  kelvin: "K",

  // Duration
  ms: "ms",
  millisecond: "ms",
  milliseconds: "ms",
  s: "s",
  sec: "s",
  secs: "s",
  second: "s",
  seconds: "s",
  min: "min",
  mins: "min",
  minute: "min",
  minutes: "min",
  h: "h",
  hr: "h",
  hrs: "h",
  hour: "h",
  hours: "h",
  d: "d",
  day: "d",
  days: "d",
  wk: "wk",
  week: "wk",
  weeks: "wk",
  mo: "mo",
  month: "mo",
  months: "mo",
  yr: "yr",
  year: "yr",
  years: "yr",
};

function normalizeUnit(raw: string): AnyUnit | null {
  return UNIT_ALIASES[raw.toLowerCase().trim()] ?? null;
}

const DISTANCE_UNITS = new Set<AnyUnit>(["km", "m", "cm", "mm", "mi", "ft", "in", "yd"]);
const WEIGHT_UNITS = new Set<AnyUnit>(["kg", "g", "mg", "lb", "oz", "t"]);
const AREA_UNITS = new Set<AnyUnit>(["m2", "km2", "cm2", "ft2", "in2", "acres", "ha"]);
const VOLUME_UNITS = new Set<AnyUnit>(["l", "ml", "gal", "qt", "pt", "floz", "cup"]);
const TEMP_UNITS = new Set<AnyUnit>(["C", "F", "K"]);
const DURATION_UNITS = new Set<AnyUnit>(["ms", "s", "min", "h", "d", "wk", "mo", "yr"]);

// ---------------------------------------------------------------------------
// Input parser
// ---------------------------------------------------------------------------

function parseInput(text: string): { value: number; rawUnit: string } | null {
  const match = text.trim().match(/^([\d.]+)\s*(.+)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value)) return null;
  return { value, rawUnit: match[2].trim() };
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

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

function distanceResults(value: number, unit: DistanceUnit): Detail[] {
  const meters = value * TO_METERS[unit];
  return (Object.keys(TO_METERS) as DistanceUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: DISTANCE_LABELS[u], value: fmt(meters / TO_METERS[u]) }));
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

const TO_GRAMS: Record<WeightUnit, number> = {
  kg: 1000,
  g: 1,
  mg: 0.001,
  lb: 453.592,
  oz: 28.3495,
  t: 1_000_000,
};

const WEIGHT_LABELS: Record<WeightUnit, string> = {
  kg: "Kilograms (kg)",
  g: "Grams (g)",
  mg: "Milligrams (mg)",
  lb: "Pounds (lb)",
  oz: "Ounces (oz)",
  t: "Metric Tons (t)",
};

function weightResults(value: number, unit: WeightUnit): Detail[] {
  const grams = value * TO_GRAMS[unit];
  return (Object.keys(TO_GRAMS) as WeightUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: WEIGHT_LABELS[u], value: fmt(grams / TO_GRAMS[u]) }));
}

// ---------------------------------------------------------------------------
// Area
// ---------------------------------------------------------------------------

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

function areaResults(value: number, unit: AreaUnit): Detail[] {
  const sqm = value * TO_SQM[unit];
  return (Object.keys(TO_SQM) as AreaUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: AREA_LABELS[u], value: fmt(sqm / TO_SQM[u]) }));
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

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

function volumeResults(value: number, unit: VolumeUnit): Detail[] {
  const liters = value * TO_LITERS[unit];
  return (Object.keys(TO_LITERS) as VolumeUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: VOLUME_LABELS[u], value: fmt(liters / TO_LITERS[u]) }));
}

// ---------------------------------------------------------------------------
// Temperature
// ---------------------------------------------------------------------------

function toC(value: number, unit: TemperatureUnit): number {
  if (unit === "C") return value;
  if (unit === "F") return (value - 32) * (5 / 9);
  return value - 273.15; // K
}

function fromC(celsius: number, unit: TemperatureUnit): number {
  if (unit === "C") return celsius;
  if (unit === "F") return celsius * (9 / 5) + 32;
  return celsius + 273.15; // K
}

const TEMP_LABELS: Record<TemperatureUnit, string> = {
  C: "Celsius (C)",
  F: "Fahrenheit (F)",
  K: "Kelvin (K)",
};

function temperatureResults(value: number, unit: TemperatureUnit): Detail[] {
  const celsius = toC(value, unit);
  return (["C", "F", "K"] as TemperatureUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: TEMP_LABELS[u], value: fmt(fromC(celsius, u)) }));
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

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

function durationResults(value: number, unit: DurationUnit): Detail[] {
  const ms = value * TO_MS[unit];
  return (Object.keys(TO_MS) as DurationUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: DURATION_LABELS[u], value: fmt(ms / TO_MS[u]) }));
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

function conversionSections(text: string): Section[] {
  const sections: Section[] = [];
  const parsed = parseInput(text);
  if (!parsed) return sections;

  const { value, rawUnit } = parsed;
  const unit = normalizeUnit(rawUnit);
  if (unit === null) return sections;

  if (DISTANCE_UNITS.has(unit))
    sections.push({ category: "Distance", results: distanceResults(value, unit as DistanceUnit) });
  if (WEIGHT_UNITS.has(unit)) sections.push({ category: "Weight", results: weightResults(value, unit as WeightUnit) });
  if (AREA_UNITS.has(unit)) sections.push({ category: "Area", results: areaResults(value, unit as AreaUnit) });
  if (VOLUME_UNITS.has(unit)) sections.push({ category: "Volume", results: volumeResults(value, unit as VolumeUnit) });
  if (TEMP_UNITS.has(unit))
    sections.push({ category: "Temperature", results: temperatureResults(value, unit as TemperatureUnit) });
  if (DURATION_UNITS.has(unit))
    sections.push({ category: "Duration", results: durationResults(value, unit as DurationUnit) });

  return sections;
}

// ---------------------------------------------------------------------------
// Date & Time (unchanged)
// ---------------------------------------------------------------------------

function timeResults(text: string): Detail[] {
  const results: Detail[] = [];

  function addDate(date: moment.Moment, isNow: boolean) {
    results.push({ value: date.utc().toISOString(), type: "Date UTC" });
    results.push({ value: date.local().toISOString(true), type: "Date" });
    results.push({ value: date.unix() + "", type: "Epoch" });
    results.push({ value: date.valueOf() + "", type: "Epoch Millis" });
    if (!isNow) {
      results.push({ value: date.fromNow(), type: "Difference" });
      const difference = moment.duration(date.diff(moment()));
      results.push({ value: difference.asMilliseconds() + "", type: "Difference Milliseconds" });
      results.push({ value: Math.round(difference.asSeconds()) + "", type: "Difference Seconds" });
      results.push({ value: Math.round(difference.asMinutes()) + "", type: "Difference Minutes" });
      results.push({ value: Math.round(difference.asHours()) + "", type: "Difference Hours" });
      results.push({ value: Math.round(difference.asDays()) + "", type: "Difference Days" });
      results.push({ value: Math.round(difference.asMonths()) + "", type: "Difference Months" });
      results.push({ value: Math.round(difference.asYears()) + "", type: "Difference Years" });
    }
  }

  if (text.length === 10) {
    const epoch = Number(text + "000");
    if (!isNaN(epoch)) addDate(moment(epoch), false);
  }
  if (text.length === 13) {
    const epoch = Number(text);
    if (!isNaN(epoch)) addDate(moment(epoch), false);
  }
  if (text.toLocaleLowerCase() === "now") {
    addDate(moment(), true);
  }
  const other = moment(text);
  if (other.isValid()) addDate(other, false);

  return results;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  const [text, setText] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (text === "") {
      setSections([]);
      return;
    }

    const all: Section[] = [...conversionSections(text)];

    const time = timeResults(text);
    if (time.length > 0) {
      all.push({ category: "Date & Time", results: time });
    }

    setSections(all);
  }, [text]);

  return (
    <List onSearchTextChange={setText} searchBarPlaceholder="Convert something... (e.g. 5km, 100f, 72kg)" throttle>
      {sections.map((section) => (
        <List.Section key={section.category} title={section.category}>
          {section.results.map((result, index) => (
            <List.Item
              key={index}
              title={result.type}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy to Clipboard" content={result.value} />
                </ActionPanel>
              }
              accessories={[{ text: result.value }]}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
