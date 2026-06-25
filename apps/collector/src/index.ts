import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import { loadOffsets, saveOffsets } from './offsets';
import { readNewLines } from './scan';
import { uploadLines } from './upload';

export function walkJsonl(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`skip unreadable dir: ${dir}: ${msg}`);
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(p);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`skip unreadable entry: ${p}: ${msg}`);
      continue;
    }
    if (st.isDirectory()) out.push(...walkJsonl(p));
    else if (name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

async function main() {
  if (!config.uploadedBy) throw new Error('UPLOADED_BY is required');
  if (!existsSync(config.claudeDir)) {
    console.log(`claude dir not found, nothing to collect: ${config.claudeDir}`);
    return;
  }
  const offsets = loadOffsets(config.offsetsPath);
  for (const file of walkJsonl(config.claudeDir)) {
    const { lines, newOffset } = readNewLines(file, offsets[file] ?? 0);
    if (lines.length) {
      await uploadLines(config.ingestUrl, config.uploadedBy, lines.map((rawJson) => ({ sourceFile: file, rawJson })));
    }
    offsets[file] = newOffset;
  }
  saveOffsets(config.offsetsPath, offsets);
}
// Only run main() when this file is executed directly (not when imported in tests)
if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
