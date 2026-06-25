import { readNewLines } from './scan';
import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

it('reads only new complete lines from offset', () => {
  const dir = mkdtempSync(join(tmpdir(), 'col-'));
  const f = join(dir, 's.jsonl');
  writeFileSync(f, JSON.stringify({ uuid: 'a' }) + '\n' + JSON.stringify({ uuid: 'b' }) + '\n');
  const first = readNewLines(f, 0);
  expect(first.lines.length).toBe(2);
  // append one complete + one partial line
  const partial = JSON.stringify({ uuid: 'c' }) + '\n' + '{"uuid":"d"';
  writeFileSync(f, JSON.stringify({ uuid: 'a' }) + '\n' + JSON.stringify({ uuid: 'b' }) + '\n' + partial);
  const second = readNewLines(f, first.newOffset);
  expect(second.lines.map((l: any) => l.uuid)).toEqual(['c']); // 'd' is partial, held back
});
