import { Detail } from "../types";

export function numberBaseResults(text: string): Detail[] {
  const t = text.trim();
  let decimal: number | null = null;

  // Prefix notation: 0b, 0o, 0x
  if (/^0b[01]+$/i.test(t)) {
    decimal = parseInt(t.slice(2), 2);
  } else if (/^0o[0-7]+$/i.test(t)) {
    decimal = parseInt(t.slice(2), 8);
  } else if (/^0x[0-9a-f]+$/i.test(t)) {
    decimal = parseInt(t.slice(2), 16);
  }
  // Suffix notation
  else if (/^[01]+b$/i.test(t)) {
    decimal = parseInt(t.slice(0, -1), 2);
  } else if (/^[0-7]+o$/i.test(t)) {
    decimal = parseInt(t.slice(0, -1), 8);
  } else if (/^[0-9a-f]+h$/i.test(t)) {
    decimal = parseInt(t.slice(0, -1), 16);
  } else if (/^[0-9]+d$/i.test(t)) {
    decimal = parseInt(t.slice(0, -1), 10);
  }
  // Plain integer (decimal only — avoids false-positives on floats/dates)
  else if (/^[0-9]+$/.test(t)) {
    decimal = parseInt(t, 10);
  }

  if (decimal === null || isNaN(decimal) || !isFinite(decimal)) return [];

  const bin = decimal.toString(2);
  const oct = decimal.toString(8);
  const dec = decimal.toString(10);
  const hex = decimal.toString(16).toUpperCase();

  return [
    { type: "Decimal (base 10)", value: dec },
    { type: "Binary (base 2)", value: "0b" + bin },
    { type: "Binary (base 2) raw", value: bin },
    { type: "Octal (base 8)", value: "0o" + oct },
    { type: "Octal (base 8) raw", value: oct },
    { type: "Hexadecimal (base 16)", value: "0x" + hex },
    { type: "Hexadecimal (base 16) raw", value: hex },
  ].filter((r) => r.value.toLowerCase() !== t.toLowerCase());
}
