import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import { loadOffsets, saveOffsets } from './offsets';
import { readNewLines } from './scan';
import { uploadLines } from './upload';

function walkJsonl(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkJsonl(p));
    else if (name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

async function main() {
  if (!config.uploadedBy) throw new Error('UPLOADED_BY is required');
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
main().catch((e) => { console.error(e); process.exit(1); });
