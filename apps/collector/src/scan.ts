import { readFileSync, statSync } from 'fs';

export function readNewLines(filePath: string, fromOffset: number): { lines: Record<string, unknown>[]; newOffset: number } {
  const size = statSync(filePath).size;
  if (size <= fromOffset) return { lines: [], newOffset: fromOffset };
  const buf = readFileSync(filePath);
  const slice = buf.subarray(fromOffset, size);
  const lastNl = slice.lastIndexOf(0x0a); // hold back partial trailing line
  if (lastNl < 0) return { lines: [], newOffset: fromOffset };
  const complete = slice.subarray(0, lastNl).toString('utf8');
  const lines: Record<string, unknown>[] = [];
  for (const raw of complete.split('\n')) {
    const t = raw.trim();
    if (!t) continue;
    try { lines.push(JSON.parse(t)); } catch { /* skip malformed */ }
  }
  return { lines, newOffset: fromOffset + lastNl + 1 };
}
