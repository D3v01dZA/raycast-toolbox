export interface Detail {
  value: string;
  type: string;
}

export interface Section {
  category: string;
  results: Detail[];
}

export type DistanceUnit = "km" | "m" | "cm" | "mm" | "mi" | "ft" | "in" | "yd";
export type WeightUnit = "kg" | "g" | "mg" | "lb" | "oz" | "t";
export type AreaUnit = "m2" | "km2" | "cm2" | "ft2" | "in2" | "acres" | "ha";
export type VolumeUnit = "l" | "ml" | "gal" | "qt" | "pt" | "floz" | "cup";
export type TemperatureUnit = "C" | "F" | "K";
export type DurationUnit = "ms" | "s" | "min" | "h" | "d" | "wk" | "mo" | "yr";
export type AngleUnit = "deg" | "rad" | "grad" | "turn";
export type EnergyUnit = "j" | "kj" | "cal" | "kcal" | "wh" | "kwh" | "ev" | "btu";
export type FrequencyUnit = "hz" | "khz" | "mhz" | "ghz" | "rpm";
export type PowerUnit = "w" | "kw" | "mw" | "hp" | "btuhr";
export type SpeedUnit = "ms" | "kmh" | "mph" | "knot" | "fts";
export type StorageUnit = "b" | "kb" | "mb" | "gb" | "tb" | "pb" | "kib" | "mib" | "gib" | "tib" | "pib";

export type AnyUnit =
  | DistanceUnit
  | WeightUnit
  | AreaUnit
  | VolumeUnit
  | TemperatureUnit
  | DurationUnit
  | AngleUnit
  | EnergyUnit
  | FrequencyUnit
  | PowerUnit
  | SpeedUnit
  | StorageUnit;
