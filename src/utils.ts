export function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  return parseFloat(n.toPrecision(6)).toString();
}

export function parseInput(text: string): { value: number; rawUnit: string } | null {
  const match = text.trim().match(/^([\d.]+)\s*(.+)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value)) return null;
  return { value, rawUnit: match[2].trim() };
}
