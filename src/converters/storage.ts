import { Detail, StorageUnit } from "../types";
import { fmt } from "../utils";

const TO_BYTES: Record<StorageUnit, number> = {
  b: 1,
  kb: 1000,
  mb: 1000 ** 2,
  gb: 1000 ** 3,
  tb: 1000 ** 4,
  pb: 1000 ** 5,
  kib: 1024,
  mib: 1024 ** 2,
  gib: 1024 ** 3,
  tib: 1024 ** 4,
  pib: 1024 ** 5,
};

const STORAGE_LABELS: Record<StorageUnit, string> = {
  b: "Bytes (B)",
  kb: "Kilobytes (KB)",
  mb: "Megabytes (MB)",
  gb: "Gigabytes (GB)",
  tb: "Terabytes (TB)",
  pb: "Petabytes (PB)",
  kib: "Kibibytes (KiB)",
  mib: "Mebibytes (MiB)",
  gib: "Gibibytes (GiB)",
  tib: "Tebibytes (TiB)",
  pib: "Pebibytes (PiB)",
};

export function storageResults(value: number, unit: StorageUnit): Detail[] {
  const bytes = value * TO_BYTES[unit];
  return (Object.keys(TO_BYTES) as StorageUnit[])
    .filter((u) => u !== unit)
    .map((u) => ({ type: STORAGE_LABELS[u], value: fmt(bytes / TO_BYTES[u]) }));
}
